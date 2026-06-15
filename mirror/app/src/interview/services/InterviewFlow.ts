// Turn-by-turn interview orchestration.
//
// This module is the "imperative shell" (CONVENTIONS 4.3) for the live
// interview: it sequences pure prompt builders, coverage helpers, and LLM
// I/O into the three user-triggered flows:
//   beginInterview  — seed a new session + first probe (Call A)
//   submitAnswer    — commit answer → analysis (Call B) → probe (Call A) or conclude
//   probeMore       — extra probe past conclusion
//   finishEarly     — set synthesising status (no LLM)
//   abort           — cancel in-flight LLM call
//
// All functions receive the LLM client and store(s) as arguments (CONVENTIONS
// 2.5 — stores by injection). Module-level AbortController so `abort()` can
// cancel whatever is in flight.

import type { LLMClient, Message } from "@nc-750/llm-ts";
import { logger } from "../../logger";
import type { useInterviewStore } from "../stores/InterviewStore";
import {
    createTranscriptMessage,
    createEmptyInterview,
    type CoverageMap,
    type FacetKey,
    type TranscriptMessage,
} from "../models";
import { FACET_KEYS } from "../models";
import {
    buildInterviewSystemPrompt,
} from "../prompts/InitialAnalysis";
import {
    buildPersonaMetricsSystemPrompt,
    buildPersonaMetricsUserPrompt,
    TurnAnalysisSchema,
    TURN_ANALYSIS_SCHEMA_NAME,
    TURN_ANALYSIS_JSON_SCHEMA,
} from "../prompts/TurnAnalysis";
import {
    buildNextQuestionSystemPrompt,
    PROBE_SCHEMA_NAME,
    PROBE_JSON_SCHEMA,
} from "../prompts/Probe";
import { extractFencedJSON } from "../prompts/Json";
import { transcriptOf, mergeCoverage, canConclude, coerceProbe } from "./Helpers";
import type { TurnAnalysis } from "../prompts/TurnAnalysis";

// ── Module-level abort state ──────────────────────────────────────────────

let controller: AbortController | null = null;

/** Cancel whatever LLM call is in flight. Safe to call when nothing is running. */
export function abort(): void {
    controller?.abort();
}

function freshController(): AbortController {
    controller?.abort();
    controller = new AbortController();
    return controller;
}

// ── Internal helpers ──────────────────────────────────────────────────────

/** Convert domain transcript messages to wire `Message[]` for LLM calls. */
function toWireMessages(messages: TranscriptMessage[]): Message[] {
    return messages.map((m) => ({
        role: m.role as Message["role"],
        content: [{ type: "text", text: m.content }],
    }));
}

/**
 * Find the last non-error assistant message in the transcript (the question
 * that was just asked). Returns empty string when none exists.
 */
function lastAssistantQuestion(messages: TranscriptMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role === "assistant" && !m.isError) return m.content;
    }
    return "";
}

// ── Call A — Probe ────────────────────────────────────────────────────────

interface ProbeContext {
    facet: FacetKey;
    action: "follow_up" | "advance";
    isFirst: boolean;
}

/**
 * Generate and commit a single probe (Call A). Appends the assistant message
 * and sets the probe facet/signal on the store. On failure, appends an error
 * transcript message.
 */
async function runProbe(
    llmClient: LLMClient,
    store: ReturnType<typeof useInterviewStore>,
    ctx: ProbeContext,
    signal: AbortSignal,
): Promise<void> {
    const messages = toWireMessages(store.messages);

    // Build the probe system prompt from a minimal TurnAnalysis stub.
    const ta: TurnAnalysis = {
        coverage: { ...store.coverage },
        probe_signal: store.probeSignal ?? "thin",
        next_action: ctx.action,
        next_facet: ctx.facet,
    };
    const systemPrompt = buildNextQuestionSystemPrompt(ta);

    // First probe has no history; subsequent probes include the full transcript.
    const payload: Message[] = ctx.isFirst
        ? [systemPrompt, buildInterviewSystemPrompt(store.initialData)]
        : [systemPrompt, ...messages];

    let probe = coerceProbe(null); // start null

    // Structured output (json_object / tool use, strict:false for reasoning models).
    const structured = await llmClient.message(payload, {
        structured: {
            name: PROBE_SCHEMA_NAME,
            schema: PROBE_JSON_SCHEMA,
            strict: false,
        },
        signal,
    });

    if (structured.ok) {
        probe = coerceProbe(structured.value);
    } else if (structured.error.isAborted) {
        return; // user cancelled — silent
    }

    // Fallback to plain completion when structured is missing or unparseable.
    if (!probe) {
        const plain = await llmClient.message(payload, { signal });
        if (!plain.ok) {
            if (!plain.error.isAborted) {
                await store.appendMessage(
                    createTranscriptMessage({
                        role: "assistant",
                        content: plain.error.message,
                        isError: true,
                    }),
                );
            }
            return;
        }
        const text = typeof plain.value === "string" ? plain.value : "";
        probe = coerceProbe(text) ?? { context: "", question: text.trim() };
    }

    if (!probe.question) return;

    await store.appendMessage(
        createTranscriptMessage({
            role: "assistant",
            content: probe.question,
            context: probe.context || undefined,
        }),
    );
}

// ── Call B — Turn Analysis ────────────────────────────────────────────────

/**
 * Run a single turn-analysis (Call B) and return the parsed `TurnAnalysis`.
 * Falls back to plain completion + fenced-JSON extraction when structured
 * output fails. Throws only on abort; returns `null` on unrecoverable failure
 * (caller treats this as non-fatal).
 */
