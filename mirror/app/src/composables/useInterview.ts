/**
 * Interview orchestration composable.
 *
 * All LLM interaction happens here — the store modules manage only data.
 * Takes a `mirrorStore` obtained via `useMirrorStore()` and returns
 * `{ beginInterview, submitAnswer, probeMore, abort, finishEarly }`.
 */
import { createLLMClient, type LLMClient, type Message } from "@nc-750/llm-ts";
import {
  buildProbePrompt,
  PROBE_SCHEMA_NAME,
  PROBE_JSON_SCHEMA,
} from "../skills/interviewPrompt";
import {
  buildAnalysisSystemPrompt,
  buildAnalysisUserPrompt,
  ANALYSIS_JSON_SCHEMA,
  ANALYSIS_SCHEMA_NAME,
  TurnAnalysisSchema,
  CONCLUDE_THRESHOLD,
} from "../skills/analysisPrompt";
import { extractFencedJSON } from "../skills/interviewExtractor";
import { logger } from "../logger";
import type { InterviewRecord } from "../db/schema";
import {
  type FacetKey,
  type NextAction,
  type TurnAnalysis,
  FACETS,
  emptyCoverage,
  mergeCoverage,
} from "../types/interview";
import type { useMirrorStore } from "../stores/mirror";

export function useInterview(mirrorStore: ReturnType<typeof useMirrorStore>) {
  /** next_action from the most recent analysis, used to steer the next probe. */
  let lastAction: NextAction = "advance";
  let abortRef: AbortController | null = null;

  function makeLLM(): LLMClient {
    const config = mirrorStore.llmConfig;
    if (!config) throw new Error("LLM not configured");
    const result = createLLMClient({
      provider: config.provider,
      model: config.model,
      keyProvider: async () => config.apiKey,
      baseUrl: config.endpoint,
    });
    if (!result.ok) throw new Error(`Failed to create LLM client: ${result.error.message}`);
    return result.value;
  }

  function transcriptOf(rec: InterviewRecord): string {
    return rec.messages
      .filter((m) => !m.isError)
      .map((m) => `${m.role === "user" ? "User" : "Interviewer"}: ${m.content}`)
      .join("\n\n");
  }

  /** Run a single probe under the working overlay (entry points that have no
   *  analysis step: the first probe and "continue past conclusion"). */
  async function probeWithWorking(args: ProbeArgs) {
    const controller = new AbortController();
    abortRef = controller;
    mirrorStore.setWorking(true);
    try {
      await generateProbe(args, controller.signal);
    } finally {
      abortRef = null;
      mirrorStore.setWorking(false);
    }
  }

  /** Begin a fresh interview: start the record, then generate the first probe. */
  async function beginInterview(brief: string, inputText?: string, fileNames?: string[], wasDigested?: boolean) {
    await mirrorStore.startInterview(brief, inputText, fileNames, wasDigested);
    await probeWithWorking({ facet: "story", action: "advance", isFirst: true });
  }

  /**
   * One turn: commit the answer, run the analysis (Call B), then — unless coverage
   * has converged — the next probe (Call A). A single `working` flag covers the
   * whole turn so the Monitor and the ProbeCell reveal together at the end (no
   * staggered Monitor-then-overlay change). When the reading converges we show the
   * conclude state and skip generating a question entirely.
   */
  async function submitAnswer(text: string) {
    const rec = mirrorStore.record;
    if (!rec || rec.status !== "active") {
      logger.debug("app", "No interview record or no active record");
      return;
    }

    await mirrorStore.addMessage({ role: "user", content: text, timestamp: new Date().toISOString() });

    const controller = new AbortController();
    abortRef = controller;
    mirrorStore.setWorking(true);
    try {
      const prior = mirrorStore.record!.coverage ?? emptyCoverage();

      // Call B — analysis. Failure is non-fatal; we proceed without a fresh read.
      // Do NOT patch the store yet — coverage is revealed at the end of the turn.
      let analysis: TurnAnalysis | null = null;
      try {
        analysis = await runAnalysis(mirrorStore.record!, text, controller.signal);
        lastAction = analysis.next_action;
      } catch (e) {
        if (controller.signal.aborted) return;
        logger.warn("app", "Turn analysis failed; continuing without readout update", {
          error: e instanceof Error ? e : undefined,
        });
      }

      const patch = analysis
        ? { coverage: analysis.coverage, probeSignal: analysis.probe_signal, currentFacet: analysis.next_facet }
        : null;

      // Conclusion is coverage-derived — compute it from the merged read locally,
      // before touching the store, so we can skip Call A when converged.
      const merged = analysis ? mergeCoverage(prior, analysis.coverage) : prior;
      const willConclude = FACETS.every((f) => merged[f.key] >= CONCLUDE_THRESHOLD);

      if (willConclude) {
        if (patch) await mirrorStore.patchRecord(patch); // reveal Monitor + ConcludeCell together
        return;
      }

      // Call A — the next probe, steered by this turn's fresh analysis.
      const facet = analysis?.next_facet ?? mirrorStore.currentFacet;
      const action = analysis?.next_action ?? lastAction;
      await generateProbe({ facet, action, isFirst: false }, controller.signal);
      if (controller.signal.aborted) return;

      // Reveal the new coverage together with the new question (overlay still up).
      if (patch) await mirrorStore.patchRecord(patch);
    } finally {
      abortRef = null;
      mirrorStore.setWorking(false);
    }
  }

  async function runAnalysis(rec: InterviewRecord, answer: string, signal: AbortSignal): Promise<TurnAnalysis> {
    const llm = makeLLM();
    const lastQuestion =
      [...rec.messages].reverse().find((m) => m.role === "assistant" && !m.isError)?.content ?? "";
    const facet = rec.currentFacet ?? "story";
    const sys = buildAnalysisSystemPrompt();
    const user = buildAnalysisUserPrompt(
      facet,
      lastQuestion,
      answer,
      rec.coverage ?? emptyCoverage(),
      transcriptOf(rec),
    );
    const messages: Message[] = [
      { role: "system", content: sys },
      { role: "user", content: user },
    ];

    // strict:false → json_object (openai-compatible) or forced tool use (anthropic).
    // strict json_schema returns null on some reasoning models (e.g. DeepSeek).
    const structuredResult = await llm.message(messages, {
      structured: { name: ANALYSIS_SCHEMA_NAME, schema: ANALYSIS_JSON_SCHEMA, strict: false },
      signal,
    });

    let parsed = structuredResult.ok ? TurnAnalysisSchema.safeParse(structuredResult.value) : null;
    if (!structuredResult.ok && structuredResult.error.isAborted) {
      throw new Error("Analysis aborted");
    }

    // Fall back to plain completion + lenient JSON extraction if the structured
    // value is missing or doesn't match the schema.
    if (!parsed || !parsed.success) {
      const plainResult = await llm.message(messages, { signal });
      if (!plainResult.ok) {
        throw new Error(`Analysis failed: ${plainResult.error.message}`);
      }
      parsed = TurnAnalysisSchema.safeParse(extractFencedJSON(plainResult.value as string));
    }

    if (!parsed.success) {
      throw new Error(`analysis parse failed: ${parsed.error.issues[0]?.message ?? "invalid shape"}`);
    }
    return parsed.data;
  }

  interface ProbeArgs {
    facet: FacetKey;
    action: NextAction;
    isFirst: boolean;
  }

  interface ProbeResult {
    context: string;
    question: string;
  }

  /** Coerce a raw structured/extracted value into a probe, or null if unusable.
   *  Accepts a parsed object OR a JSON string (some providers return the JSON as
   *  text rather than a parsed object). */
  function coerceProbe(raw: unknown): ProbeResult | null {
    let obj: unknown = raw;
    if (typeof obj === "string") obj = extractFencedJSON(obj);
    if (!obj || typeof obj !== "object") return null;
    const o = obj as Record<string, unknown>;
    const question = typeof o.question === "string" ? o.question.trim() : "";
    if (!question) return null;
    const context = typeof o.context === "string" ? o.context.trim() : "";
    return { context, question };
  }

  /**
   * Call A — the probe. A single structured `message` call returns the
   * acknowledgement and the question SEPARATELY: the question alone goes in the
   * heading, the acknowledgement is surfaced read-only in the Monitor. Atomic
   * (not streamed) so the working overlay reveals the finished question with no
   * stale-question flicker. Degrades gracefully if the provider returns no
   * structured value (the same null case seen in Call B).
   */
  async function generateProbe({ facet, action, isFirst }: ProbeArgs, signal: AbortSignal) {
    const rec = mirrorStore.record;
    if (!rec) return;
    const llm = makeLLM();
    const sys = buildProbePrompt({ initialData: rec.initialData, facet, action, isFirst });
    const history: Message[] = rec.messages.map((m) => ({ role: m.role, content: m.content }));
    const messages: Message[] = [{ role: "system", content: sys }, ...history];

    let probe: ProbeResult | null = null;

    // Structured: json_object (openai-compatible) or forced tool use (anthropic).
    // strict:false avoids the json_schema path that returns null on reasoning
    // models like DeepSeek — one call on every provider.
    const structured = await llm.message(messages, {
      structured: { name: PROBE_SCHEMA_NAME, schema: PROBE_JSON_SCHEMA, strict: false },
      signal,
    });
    if (structured.ok) probe = coerceProbe(structured.value);
    else if (structured.error.isAborted) return; // user cancelled

    // Last resort: plain completion; recover JSON or fall back to raw text as the
    // question (context empty).
    if (!probe) {
      const plain = await llm.message(messages, { signal });
      if (!plain.ok) {
        if (!plain.error.isAborted) {
          await mirrorStore.addMessage({
            role: "assistant",
            content: plain.error.message,
            timestamp: new Date().toISOString(),
            isError: true,
          });
        }
        return;
      }
      const text = typeof plain.value === "string" ? plain.value : "";
      probe = coerceProbe(text) ?? { context: "", question: text.trim() };
    }

    if (!probe.question) return;
    await mirrorStore.addMessage({
      role: "assistant",
      content: probe.question,
      context: probe.context || undefined,
      timestamp: new Date().toISOString(),
    });
  }

  /** Ask one more probe past conclusion (the "continue — add more evidence" path). */
  async function probeMore() {
    const rec = mirrorStore.record;
    if (!rec || rec.status !== "active") return;
    const cov = rec.coverage ?? emptyCoverage();
    let facet: FacetKey = "story";
    let min = Infinity;
    for (const f of FACETS) {
      if (cov[f.key] < min) {
        min = cov[f.key];
        facet = f.key;
      }
    }
    await mirrorStore.patchRecord({ currentFacet: facet });
    await probeWithWorking({ facet, action: "advance", isFirst: false });
  }

  /** Triggers synthesis directly, bypassing coverage check. Escape route for the user. */
  async function finishEarly() {
    const rec = mirrorStore.record;
    if (!rec || rec.status !== "active") return;
    // Set status to synthesizing so the UI transitions
    await mirrorStore.setStatus("synthesizing" as const);
  }

  function abort() {
    abortRef?.abort();
  }

  return {
    beginInterview,
    submitAnswer,
    probeMore,
    finishEarly,
    abort,
  };
}
