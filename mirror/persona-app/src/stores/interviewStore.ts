import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { getDB } from "../db/schema";
import { logger } from "../logger";
import type { InterviewRecord, InterviewMessage, InterviewStatus } from "../db/schema";

export const useInterviewStore = defineStore("interview", () => {
  // shallowRef: the record is always replaced wholesale (never deep-mutated), so
  // we avoid deep reactive proxies that IndexedDB's structured clone can't handle.
  const record = shallowRef<InterviewRecord | null>(null);
  const loaded = ref(false);
  const streamingContent = ref(""); // live streamed text not yet committed
  const isThinking = ref(false); // waiting for first chunk
  const synthesisPhase = ref<string | null>(null); // transient UI: "extracting" | "analyzing" | "polishing" | "finalizing"

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
      createdAt: now,
      updatedAt: now,
    };
    const db = await getDB();
    await db.put("interview", rec);
    record.value = rec;
    streamingContent.value = "";
    logger.info("app", "Interview started", { data: { briefLength: brief.length, hasFiles: !!uploadedFileNames?.length, wasDigested: wasDigested ?? false } });
  }

  async function addMessage(msg: InterviewMessage) {
    const cur = record.value;
    if (!cur) return;
    const next: InterviewRecord = {
      ...cur,
      messages: [...cur.messages, msg],
      updatedAt: new Date().toISOString(),
    };
    const db = await getDB();
    await db.put("interview", next);
    record.value = next;
    streamingContent.value = "";
  }

  async function setStatus(status: InterviewStatus) {
    const cur = record.value;
    if (!cur) return;
    const next: InterviewRecord = {
      ...cur,
      status,
      synthesisError: undefined,
      updatedAt: new Date().toISOString(),
    };
    const db = await getDB();
    await db.put("interview", next);
    record.value = next;
    if (status === "completed") {
      logger.info("app", "Interview completed");
    }
  }

  async function failSynthesis(message: string) {
    const cur = record.value;
    if (!cur) return;
    const next: InterviewRecord = {
      ...cur,
      status: "error",
      synthesisError: message,
      updatedAt: new Date().toISOString(),
    };
    const db = await getDB();
    await db.put("interview", next);
    record.value = next;
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
  }

  return {
    record, loaded, streamingContent, isThinking, synthesisPhase,
    load, start, addMessage, setStatus, failSynthesis,
    setStreaming, setThinking, setSynthesisPhase, clear,
  };
});
