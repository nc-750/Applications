import { ref, shallowRef, computed } from "vue";
import { getDB } from "../../db/schema";
import { logger } from "../../logger";
import type { InterviewRecord, InterviewMessage, InterviewStatus } from "../../db/schema";
import {
  type CoverageMap,
  type FacetKey,
  FACETS,
  emptyCoverage,
  mergeCoverage,
} from "../../types/interview";
import { CONCLUDE_THRESHOLD } from "../../skills/analysisPrompt";

export function useInterviewModule() {
  // shallowRef: the record is always replaced wholesale (never deep-mutated), so
  // we avoid deep reactive proxies that IndexedDB's structured clone can't handle.
  const record = shallowRef<InterviewRecord | null>(null);
  const interviewLoaded = ref(false);
  const streamingContent = ref(""); // live streamed text not yet committed
  const isThinking = ref(false); // waiting for first chunk of the probe (Call A)
  const acquiring = ref(false); // analysis call (Call B) in flight — drives acquisition
  const synthesisPhase = ref<string | null>(null); // transient UI: "extracting" | "analyzing" | "polishing" | "finalizing"

  // ── Readout getters ─────────────────────────────────────────────────────
  const coverage = computed<CoverageMap>(() => record.value?.coverage ?? emptyCoverage());
  const probeSignal = computed(() => record.value?.probeSignal ?? null);
  const currentFacet = computed<FacetKey>(() => record.value?.currentFacet ?? "story");
  /** Probes asked so far (non-error assistant turns). */
  const probeCount = computed(
    () => record.value?.messages.filter((m) => m.role === "assistant" && !m.isError).length ?? 0,
  );
  /** The reading has converged: every facet saturated (no probe count cap — LLM decides). */
  const concluded = computed(() => {
    const rec = record.value;
    if (!rec) return false;
    const cov = rec.coverage ?? emptyCoverage();
    return FACETS.every((f) => cov[f.key] >= CONCLUDE_THRESHOLD);
  });

  // ── Persistence ─────────────────────────────────────────────────────────
  async function persist(next: InterviewRecord) {
    const db = await getDB();
    await db.put("interview", next);
    record.value = next;
  }

  async function patchRecord(patch: Partial<InterviewRecord>) {
    const cur = record.value;
    if (!cur) return;
    const newCoverage = patch.coverage
      ? mergeCoverage(cur.coverage ?? emptyCoverage(), patch.coverage)
      : cur.coverage;
    await persist({ ...cur, ...patch, coverage: newCoverage, updatedAt: new Date().toISOString() });
  }

  async function loadInterview() {
    const db = await getDB();
    const rec = await db.get("interview", "default");
    record.value = rec ?? null;
    interviewLoaded.value = true;
  }

  async function startInterview(brief: string, inputText?: string, uploadedFileNames?: string[], wasDigested?: boolean) {
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
    logger.info("app", "Interview started", {
      data: {
        briefLength: brief.length,
        hasFiles: !!uploadedFileNames?.length,
        wasDigested: wasDigested ?? false,
      },
    });
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

  function setAcquiring(val: boolean) {
    acquiring.value = val;
  }

  function setSynthesisPhase(phase: string | null) {
    synthesisPhase.value = phase;
  }

  async function clearInterview() {
    const db = await getDB();
    await db.delete("interview", "default");
    record.value = null;
    streamingContent.value = "";
  }

  return {
    record,
    interviewLoaded,
    streamingContent,
    isThinking,
    acquiring,
    synthesisPhase,
    coverage,
    probeSignal,
    currentFacet,
    probeCount,
    concluded,
    loadInterview,
    startInterview,
    addMessage,
    patchRecord,
    setStatus,
    failSynthesis,
    setStreaming,
    setThinking,
    setAcquiring,
    setSynthesisPhase,
    clearInterview,
  };
}
