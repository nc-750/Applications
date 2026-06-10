import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMirrorStore } from "../../stores/mirror";
import { useInterview } from "../../composables/useInterview";
import type { LLMClient } from "@nc-750/llm-ts";

// ── Fake LLM helpers ───────────────────────────────────────────────────────

function fakeStructuredAnalysis() {
  return {
    coverage: { story: 0.4, strengths: 0.2, hidden: 0.1, growth: 0, drivers: 0.1 },
    probe_signal: "strong" as const,
    next_action: "advance" as const,
    next_facet: "strengths" as const,
  };
}

interface FakeLLMOptions {
  /** Value returned for the structured "probe" call (Call A). */
  probe?: { context?: string; question: string };
  /** Make the structured probe return an error so the plain fallback kicks in. */
  probeShouldFail?: boolean;
  /** Text returned for the non-structured (fallback) completion. */
  plainResult?: string;
  analysisResult?: unknown;
  analysisShouldFail?: boolean;
}

function makeFakeLLM(opts: FakeLLMOptions = {}): LLMClient {
  const probe = opts.probe ?? { context: "", question: "Default question?" };
  const plainResult = opts.plainResult ?? "Plain fallback question?";
  const analysis = opts.analysisResult ?? fakeStructuredAnalysis();
  const analysisFails = opts.analysisShouldFail ?? false;
  const probeFails = opts.probeShouldFail ?? false;

  return {
    message: vi.fn().mockImplementation(
      async (_input, options?: { structured?: { name?: string }; signal?: AbortSignal }) => {
        if (options?.structured) {
          if (options.structured.name === "probe") {
            if (probeFails) return { ok: false, error: { message: "Schema not supported", isAborted: false, provider: "openai" } };
            return { ok: true, value: probe };
          }
          // analysis (Call B)
          if (analysisFails) return { ok: false, error: { message: "Schema not supported", isAborted: false, provider: "openai" } };
          return { ok: true, value: analysis };
        }
        // plain (fallback) completion
        return { ok: true, value: plainResult };
      },
    ),
    stream: vi.fn(),
  };
}

// ── Mock the old LLM module ─────────────────────────────────────────────────

const mockCreateLLMClient = vi.fn();
vi.mock("@nc-750/llm-ts", () => ({
  createLLMClient: (...args: unknown[]) => mockCreateLLMClient(...args),
}));