async function runTurnAnalysis(
    llmClient: LLMClient,
    answer: string,
    priorCoverage: CoverageMap,
    messages: TranscriptMessage[],
    signal: AbortSignal,
): Promise<TurnAnalysis | null> {
    const lastQuestion = lastAssistantQuestion(messages);
    const sys = buildPersonaMetricsSystemPrompt(priorCoverage);
    const user = buildPersonaMetricsUserPrompt(
        lastQuestion,
        answer,
        transcriptOf(messages),
    );
    const payload: Message[] = [sys, user];

    const structured = await llmClient.message(payload, {
        structured: {
            name: TURN_ANALYSIS_SCHEMA_NAME,
            schema: TURN_ANALYSIS_JSON_SCHEMA,
            strict: false,
        },
        signal,
    });

    let parsed = structured.ok
        ? TurnAnalysisSchema.safeParse(structured.value)
        : null;

    if (!structured.ok && structured.error.isAborted) {
        throw new Error("Analysis aborted");
    }

    // Fallback to plain completion when structured fails.
    if (!parsed || !parsed.success) {
        const plain = await llmClient.message(payload, { signal });
        if (!plain.ok) {
            logger.warn("app", "Turn analysis plain fallback also failed", {
                data: { error: plain.error.message },
            });
            return null;
        }
        const raw = extractFencedJSON(
            typeof plain.value === "string" ? plain.value : "",
        );
        parsed = TurnAnalysisSchema.safeParse(raw);
    }

    if (!parsed.success) {
        logger.warn("app", "Turn analysis parse failed", {
            data: { issues: parsed.error.issues },
        });
        return null;
    }

    return parsed.data;
}

// ── Public orchestrators ──────────────────────────────────────────────────

/**
 * Seed a fresh interview session and generate the first probe.
 *
 * The first probe targets the "story" facet with "advance" action and an
 * empty context (no prior answer exists yet).
 */
export async function beginInterview(
    llmClient: LLMClient,
    store: ReturnType<typeof useInterviewStore>,
    initialData: string,
    inputText?: string,
    fileNames?: string[],
    wasDigested?: boolean,
): Promise<void> {
    const interview = createEmptyInterview();
    interview.status = "active";
    interview.initialData = initialData;
    interview.inputText = inputText;
    interview.uploadedFileNames = fileNames;
    interview.wasDigested = wasDigested;

    await store.saveInterview(interview);

    const ctrl = freshController();
    try {
        await runProbe(llmClient, store, {
            facet: "story",
            action: "advance",
            isFirst: true,
        }, ctrl.signal);
    } finally {
        controller = null;
    }
}

/**
 * One full turn: commit the user's answer, run Call B (turn analysis), merge
 * coverage, check conclusion, and run Call A (probe) if not concluded.
 *
 * Analysis failure is **non-fatal**: the flow logs a warning and continues to
 * the probe with the last-known facet and action.
 */
export async function submitAnswer(
    llmClient: LLMClient,
    store: ReturnType<typeof useInterviewStore>,
    answer: string,
): Promise<void> {
    if (store.status !== "active") return;

    // Commit the user's answer.
    await store.appendMessage(
        createTranscriptMessage({ role: "user", content: answer }),
    );

    const prior: CoverageMap = { ...store.coverage };
    const ctrl = freshController();

    try {
        // Call B — analysis (non-fatal).
        let analysis: TurnAnalysis | null = null;
        try {
            analysis = await runTurnAnalysis(
                llmClient,
                answer,
                prior,
                store.messages,
                ctrl.signal,
            );
        } catch (e) {
            if (ctrl.signal.aborted) return;
            logger.warn(
                "app",
                "Turn analysis failed; continuing without fresh reading",
                { data: { error: e instanceof Error ? e.message : String(e) } },
            );
        }

        // Merge and conclude check.
        const merged = analysis
            ? mergeCoverage(prior, analysis.coverage)
            : prior;
        const concluded = canConclude(merged);

        if (ctrl.signal.aborted) return;

        if (concluded) {
            // Reveal updated coverage + signal without generating a probe.
            await store.setCoverage(merged);
            if (analysis) {
                await store.setProbe(analysis.next_facet, analysis.probe_signal);
            }
            return;
        }

        // Call A — next probe (steered by analysis or last-known state).
        const facet = analysis?.next_facet ?? store.currentFacet ?? "story";
        const action = analysis?.next_action ?? "advance";

        await runProbe(llmClient, store, {
            facet,
            action,
            isFirst: false,
        }, ctrl.signal);

        if (ctrl.signal.aborted) return;

        // Reveal updated coverage + probe state.
        await store.setCoverage(merged);
        await store.setProbe(
            facet,
            analysis?.probe_signal ?? store.probeSignal,
        );
    } finally {
        controller = null;
    }
}

/**
 * Generate an extra probe targeting the least-saturated facet.
 * Used when the user wants to add more evidence past conclusion.
 */
export async function probeMore(
    llmClient: LLMClient,
    store: ReturnType<typeof useInterviewStore>,
): Promise<void> {
    if (store.status !== "active") return;

    // Find least-saturated facet.
    let facet: FacetKey = "story";
    let min = Infinity;
    for (const key of FACET_KEYS) {
        if (store.coverage[key] < min) {
            min = store.coverage[key];
            facet = key;
        }
    }

    await store.setProbe(facet, undefined);

    const ctrl = freshController();
    try {
        await runProbe(llmClient, store, {
            facet,
            action: "advance",
            isFirst: false,
        }, ctrl.signal);
    } finally {
        controller = null;
    }
}

/**
 * Set the interview status to "synthesizing" — escape hatch for the user
 * who wants to finish early. No LLM call is made.
 */
export async function finishEarly(
    store: ReturnType<typeof useInterviewStore>,
): Promise<void> {
    if (store.status !== "active") return;
    await store.setStatus("synthesizing");
}
