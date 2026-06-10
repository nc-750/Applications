import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMirrorStore } from "../../stores/mirror";
import { getDB } from "../../db/schema";
import { CONCLUDE_THRESHOLD } from "../../skills/analysisPrompt";

// Mock keyStore
vi.mock("../../lib/keyStore", () => ({
  loadApiKey: vi.fn().mockResolvedValue(null),
  saveApiKey: vi.fn(),
  clearApiKey: vi.fn(),
  isTauri: () => false,
}));

describe("mirrorStore interview", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    // Clean up any existing interview record
    const db = await getDB();
    try { await db.delete("interview", "default"); } catch { /* ok */ }
  });

  describe("startInterview", () => {
    it("creates a record with status active, empty messages, and zeroed coverage", async () => {
      const store = useMirrorStore();
      await store.startInterview("Test brief data");

      expect(store.record).not.toBeNull();
      expect(store.record!.status).toBe("active");
      expect(store.record!.messages).toEqual([]);
      expect(store.record!.initialData).toBe("Test brief data");
      expect(store.record!.coverage).toEqual({
        story: 0,
        strengths: 0,
        hidden: 0,
        growth: 0,
        drivers: 0,
      });

      // Verify persisted to IndexedDB
      const db = await getDB();
      const rec = await db.get("interview", "default");
      expect(rec).toBeDefined();
      expect(rec!.status).toBe("active");
    });

    it("stores optional inputText and uploadedFileNames", async () => {
      const store = useMirrorStore();
      await store.startInterview("Brief", "Raw text input", ["resume.pdf", "bio.md"], true);

      expect(store.record!.inputText).toBe("Raw text input");
      expect(store.record!.uploadedFileNames).toEqual(["resume.pdf", "bio.md"]);
      expect(store.record!.wasDigested).toBe(true);
    });
  });

  describe("addMessage", () => {
    it("appends a message to the record and persists it", async () => {
      const store = useMirrorStore();
      await store.startInterview("Brief");

      await store.addMessage({
        role: "user",
        content: "My answer",
        timestamp: new Date().toISOString(),
      });

      expect(store.record!.messages.length).toBe(1);
      expect(store.record!.messages[0].role).toBe("user");
      expect(store.record!.messages[0].content).toBe("My answer");

      // Verify persistence
      const db = await getDB();
      const rec = await db.get("interview", "default");
      expect(rec!.messages.length).toBe(1);
    });

    it("persists an assistant probe's context and exposes it as latestContext", async () => {
      const store = useMirrorStore();
      await store.startInterview("Brief");

      await store.addMessage({
        role: "assistant",
        content: "What went wrong?",
        context: "That's a gutsy call.",
        timestamp: new Date().toISOString(),
      });

      expect(store.latestContext).toBe("That's a gutsy call.");

      const db = await getDB();
      const rec = await db.get("interview", "default");
      expect(rec!.messages[0].context).toBe("That's a gutsy call.");
    });
  });

  describe("patchRecord", () => {
    it("merges coverage monotonically (never decreases)", async () => {
      const store = useMirrorStore();
      await store.startInterview("Brief");

      // Set initial coverage
      await store.patchRecord({
        coverage: { story: 0.5, strengths: 0.3, hidden: 0, growth: 0, drivers: 0.2 },
      });
      expect(store.record!.coverage!.story).toBe(0.5);

      // New analysis says story=0.3 (lower) — should keep 0.5
      await store.patchRecord({
        coverage: { story: 0.3, strengths: 0.6, hidden: 0.1, growth: 0, drivers: 0.1 },
      });
      expect(store.record!.coverage!.story).toBe(0.5); // kept higher prior
      expect(store.record!.coverage!.strengths).toBe(0.6); // took higher next
      expect(store.record!.coverage!.drivers).toBe(0.2); // kept higher prior
    });

    it("updates currentFacet and probeSignal", async () => {
      const store = useMirrorStore();
      await store.startInterview("Brief");

      await store.patchRecord({
        currentFacet: "strengths",
        probeSignal: "strong",
      });

      expect(store.currentFacet).toBe("strengths");
      expect(store.probeSignal).toBe("strong");
    });
  });

  describe("clearInterview", () => {
    it("removes the record from IndexedDB and resets state", async () => {
      const store = useMirrorStore();
      await store.startInterview("Brief");
      expect(store.record).not.toBeNull();

      await store.clearInterview();

      expect(store.record).toBeNull();

      const db = await getDB();
      const rec = await db.get("interview", "default");
      expect(rec).toBeUndefined();
    });
  });

  describe("concluded getter", () => {
    it("is false when no record exists", () => {
      expect(useMirrorStore().concluded).toBe(false);
    });

    it("is false when some facets are below threshold", async () => {
      const store = useMirrorStore();
      await store.startInterview("Brief");
      await store.patchRecord({
        coverage: { story: 0.8, strengths: 0.8, hidden: 0.5, growth: 0.8, drivers: 0.8 },
      });
      expect(store.concluded).toBe(false); // hidden is 0.5 < 0.75
    });

    it("is true when all facets reach or exceed CONCLUDE_THRESHOLD", async () => {
      const store = useMirrorStore();
      await store.startInterview("Brief");
      await store.patchRecord({
        coverage: {
          story: 0.8,
          strengths: CONCLUDE_THRESHOLD,
          hidden: 0.9,
          growth: CONCLUDE_THRESHOLD,
          drivers: 0.85,
        },
      });
      expect(store.concluded).toBe(true);
    });
  });

  describe("probeCount getter", () => {
    it("counts non-error assistant messages", async () => {
      const store = useMirrorStore();
      await store.startInterview("Brief");
      await store.addMessage({ role: "assistant", content: "Q1", timestamp: new Date().toISOString() });
      await store.addMessage({ role: "user", content: "A1", timestamp: new Date().toISOString() });
      await store.addMessage({ role: "assistant", content: "Q2", timestamp: new Date().toISOString() });
      await store.addMessage({
        role: "assistant",
        content: "LLM error",
        timestamp: new Date().toISOString(),
        isError: true,
      });

      expect(store.probeCount).toBe(2); // only the two non-error assistant messages
    });
  });

  describe("failSynthesis", () => {
    it("sets status to error with the failure message", async () => {
      const store = useMirrorStore();
      await store.startInterview("Brief");
      await store.failSynthesis("Extract phase — identity.name: Required");

      expect(store.record!.status).toBe("error");
      expect(store.record!.synthesisError).toBe("Extract phase — identity.name: Required");
    });
  });
});
