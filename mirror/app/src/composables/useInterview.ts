/**
 * Interview orchestration composable.
 *
 * All LLM interaction happens here — the store modules manage only data.
 * Takes a `mirrorStore` obtained via `useMirrorStore()` and returns
 * `{ beginInterview, submitAnswer, probeMore, abort, finishEarly }`.
 */
import { createLLMClient, type LLMClient, type Message } from "@nc-750/llm-ts";
import { buildProbePrompt } from "../skills/interviewPrompt";
import {
  buildAnalysisSystemPrompt,
  buildAnalysisUserPrompt,
  ANALYSIS_JSON_SCHEMA,
  ANALYSIS_SCHEMA_NAME,
  TurnAnalysisSchema,
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

  /** Begin a fresh interview: start the record, then stream the first probe. */
  async function beginInterview(brief: string, inputText?: string, fileNames?: string[], wasDigested?: boolean) {
    await mirrorStore.startInterview(brief, inputText, fileNames, wasDigested);
    await streamProbe({ facet: "story", action: "advance", isFirst: true });
  }

  /** Commit the user's answer, run the analysis (Call B), then the next probe (Call A). */
  async function submitAnswer(text: string) {
    const rec = mirrorStore.record;
    if (!rec || rec.status !== "active") return;

    await mirrorStore.addMessage({ role: "user", content: text, timestamp: new Date().toISOString() });

    // Call B — analysis. Failure is non-fatal: the loop continues without a
    // readout update rather than blocking the user.
    mirrorStore.setAcquiring(true);
    try {
      const analysis = await runAnalysis(mirrorStore.record!, text);
      lastAction = analysis.next_action;
      await mirrorStore.patchRecord({
        coverage: analysis.coverage,
        probeSignal: analysis.probe_signal,
        currentFacet: analysis.next_facet,
      });
    } catch (e) {
      logger.warn("app", "Turn analysis failed; continuing without readout update", {
        error: e instanceof Error ? e : undefined,
      });
    } finally {
      mirrorStore.setAcquiring(false);
    }

    if (mirrorStore.concluded) return; // the view shows the conclude state / offers synthesis
    await streamProbe({ facet: mirrorStore.currentFacet, action: lastAction, isFirst: false });
  }

  async function runAnalysis(rec: InterviewRecord, answer: string): Promise<TurnAnalysis> {
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

    let raw: unknown;
    const structuredResult = await llm.message(messages, {
      structured: { name: ANALYSIS_SCHEMA_NAME, schema: ANALYSIS_JSON_SCHEMA, strict: true },
    });
    if (structuredResult.ok) {
      raw = structuredResult.value;
    } else {
      // Fall back to plain completion + lenient JSON extraction
      const plainResult = await llm.message(messages);
      if (!plainResult.ok) {
        throw new Error(`Analysis failed: ${plainResult.error.message}`);
      }
      raw = extractFencedJSON(plainResult.value as string);
    }
    const parsed = TurnAnalysisSchema.safeParse(raw);
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

  async function streamProbe({ facet, action, isFirst }: ProbeArgs) {
    const rec = mirrorStore.record;
    if (!rec) return;
    const llm = makeLLM();
    const sys = buildProbePrompt({ initialData: rec.initialData, facet, action, isFirst });
    const history: Message[] = rec.messages.map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef = controller;
    mirrorStore.setThinking(true);

    const streamResult = await llm.stream(
      [{ role: "system", content: sys }, ...history],
      { signal: controller.signal },
    );

    if (!streamResult.ok) {
      abortRef = null;
      mirrorStore.setThinking(false);
      // Don't add an error message for aborted requests
      if (!streamResult.error.isAborted) {
        mirrorStore.setStreaming("");
        await mirrorStore.addMessage({
          role: "assistant",
          content: streamResult.error.message,
          timestamp: new Date().toISOString(),
          isError: true,
        });
      }
      return;
    }

    let acc = "";
    try {
      for await (const chunk of streamResult.value) {
        acc += chunk;
        mirrorStore.setStreaming(acc);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        mirrorStore.setStreaming("");
        await mirrorStore.addMessage({
          role: "assistant",
          content: e instanceof Error ? e.message : "LLM error",
          timestamp: new Date().toISOString(),
          isError: true,
        });
        return;
      }
    } finally {
      abortRef = null;
      mirrorStore.setThinking(false);
    }
    if (acc) {
      await mirrorStore.addMessage({ role: "assistant", content: acc, timestamp: new Date().toISOString() });
    }
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
    await streamProbe({ facet, action: "advance", isFirst: false });
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
