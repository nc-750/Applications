import { defineStore } from "pinia";
import { ref, shallowRef, computed } from "vue";
import { getDB } from "../db/schema";
import { logger } from "../logger";
import type { InterviewRecord, InterviewMessage, InterviewStatus } from "../db/schema";
import {
  type CoverageMap,
  type FacetKey,
  type NextAction,
  type TurnAnalysis,
  FACETS,
  emptyCoverage,
  mergeCoverage,
} from "../types/interview";
import { useSettingsStore } from "./settingsStore";
import { useLicenseStore } from "./licenseStore";
import { createLLMProvider } from "../llm";
import type { LLMProvider, Message } from "../llm/types";
import { buildProbePrompt, type InterviewTier } from "../skills/interviewPrompt";
import {
  buildAnalysisSystemPrompt,
  buildAnalysisUserPrompt,
  ANALYSIS_JSON_SCHEMA,
  ANALYSIS_SCHEMA_NAME,
  TurnAnalysisSchema,
  CONCLUDE_THRESHOLD,
  MAX_PROBES,
} from "../skills/analysisPrompt";
import { extractFencedJSON } from "../skills/interviewExtractor";

export const useInterviewStore = defineStore("interview", () => {
  // shallowRef: the record is always replaced wholesale (never deep-mutated), so
  // we avoid deep reactive proxies that IndexedDB's structured clone can't handle.
  const record = shallowRef<InterviewRecord | null>(null);
  const loaded = ref(false);
  const streamingContent = ref(""); // live streamed text not yet committed
  const isThinking = ref(false); // waiting for first chunk of the probe (Call A)
  const acquiring = ref(false); // analysis call (Call B) in flight — drives acquisition
  const synthesisPhase = ref<string | null>(null); // transient UI: "extracting" | "analyzing" | "polishing" | "finalizing"

  /** next_action from the most recent analysis, used to steer the next probe. */
  let lastAction: NextAction = "advance";
  let abortRef: AbortController | null = null;

  // ── Readout getters ─────────────────────────────────────────────────────
  const coverage = computed<CoverageMap>(() => record.value?.coverage ?? emptyCoverage());
  const probeSignal = computed(() => record.value?.probeSignal ?? null);
  const currentFacet = computed<FacetKey>(() => record.value?.currentFacet ?? "story");
  /** Probes asked so far (non-error assistant turns). */
  const probeCount = computed(
    () => record.value?.messages.filter((m) => m.role === "assistant" && !m.isError).length ?? 0,
  );
  /** The reading has converged: every facet saturated, or the safety cap reached. */
  const concluded = computed(() => {
    const rec = record.value;
    if (!rec) return false;
    const t = tier();
    const cov = rec.coverage ?? emptyCoverage();
    const allSaturated = FACETS.every((f) => cov[f.key] >= CONCLUDE_THRESHOLD[t]);
    return allSaturated || probeCount.value >= MAX_PROBES[t];
  });

  function tier(): InterviewTier {
    return useLicenseStore().isPro ? "pro" : "free";
  }
  function makeLLM(): LLMProvider {
    const settings = useSettingsStore();
    return createLLMProvider({
      provider: settings.provider,
      model: settings.model,
      apiKey: settings.apiKey,
      endpoint: settings.endpoint || undefined,
    });
  }

  // ── Persistence ─────────────────────────────────────────────────────────
  async function persist(next: InterviewRecord) {
    const db = await getDB();
    await db.put("interview", next);
    record.value = next;
  }
  async function patchRecord(patch: Partial<InterviewRecord>) {
    const cur = record.value;
    if (!cur) return;
    await persist({ ...cur, ...patch, updatedAt: new Date().toISOString() });
  }

  async function load() {
    const db = await getDB();
    const rec = await db.get("interview", "default");
    record.value = rec ?? null;
    loaded.value = true;
  }

  async function start(brief: string, inputText?: string, uploadedFileNames?: string[], wasDigested?: boolean) {
    const now = new Date().toISOString();
    const rec: InterviewRecord = {
      id: "default",
      status: "active",
      initialData: brief,
      inputText: inputText || undefined,
      uploadedFileNames: uploadedFileNames?.length ? uploadedFileNames : undefined,
      wasDigested: wasDigested ?? false,
      messages: [],
      coverage: emptyCoverage(),
      currentFacet: "story",
      createdAt: now,
      updatedAt: now,
    };
    await persist(rec);
    streamingContent.value = "";
    lastAction = "advance";
    logger.info("app", "Interview started", { data: { briefLength: brief.length, hasFiles: !!uploadedFileNames?.length, wasDigested: wasDigested ?? false } });
  }

  async function addMessage(msg: InterviewMessage) {
    const cur = record.value;
    if (!cur) return;
    await persist({ ...cur, messages: [...cur.messages, msg], updatedAt: new Date().toISOString() });
    streamingContent.value = "";
  }

  async function setStatus(status: InterviewStatus) {
    const cur = record.value;
    if (!cur) return;
    await persist({ ...cur, status, synthesisError: undefined, updatedAt: new Date().toISOString() });
    if (status === "completed") logger.info("app", "Interview completed");
  }

  async function failSynthesis(message: string) {
    const cur = record.value;
    if (!cur) return;
    await persist({ ...cur, status: "error", synthesisError: message, updatedAt: new Date().toISOString() });
    logger.error("app", "Synthesis failed", { data: { message } });
  }

  function setStreaming(content: string) {
    streamingContent.value = content;
    isThinking.value = false;
  }
  function setThinking(thinking: boolean) {
    isThinking.value = thinking;
  }
  function setSynthesisPhase(phase: string | null) {
    synthesisPhase.value = phase;
  }

  async function clear() {
    const db = await getDB();
    await db.delete("interview", "default");
    record.value = null;
    streamingContent.value = "";
    lastAction = "advance";
  }

  // ── The per-turn loop ─────────────────────────────────────────────────────

  /** Begin a fresh interview: start the record, then stream the first probe. */
  async function beginInterview(brief: string, inputText?: string, fileNames?: string[], wasDigested?: boolean) {
    await start(brief, inputText, fileNames, wasDigested);
    await streamProbe({ facet: "story", action: "advance", isFirst: true });
  }

  /** Commit the user's answer, run the analysis (Call B), then the next probe (Call A). */
  async function submitAnswer(text: string) {
    const rec = record.value;
    if (!rec || rec.status !== "active") return;

    await addMessage({ role: "user", content: text, timestamp: new Date().toISOString() });

    // Call B — analysis. Failure is non-fatal: the loop continues without a
    // readout update rather than blocking the user.
    acquiring.value = true;
    try {
      const analysis = await runAnalysis(record.value!, text);
      lastAction = analysis.next_action;
      await patchRecord({
        coverage: mergeCoverage(record.value!.coverage ?? emptyCoverage(), analysis.coverage),
        probeSignal: analysis.probe_signal,
        currentFacet: analysis.next_facet,
      });
    } catch (e) {
      logger.warn("app", "Turn analysis failed; continuing without readout update", { error: e instanceof Error ? e : undefined });
    } finally {
      acquiring.value = false;
    }

    if (concluded.value) return; // the view shows the conclude state / offers synthesis
    await streamProbe({ facet: currentFacet.value, action: lastAction, isFirst: false });
  }

  function transcriptOf(rec: InterviewRecord): string {
    return rec.messages
      .filter((m) => !m.isError)
      .map((m) => `${m.role === "user" ? "User" : "Interviewer"}: ${m.content}`)
      .join("\n\n");
  }

  async function runAnalysis(rec: InterviewRecord, answer: string): Promise<TurnAnalysis> {
    const llm = makeLLM();
    const lastQuestion = [...rec.messages].reverse().find((m) => m.role === "assistant" && !m.isError)?.content ?? "";
    const facet = rec.currentFacet ?? "story";
    const sys = buildAnalysisSystemPrompt(tier());
    const user = buildAnalysisUserPrompt(facet, lastQuestion, answer, rec.coverage ?? emptyCoverage(), transcriptOf(rec));
    const messages: Message[] = [
      { role: "system", content: sys },
      { role: "user", content: user },
    ];

    let raw: unknown;
    try {
      raw = await llm.structuredComplete(messages, ANALYSIS_JSON_SCHEMA, ANALYSIS_SCHEMA_NAME);
    } catch {
      const text = await llm.complete(messages);
      raw = extractFencedJSON(text);
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
    const rec = record.value;
    if (!rec) return;
    const llm = makeLLM();
    const sys = buildProbePrompt({ initialData: rec.initialData, tier: tier(), facet, action, isFirst });
    const history: Message[] = rec.messages.map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef = controller;
    setThinking(true);
    let acc = "";
    try {
      for await (const chunk of llm.streamChat([{ role: "system", content: sys }, ...history], controller.signal)) {
        acc += chunk;
        setStreaming(acc);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setStreaming("");
        await addMessage({ role: "assistant", content: e instanceof Error ? e.message : "LLM error", timestamp: new Date().toISOString(), isError: true });
        return;
      }
    } finally {
      abortRef = null;
      setThinking(false);
    }
    if (acc) await addMessage({ role: "assistant", content: acc, timestamp: new Date().toISOString() });
  }

  /** Ask one more probe past conclusion (the "continue — add more evidence" path). */
  async function probeMore() {
    const rec = record.value;
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
    await patchRecord({ currentFacet: facet });
    await streamProbe({ facet, action: "advance", isFirst: false });
  }

  function abort() {
    abortRef?.abort();
  }

  return {
    record, loaded, streamingContent, isThinking, acquiring, synthesisPhase,
    coverage, probeSignal, currentFacet, probeCount, concluded,
    load, start, addMessage, setStatus, failSynthesis,
    setStreaming, setThinking, setSynthesisPhase, clear,
    beginInterview, submitAnswer, probeMore, abort,
  };
});
