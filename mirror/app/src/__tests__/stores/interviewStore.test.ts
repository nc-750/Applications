import { describe, it, expect, beforeEach } from "vitest";
import { useInterviewStore } from "../../stores/interviewStore";
import { getDB } from "../../db/schema";

function resetStore() {
  useInterviewStore().$patch({
    record: null,
    loaded: false,
    streamingContent: "",
    isThinking: false,
    synthesisPhase: null,
  });
}

describe("interviewStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("load", () => {
    it("sets record to null when no interview exists", async () => {
      await useInterviewStore().load();
      expect(useInterviewStore().loaded).toBe(true);
      expect(useInterviewStore().record).toBeNull();
    });

    it("reads existing interview from IndexedDB", async () => {
      const db = await getDB();
      await db.put("interview", {
        id: "default",
        status: "active",
        initialData: "test brief",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await useInterviewStore().load();
      const state = useInterviewStore();
      expect(state.record).not.toBeNull();
      expect(state.record!.status).toBe("active");
      expect(state.record!.initialData).toBe("test brief");
    });
  });

  describe("start", () => {
    it("creates a new active interview record", async () => {
      await useInterviewStore().start(
        "Test brief data",
        "raw input text",
        ["resume.pdf"],
        false
      );

      const state = useInterviewStore();
      expect(state.record).not.toBeNull();
      expect(state.record!.status).toBe("active");
      expect(state.record!.initialData).toBe("Test brief data");
      expect(state.record!.inputText).toBe("raw input text");
      expect(state.record!.uploadedFileNames).toEqual(["resume.pdf"]);
      expect(state.record!.wasDigested).toBe(false);
      expect(state.record!.messages).toEqual([]);
      expect(state.record!.id).toBe("default");
    });

    it("persists to IndexedDB", async () => {
      await useInterviewStore().start("brief");
      const db = await getDB();
      const record = await db.get("interview", "default");
      expect(record).toBeDefined();
      expect(record!.status).toBe("active");
    });

    it("resets streaming content on start", async () => {
      useInterviewStore().$patch({ streamingContent: "old content" });
      await useInterviewStore().start("brief");
      expect(useInterviewStore().streamingContent).toBe("");
    });

    it("handles undefined optional fields", async () => {
      await useInterviewStore().start("brief");
      const state = useInterviewStore();
      expect(state.record!.inputText).toBeUndefined();
      expect(state.record!.uploadedFileNames).toBeUndefined();
      expect(state.record!.wasDigested).toBe(false);
    });
  });

  describe("addMessage", () => {
    it("appends message to the record", async () => {
      await useInterviewStore().start("brief");

      await useInterviewStore().addMessage({
        role: "user",
        content: "Hello",
        timestamp: new Date().toISOString(),
      });

      const state = useInterviewStore();
      expect(state.record!.messages).toHaveLength(1);
      expect(state.record!.messages[0].role).toBe("user");
      expect(state.record!.messages[0].content).toBe("Hello");
    });

    it("clears streaming content after adding message", async () => {
      await useInterviewStore().start("brief");
      useInterviewStore().$patch({ streamingContent: "streaming..." });

      await useInterviewStore().addMessage({
        role: "assistant",
        content: "Response",
        timestamp: new Date().toISOString(),
      });

      expect(useInterviewStore().streamingContent).toBe("");
    });

    it("no-ops when no record exists", async () => {
      await useInterviewStore().addMessage({
        role: "user",
        content: "orphan",
        timestamp: new Date().toISOString(),
      });
      expect(useInterviewStore().record).toBeNull();
    });

    it("persists to IndexedDB", async () => {
      await useInterviewStore().start("brief");
      await useInterviewStore().addMessage({
        role: "user",
        content: "Message 1",
        timestamp: new Date().toISOString(),
      });

      const db = await getDB();
      const record = await db.get("interview", "default");
      expect(record!.messages).toHaveLength(1);
    });
  });

  describe("setStatus", () => {
    it("updates status and clears synthesisError", async () => {
      await useInterviewStore().start("brief");
      await useInterviewStore().setStatus("synthesizing");

      expect(useInterviewStore().record!.status).toBe("synthesizing");
      expect(useInterviewStore().record!.synthesisError).toBeUndefined();
    });

    it("persists to IndexedDB", async () => {
      await useInterviewStore().start("brief");
      await useInterviewStore().setStatus("completed");

      const db = await getDB();
      const record = await db.get("interview", "default");
      expect(record!.status).toBe("completed");
    });

    it("no-ops when no record exists", async () => {
      await useInterviewStore().setStatus("completed");
      expect(useInterviewStore().record).toBeNull();
    });
  });

  describe("failSynthesis", () => {
    it("sets status to error and stores error message", async () => {
      await useInterviewStore().start("brief");
      await useInterviewStore().failSynthesis(
        "Extract phase — identity.name: Required"
      );

      const state = useInterviewStore();
      expect(state.record!.status).toBe("error");
      expect(state.record!.synthesisError).toBe(
        "Extract phase — identity.name: Required"
      );
    });

    it("no-ops when no record exists", async () => {
      await useInterviewStore().failSynthesis("error");
      expect(useInterviewStore().record).toBeNull();
    });
  });

  describe("transient state", () => {
    it("setStreaming updates streaming content and clears thinking", () => {
      useInterviewStore().$patch({ isThinking: true });
      useInterviewStore().setStreaming("partial response");
      expect(useInterviewStore().streamingContent).toBe("partial response");
      expect(useInterviewStore().isThinking).toBe(false);
    });

    it("setThinking toggles thinking state", () => {
      useInterviewStore().setThinking(true);
      expect(useInterviewStore().isThinking).toBe(true);
      useInterviewStore().setThinking(false);
      expect(useInterviewStore().isThinking).toBe(false);
    });

    it("setSynthesisPhase updates phase label", () => {
      useInterviewStore().setSynthesisPhase("extracting");
      expect(useInterviewStore().synthesisPhase).toBe("extracting");
      useInterviewStore().setSynthesisPhase("analyzing");
      expect(useInterviewStore().synthesisPhase).toBe("analyzing");
    });
  });

  describe("clear", () => {
    it("removes record from IndexedDB and resets state", async () => {
      await useInterviewStore().start("brief");
      await useInterviewStore().addMessage({
        role: "user",
        content: "msg",
        timestamp: new Date().toISOString(),
      });

      await useInterviewStore().clear();

      expect(useInterviewStore().record).toBeNull();
      expect(useInterviewStore().streamingContent).toBe("");

      const db = await getDB();
      const record = await db.get("interview", "default");
      expect(record).toBeUndefined();
    });
  });
});
