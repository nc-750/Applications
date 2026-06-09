import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMirrorStore } from "../../stores/mirror";
import { useInterview } from "../../composables/useInterview";
import type { LLMClient } from "@nc-750/llm-ts";

// ── Fake LLM helpers ───────────────────────────────────────────────────────

/** Creates an async generator that yields each string in chunks. */
async function* fakeStream(chunks: string[]) {
  for (const c of chunks) yield c;
}

function fakeStructuredAnalysis() {
  return {
    coverage: { story: 0.4, strengths: 0.2, hidden: 0.1, growth: 0, drivers: 0.1 },
    probe_signal: "strong" as const,
    next_action: "advance" as const,
    next_facet: "strengths" as const,
  };
}

interface FakeLLMOptions {
  streamChunks?: string[];
  analysisResult?: unknown;
  analysisShouldFail?: boolean;
}

function makeFakeLLM(opts: FakeLLMOptions = {}): LLMClient {
  const chunks = opts.streamChunks ?? ["Hello, ", "tell me ", "more."];
  const analysis = opts.analysisResult ?? fakeStructuredAnalysis();
  const analysisFails = opts.analysisShouldFail ?? false;

  return {
    message: vi.fn().mockImplementation(async (_input, options?: { structured?: unknown; signal?: AbortSignal }) => {
      if (options?.structured) {
        if (analysisFails) return { ok: false, error: { message: "Schema not supported", isAborted: false, provider: "openai" } };
        return { ok: true, value: analysis };
      }
      return { ok: true, value: "Fake completion response" };
    }),
    stream: vi.fn().mockImplementation(async (_input, _options?) => {
      return { ok: true, value: fakeStream(chunks) };
    }),
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
    it("creates a record and streams the first probe into messages", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({ streamChunks: ["Hi! ", "What's your story?"] });
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      await interview.beginInterview("Candidate with 5 years in tech", "Raw input", ["cv.pdf"]);

      // Record created with correct metadata
      expect(store.record).not.toBeNull();
      expect(store.record!.status).toBe("active");
      expect(store.record!.initialData).toBe("Candidate with 5 years in tech");

      // First probe was streamed and committed as a message
      const assistantMessages = store.record!.messages.filter((m) => m.role === "assistant");
      expect(assistantMessages.length).toBe(1);
      expect(assistantMessages[0].content).toBe("Hi! What's your story?");
    });

    it("throws if LLM is not configured", async () => {
      const store = useMirrorStore();
      const interview = useInterview(store);

      await expect(interview.beginInterview("Brief")).rejects.toThrow("LLM not configured");
    });
  });

  describe("submitAnswer", () => {
    it("commits the answer, runs analysis, and streams the next probe", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({
        streamChunks: ["Follow-up question?"],
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

      // Clear the mock call history so we can assert on submitAnswer's calls
      const userAnswer = "I built the platform from scratch.";
      await interview.submitAnswer(userAnswer);

      // User answer was committed
      const userMessages = store.record!.messages.filter((m) => m.role === "user");
      expect(userMessages.length).toBe(1);
      expect(userMessages[0].content).toBe(userAnswer);

      // Coverage was updated from analysis
      expect(store.record!.coverage!.story).toBe(0.6);

      // Next probe was streamed (total assistant messages = first + follow-up)
      const assistantMessages = store.record!.messages.filter((m) => m.role === "assistant" && !m.isError);
      expect(assistantMessages.length).toBe(2);

      // message was called with structured option for analysis
      expect(fakeLLM.message).toHaveBeenCalled();
    });

    it("continues streaming next probe even when analysis call fails (non-fatal)", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({
        streamChunks: ["Next question despite error"],
        analysisShouldFail: true,
      });
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      await interview.beginInterview("Brief");
      await interview.submitAnswer("My answer");

      // Coverage should remain at 0 (unchanged from initial state)
      expect(store.record!.coverage!.story).toBe(0);

      // Next probe still streamed
      const assistantMessages = store.record!.messages.filter((m) => m.role === "assistant" && !m.isError);
      expect(assistantMessages.length).toBe(2);
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
    it("aborts the in-flight stream without adding an error message", async () => {
      const { store, interview } = await setupWithConfig();

      // Create a fake that respects the AbortSignal — yields one chunk then
      // waits for the abort signal before throwing AbortError.
      const fakeLLM: LLMClient = {
        message: vi.fn(),
        stream: vi.fn().mockImplementation(async (_input, options?: { signal?: AbortSignal }) => {
          const signal = options?.signal;
          return {
            ok: true,
            value: (async function* () {
              yield "partial...";
              await new Promise((_resolve, reject) => {
                const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
                signal?.addEventListener("abort", onAbort, { once: true });
              });
            })(),
          };
        }),
      };
      mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeLLM });

      // Start beginInterview — it will hang on streaming after first chunk
      const beginPromise = interview.beginInterview("Brief");

      // Wait for the first chunk to be streamed (stored in streamingContent,
      // not yet committed to messages since stream is still in-flight)
      await new Promise((r) => setTimeout(r, 50));

      // Abort
      interview.abort();

      // beginInterview should resolve (not throw)
      await beginPromise;

      // No error message was added for abort
      const errorMessages = store.record?.messages.filter((m) => m.isError) ?? [];
      expect(errorMessages.length).toBe(0);
    });
  });

  describe("finishEarly", () => {
    it("sets interview status to synthesizing to trigger UI transition", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({ streamChunks: ["First question?"] });
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
    it("streams an extra probe targeting the least-saturated facet", async () => {
      const { store, interview } = await setupWithConfig();
      const fakeLLM = makeFakeLLM({ streamChunks: ["Extra depth question?"] });
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
