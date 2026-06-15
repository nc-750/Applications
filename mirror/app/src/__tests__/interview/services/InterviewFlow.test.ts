import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import type { LLMClient } from "@nc-750/llm-ts";
import { useInterviewStore } from "../../../interview/stores";
import {
    beginInterview,
    submitAnswer,
    probeMore,
    finishEarly,
    abort,
} from "../../../interview/services/InterviewFlow";
import {
    TURN_ANALYSIS_SCHEMA_NAME,
    type TurnAnalysis,
} from "../../../interview/prompts/TurnAnalysis";

// ── Fake LLM helpers ──────────────────────────────────────────────────────

function fakeAnalysis(overrides?: Partial<TurnAnalysis>): TurnAnalysis {
    return {
        coverage: { story: 0.4, strengths: 0.2, hidden: 0.1, growth: 0, drivers: 0.1 },
        probe_signal: "strong",
        next_action: "advance",
        next_facet: "strengths",
        ...overrides,
    };
}

interface FakeLLMOptions {
    probe?: { context?: string; question: string };
    probeShouldFail?: boolean;
    plainResult?: string;
    analysisResult?: unknown;
    analysisShouldFail?: boolean;
}

function makeFakeLLM(opts: FakeLLMOptions = {}): LLMClient {
    const probe = opts.probe ?? { context: "", question: "Default question?" };
    const plainResult = opts.plainResult ?? "Plain fallback?";
    const analysis = opts.analysisResult ?? fakeAnalysis();
    const analysisFails = opts.analysisShouldFail ?? false;
    const probeFails = opts.probeShouldFail ?? false;

    return {
        message: vi.fn().mockImplementation(
            async (_input, options?: { structured?: { name?: string }; signal?: AbortSignal }) => {
                if (options?.structured) {
                    if (options.structured.name === TURN_ANALYSIS_SCHEMA_NAME) {
                        if (analysisFails) {
                            return { ok: false, error: { message: "Schema not supported", isAborted: false, provider: "openai" } };
                        }
                        return { ok: true, value: analysis };
                    }
                    // probe
                    if (probeFails) {
                        return { ok: false, error: { message: "Schema not supported", isAborted: false, provider: "openai" } };
                    }
                    return { ok: true, value: probe };
                }
                // plain (fallback) completion
                return { ok: true, value: plainResult };
            },
        ),
        stream: vi.fn(),
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function setupStore() {
    const store = useInterviewStore();
    return store;
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("InterviewFlow", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    describe("beginInterview", () => {
        it("saves initial data and generates the first probe targeting the story facet", async () => {
            const store = setupStore();
            const fakeLLM = makeFakeLLM({ probe: { context: "", question: "What's your story?" } });

            await beginInterview(fakeLLM, store, "Candidate with 5 years in tech", "Raw input", ["cv.pdf"], true);

            expect(store.status).toBe("active");
            expect(store.initialData).toBe("Candidate with 5 years in tech");
            expect(store.inputText).toBe("Raw input");
            expect(store.uploadedFileNames).toEqual(["cv.pdf"]);
            expect(store.wasDigested).toBe(true);

            // First probe committed — content is the question only, no context.
            const assistantMessages = store.messages.filter((m) => m.role === "assistant");
            expect(assistantMessages.length).toBe(1);
            expect(assistantMessages[0].content).toBe("What's your story?");
            expect(assistantMessages[0].context).toBeUndefined();
            expect(assistantMessages[0].isError).toBe(false);
        });

        it("stores only the provided optional fields", async () => {
            const store = setupStore();
            const fakeLLM = makeFakeLLM({ probe: { question: "Hi?" } });

            await beginInterview(fakeLLM, store, "Just a brief");

            expect(store.inputText).toBeUndefined();
            expect(store.uploadedFileNames).toBeUndefined();
            expect(store.wasDigested).toBeUndefined();
        });
    });

    describe("submitAnswer", () => {
        it("commits the user answer, runs analysis, and generates the next probe", async () => {
            const store = setupStore();
            const fakeLLM = makeFakeLLM({
                probe: { context: "Solid example.", question: "Follow-up question?" },
                analysisResult: fakeAnalysis({
                    coverage: { story: 0.6, strengths: 0.3, hidden: 0.2, growth: 0.1, drivers: 0.2 },
                    next_facet: "story",
                }),
            });

            await beginInterview(fakeLLM, store, "Brief");

            const userAnswer = "I built the platform from scratch.";
            await submitAnswer(fakeLLM, store, userAnswer);

            // User answer was committed
            const userMessages = store.messages.filter((m) => m.role === "user");
            expect(userMessages.length).toBe(1);
            expect(userMessages[0].content).toBe(userAnswer);

            // Coverage was updated from analysis
            expect(store.coverage.story).toBe(0.6);
            expect(store.coverage.strengths).toBe(0.3);

            // Next probe committed: content = question, context = acknowledgement.
            const assistantMessages = store.messages.filter((m) => m.role === "assistant" && !m.isError);
            expect(assistantMessages.length).toBe(2); // first probe + new probe
            expect(assistantMessages[1].content).toBe("Follow-up question?");
            expect(assistantMessages[1].context).toBe("Solid example.");
        });

        it("continues to probe even when analysis call fails (non-fatal)", async () => {
            const store = setupStore();
            // Need two fake LLMs: one for beginInterview (probe succeeds), one for submitAnswer (analysis fails)
            const beginLLM = makeFakeLLM({ probe: { question: "First probe?" } });
            await beginInterview(beginLLM, store, "Brief");

            // Fresh Pinia with a new LLM for submitAnswer where analysis fails
            setActivePinia(createPinia());
            const store2 = useInterviewStore();
            const beginLLM2 = makeFakeLLM({ probe: { question: "First probe?" } });
            await beginInterview(beginLLM2, store2, "Brief");

            const submitLLM = makeFakeLLM({
                probe: { question: "Next question despite error" },
                analysisShouldFail: true,
            });

            await submitAnswer(submitLLM, store2, "My answer");

            // Coverage should remain at 0 (unchanged — analysis failed)
            expect(store2.coverage.story).toBe(0);

            // Next probe still generated
            const assistantMessages = store2.messages.filter((m) => m.role === "assistant" && !m.isError);
            expect(assistantMessages.length).toBe(2);
        });

        it("falls back to plain completion when structured probe returns no value", async () => {
            const store = setupStore();
            const fakeLLM = makeFakeLLM({
                probeShouldFail: true,
                plainResult: "Recovered question?",
            });

            await beginInterview(fakeLLM, store, "Brief");

            // First probe recovered via the plain fallback path.
            const assistantMessages = store.messages.filter((m) => m.role === "assistant" && !m.isError);
            expect(assistantMessages.length).toBe(1);
            expect(assistantMessages[0].content).toBe("Recovered question?");
            expect(assistantMessages[0].context).toBeUndefined();
        });

        it("skips the probe and commits coverage when coverage converges", async () => {
            const store = setupStore();
            const fakeLLM = makeFakeLLM({
                probe: { question: "this should never be asked" },
                analysisResult: fakeAnalysis({
                    coverage: { story: 0.9, strengths: 0.9, hidden: 0.9, growth: 0.9, drivers: 0.9 },
                    next_facet: "story",
                }),
            });

            await beginInterview(fakeLLM, store, "Brief");
            const before = store.messages.filter((m) => m.role === "assistant" && !m.isError).length;

            await submitAnswer(fakeLLM, store, "A thorough, well-evidenced answer.");

            // Coverage converged → skip probe. No new assistant message beyond beginInterview's.
            const after = store.messages.filter((m) => m.role === "assistant" && !m.isError).length;
            expect(after).toBe(before);

            // Coverage SHOULD be updated
            expect(store.coverage.story).toBe(0.9);
        });

        it("does nothing when interview status is not active", async () => {
            const store = setupStore();
            const fakeLLM = makeFakeLLM();

            // No beginInterview — status is "idle"
            await submitAnswer(fakeLLM, store, "orphan answer");

            // Nothing should have happened
            expect(store.messages.length).toBe(0);
        });
    });

    describe("probeMore", () => {
        it("targets the least-saturated facet and generates an extra probe", async () => {
            const store = setupStore();
            const fakeLLM = makeFakeLLM({ probe: { question: "Extra depth?" } });

            await beginInterview(fakeLLM, store, "Brief");

            // Set coverage so growth is the lowest
            await store.setCoverage({ story: 0.8, strengths: 0.7, hidden: 0.6, growth: 0.2, drivers: 0.5 });

            await probeMore(fakeLLM, store);

            // Should target growth (least saturated)
            expect(store.currentFacet).toBe("growth");

            // Extra probe was added
            const assistantMessages = store.messages.filter((m) => m.role === "assistant" && !m.isError);
            expect(assistantMessages.length).toBe(2);
        });

        it("does nothing when interview is not active", async () => {
            const store = setupStore();
            const fakeLLM = makeFakeLLM();

            await probeMore(fakeLLM, store);

            expect(store.messages.length).toBe(0);
        });
    });

    describe("finishEarly", () => {
        it("sets status to synthesizing", async () => {
            const store = setupStore();
            const fakeLLM = makeFakeLLM({ probe: { question: "First?" } });

            await beginInterview(fakeLLM, store, "Brief");
            expect(store.status).toBe("active");

            await finishEarly(store);
            expect(store.status).toBe("synthesizing");
        });

        it("does nothing when no interview is active", async () => {
            const store = setupStore();
            await finishEarly(store);
            expect(store.status).toBe("idle");
        });

        it("makes no LLM call", async () => {
            const store = setupStore();
            const fakeLLM = makeFakeLLM({ probe: { question: "First?" } });
            await beginInterview(fakeLLM, store, "Brief");

            const callCountBefore = (fakeLLM.message as ReturnType<typeof vi.fn>).mock.calls.length;
            await finishEarly(store);
            const callCountAfter = (fakeLLM.message as ReturnType<typeof vi.fn>).mock.calls.length;
            expect(callCountAfter).toBe(callCountBefore);
        });
    });

    describe("abort", () => {
        it("does not throw when no controller is active", () => {
            expect(() => abort()).not.toThrow();
        });

        it("aborts the current in-flight LLM call", async () => {
            const store = setupStore();

            // LLM that hangs until the AbortSignal fires
            const hangingLLM: LLMClient = {
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

            const beginPromise = beginInterview(hangingLLM, store, "Brief");

            // Let the probe call start, then abort
            await new Promise((r) => setTimeout(r, 50));
            abort();

            // beginInterview should resolve (not throw) after abort
            await beginPromise;

            // No error message for abort
            const errorMessages = store.messages.filter((m) => m.isError);
            expect(errorMessages.length).toBe(0);

            // No probe committed (aborted before completion)
            const assistantMessages = store.messages.filter((m) => m.role === "assistant");
            expect(assistantMessages.length).toBe(0);
        });
    });
});