// Mock keyStore
vi.mock("../../lib/keyStore", () => ({
  loadApiKey: vi.fn().mockResolvedValue(null),
  saveApiKey: vi.fn(),
  clearApiKey: vi.fn(),
  isTauri: () => false,
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

async function setupWithConfig() {
  const store = useMirrorStore();
  store.llmConfig = {
    provider: "openai" as const,
    model: "gpt-4o",
    apiKey: "sk-test",
  };
  const interview = useInterview(store);

  // Clean up any existing record
  try { await store.clearInterview(); } catch { /* ok */ }

  return { store, interview };
}

describe("useInterview", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("beginInterview", () => {
    it("creates a record and generates the first probe (question only) into messages", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({ probe: { context: "", question: "What's your story?" } });
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      await interview.beginInterview("Candidate with 5 years in tech", "Raw input", ["cv.pdf"]);

      // Record created with correct metadata
      expect(store.record).not.toBeNull();
      expect(store.record!.status).toBe("active");
      expect(store.record!.initialData).toBe("Candidate with 5 years in tech");

      // First probe was committed as a message — content is the QUESTION only.
      const assistantMessages = store.record!.messages.filter((m) => m.role === "assistant");
      expect(assistantMessages.length).toBe(1);
      expect(assistantMessages[0].content).toBe("What's your story?");
      // No acknowledgement on the first probe.
      expect(assistantMessages[0].context).toBeUndefined();
    });

    it("throws if LLM is not configured", async () => {
      const store = useMirrorStore();
      const interview = useInterview(store);

      await expect(interview.beginInterview("Brief")).rejects.toThrow("LLM not configured");
    });
  });

  describe("submitAnswer", () => {
    it("commits the answer, runs analysis, and generates the next probe (context + question)", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({
        probe: { context: "Solid example.", question: "Follow-up question?" },
        analysisResult: {
          coverage: { story: 0.6, strengths: 0.3, hidden: 0.2, growth: 0.1, drivers: 0.2 },
          probe_signal: "strong",
          next_action: "follow_up",
          next_facet: "story",
        },
      });
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      // Start the interview first
      await interview.beginInterview("Brief");

      const userAnswer = "I built the platform from scratch.";
      await interview.submitAnswer(userAnswer);

      // User answer was committed
      const userMessages = store.record!.messages.filter((m) => m.role === "user");
      expect(userMessages.length).toBe(1);
      expect(userMessages[0].content).toBe(userAnswer);

      // Coverage was updated from analysis
      expect(store.record!.coverage!.story).toBe(0.6);

      // Next probe committed: content = question, context = acknowledgement.
      const assistantMessages = store.record!.messages.filter((m) => m.role === "assistant" && !m.isError);
      expect(assistantMessages.length).toBe(2);
      expect(assistantMessages[1].content).toBe("Follow-up question?");
      expect(assistantMessages[1].context).toBe("Solid example.");

      // message was called with structured option for analysis
      expect(fakeLLM.message).toHaveBeenCalled();
    });

    it("continues to the next probe even when analysis call fails (non-fatal)", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({
        probe: { context: "", question: "Next question despite error" },
        analysisShouldFail: true,
      });
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      await interview.beginInterview("Brief");
      await interview.submitAnswer("My answer");

      // Coverage should remain at 0 (unchanged from initial state)
      expect(store.record!.coverage!.story).toBe(0);

      // Next probe still generated
      const assistantMessages = store.record!.messages.filter((m) => m.role === "assistant" && !m.isError);
      expect(assistantMessages.length).toBe(2);
    });

    it("falls back to a plain completion when the structured probe returns no value", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({
        probeShouldFail: true,
        plainResult: "Recovered question?",
      });
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      await interview.beginInterview("Brief");

      // First probe recovered via the plain fallback path.
      const assistantMessages = store.record!.messages.filter((m) => m.role === "assistant" && !m.isError);
      expect(assistantMessages.length).toBe(1);
      expect(assistantMessages[0].content).toBe("Recovered question?");
      expect(assistantMessages[0].context).toBeUndefined();
    });

    it("skips the probe and shows the conclude state when coverage converges", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({
        probe: { question: "this question should never be asked" },
        analysisResult: {
          coverage: { story: 0.9, strengths: 0.9, hidden: 0.9, growth: 0.9, drivers: 0.9 },
          probe_signal: "strong",
          next_action: "advance",
          next_facet: "story",
        },
      });
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      await interview.beginInterview("Brief"); // first probe → 1 assistant message
      const before = store.record!.messages.filter((m) => m.role === "assistant" && !m.isError).length;

      await interview.submitAnswer("A thorough, well-evidenced answer.");

      // Coverage converged → conclude state, and NO new probe was generated.
      expect(store.concluded).toBe(true);
      const after = store.record!.messages.filter((m) => m.role === "assistant" && !m.isError).length;
      expect(after).toBe(before);
    });

    it("does nothing when no interview is active", async () => {
      const { interview } = await setupWithConfig();
      // No beginInterview call — record is null

      await interview.submitAnswer("orphan answer");

      // Should not throw, and nothing should happen
      const store = useMirrorStore();
      expect(store.record).toBeNull();
    });
  });

  describe("abort", () => {
    it("aborts the in-flight probe without adding an error message", async () => {
      const { store, interview } = await setupWithConfig();

      // The structured probe call hangs until the AbortSignal fires, then
      // resolves to an aborted error (as the real client does on cancel).
      const fakeLLM: LLMClient = {
        message: vi.fn().mockImplementation(async (_input, options?: { signal?: AbortSignal }) => {
          const signal = options?.signal;
          await new Promise<void>((resolve) => {
            if (signal?.aborted) return resolve();
            signal?.addEventListener("abort", () => resolve(), { once: true });
          });
          return { ok: false, error: { message: "Aborted", isAborted: true, provider: "openai" } };
        }),
        stream: vi.fn(),
      };
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      // Start beginInterview — it will hang on the probe call
      const beginPromise = interview.beginInterview("Brief");

      // Let the probe call start, then abort
      await new Promise((r) => setTimeout(r, 50));
      interview.abort();

      // beginInterview should resolve (not throw)
      await beginPromise;

      // No error message was added for abort, and no probe was committed
      const errorMessages = store.record?.messages.filter((m) => m.isError) ?? [];
      expect(errorMessages.length).toBe(0);
      const assistantMessages = store.record?.messages.filter((m) => m.role === "assistant") ?? [];
      expect(assistantMessages.length).toBe(0);
    });
  });

  describe("finishEarly", () => {
    it("sets interview status to synthesizing to trigger UI transition", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({ probe: { question: "First question?" } });
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      await interview.beginInterview("Brief");
      expect(store.record!.status).toBe("active");

      await interview.finishEarly();

      expect(store.record!.status).toBe("synthesizing");
    });

    it("does nothing when no interview is active", async () => {
      const { interview } = await setupWithConfig();
      await interview.finishEarly();
      // No throw, nothing changed
      const store = useMirrorStore();
      expect(store.record).toBeNull();
    });
  });

  describe("probeMore", () => {
    it("generates an extra probe targeting the least-saturated facet", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({ probe: { question: "Extra depth question?" } });
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      await interview.beginInterview("Brief");

      // Set coverage so growth is the lowest facet
      await store.patchRecord({
        coverage: { story: 0.8, strengths: 0.7, hidden: 0.6, growth: 0.2, drivers: 0.5 },
      });

      await interview.probeMore();

      // Should target the growth facet
      expect(store.currentFacet).toBe("growth");

      // Extra probe was added
      const assistantMessages = store.record!.messages.filter((m) => m.role === "assistant" && !m.isError);
      expect(assistantMessages.length).toBe(2);
    });
  });
});
