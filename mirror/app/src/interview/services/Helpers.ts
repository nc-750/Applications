// Pure helper functions for the Interview feature's service layer.
//
// Every function takes explicit arguments and returns data — no side effects,
// no store access, no Vue/Pinia/DB imports (CONVENTIONS 4.4). These are the
// functional core that the orchestrators (InterviewFlow, SynthesisFlow) sequence.

import type { CoverageMap, TranscriptMessage } from "../models";
import { FACET_KEYS } from "../models";
import { CONCLUDE_THRESHOLD } from "../reference";
import { extractFencedJSON } from "../prompts/Json";
import type { Probe } from "../prompts/Probe";

/** Render transcript messages as a text block for LLM context.
 *  Filters error messages. Labels roles as "User" / "Interviewer".
 *  Joins each message with double newlines. */
export function transcriptOf(messages: TranscriptMessage[]): string {
    return messages
        .filter((m) => !m.isError)
        .map((m) => `${m.role === "user" ? "User" : "Interviewer"}: ${m.content}`)
        .join("\n\n");
}

/**
 * Monotonic coverage merge — for each facet, takes the maximum of prior and
 * incoming so the reading can only rise. A merge never decreases a facet.
 */
export function mergeCoverage(
    prior: CoverageMap,
    incoming: CoverageMap,
): CoverageMap {
    const merged: Record<string, number> = {};
    for (const key of FACET_KEYS) {
        merged[key] = Math.max(prior[key], incoming[key]);
    }
    return merged as CoverageMap;
}

/**
 * True when every facet's saturation is at or above the conclusion threshold.
 * Used after a TurnAnalysis to decide whether to skip the next probe and show
 * the conclude state instead.
 */
export function canConclude(coverage: CoverageMap): boolean {
    return FACET_KEYS.every((key) => coverage[key] >= CONCLUDE_THRESHOLD);
}

/**
 * Coerce raw LLM output (from structured output or plain text completion) into
 * a {@link Probe} shape. Handles:
 *   - already-parsed objects from structured output
 *   - JSON strings (possibly fenced in ```json … ```)
 *
 * Returns `null` when the input cannot be coerced into a probe with a
 * non-empty `question` string. This is the single place probe coercion lives
 * (CONVENTIONS 7.8 — no duplicate implementations in views or orchestrators).
 */
export function coerceProbe(raw: unknown): Probe | null {
    let obj: unknown = raw;
    if (typeof obj === "string") {
        obj = extractFencedJSON(obj);
    }
    if (!obj || typeof obj !== "object") return null;

    const o = obj as Record<string, unknown>;
    const question = typeof o.question === "string" ? o.question.trim() : "";
    if (!question) return null;

    const context = typeof o.context === "string" ? o.context.trim() : "";

    return { context, question };
}
