// Flow 2 — Per-turn analysis (Call B).
//
// After each user answer, this structured (non-streaming) call reads the answer
// against the five coverage facets and the prior reading and returns an honest
// measurement that drives the live readout:
//   - coverage:     current saturation estimate per facet (0..1)
//   - probe_signal: was the answer thin (dig deeper) or strong (advance)?
//   - next_action:  follow_up the same facet, or advance
//   - next_facet:   which facet the next probe should target
//
// This file owns BOTH the prompt builders AND the boundary contract: the LLM is an
// untrusted edge, so its output is validated by `TurnAnalysisSchema` (Zod) and the
// boundary type is derived from it via `z.infer` (CONVENTIONS 1.9 / 1.10). The
// `*_JSON_SCHEMA` is the JSON-Schema form handed to providers that support strict
// structured output.

import { z } from "zod";
import type { Message } from "@nc-750/llm-ts";
import { FACET_KEYS, type CoverageMap, type FacetKey } from "../models";
import { FACETS, CONCLUDE_THRESHOLD } from "../reference";
import { textMessage } from "./Fragments";

const FACET_KEY_VALUES = FACET_KEYS as readonly [FacetKey, ...FacetKey[]];

/** A saturation reading: clamped to 0..1, defaulting to 0 on garbage. */
const Saturation = z.number().min(0).max(1).catch(0);

/**
 * Boundary schema for the analysis result. Lenient by design — a model that
 * omits a facet has it default to 0 rather than failing the whole turn.
 */
export const TurnAnalysisSchema = z.object({
    coverage: z
        .object({
            story: Saturation,
            strengths: Saturation,
            hidden: Saturation,
            growth: Saturation,
            drivers: Saturation,
        })
        .partial()
        .transform((c): CoverageMap => ({
            story: c.story ?? 0,
            strengths: c.strengths ?? 0,
            hidden: c.hidden ?? 0,
            growth: c.growth ?? 0,
            drivers: c.drivers ?? 0,
        })),
    probe_signal: z.enum(["thin", "strong"]),
    next_action: z.enum(["follow_up", "advance"]),
    next_facet: z.enum(FACET_KEY_VALUES),
});

/** The validated analysis result — derived from the schema so they cannot drift. */
export type TurnAnalysis = z.infer<typeof TurnAnalysisSchema>;

export const TURN_ANALYSIS_SCHEMA_NAME = "turn_analysis";

/** JSON Schema form for providers that enforce strict structured output. */
export const TURN_ANALYSIS_JSON_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        coverage: {
            type: "object",
            additionalProperties: false,
            description: "Saturation 0..1 per facet — how completely each is evidenced so far.",
            properties: {
                story: { type: "number" },
                strengths: { type: "number" },
                hidden: { type: "number" },
                growth: { type: "number" },
                drivers: { type: "number" },
            },
            required: ["story", "strengths", "hidden", "growth", "drivers"],
        },
        probe_signal: {
            type: "string",
            enum: ["thin", "strong"],
            description: "Was the answer just given thin/vague (thin) or specific and evidenced (strong)?",
        },
        next_action: {
            type: "string",
            enum: ["follow_up", "advance"],
            description: "follow_up to dig the same facet deeper; advance to move to next_facet.",
        },
        next_facet: {
            type: "string",
            enum: [...FACET_KEY_VALUES],
            description: "The facet the next probe should target.",
        },
    },
    required: ["coverage", "probe_signal", "next_action", "next_facet"],
};

/**
 * The analysis system prompt, seeded with the current coverage reading and the
 * interview's budget position.
 *
 * @param coverage       the current saturation reading (the floor to build on)
 * @param questionsAsked how many probes have been asked so far
 * @param maxQuestions   the soft question cap the interview wraps up by
 * @param pastBudget     true once the target is met or the cap is spent — drops
 *                       all pacing pressure so a "continue / add more" round is
 *                       measured honestly rather than hurried.
 */
export function buildPersonaMetricsSystemPrompt(
    coverage: CoverageMap,
    questionsAsked: number,
    maxQuestions: number,
    pastBudget: boolean,
): Message {
    const target = Math.round(CONCLUDE_THRESHOLD * 100);
    const facetGuide = FACETS.map((f) => `- ${f.key}: ${f.blurb}`).join("\n");
    const facetSaturation = `
    - Story: ${coverage.story}
    - Strength: ${coverage.strengths}
    - Growth: ${coverage.growth}
    - Hidden: ${coverage.hidden}
    - Drivers: ${coverage.drivers}
    `;

    // Pacing: while inside the budget, push toward the target by the cap; once the
    // target is met or the cap is spent, drop the pressure and just measure.
    const pacing = pastBudget
        ? `## Pacing
The target is already met, or the question budget is spent and the user has chosen to keep adding evidence. There is no budget pressure now: simply measure the latest answer honestly. Saturation still only rises (never lower a facet); do not hurry, and do not inflate — read what the transcript actually supports.`
        : `## Pacing
You are at question ${questionsAsked} of a soft maximum of ${maxQuestions}. By the cap, every facet should be at or above ${target}% — so the reading has to move at that pace. If you are past the midpoint and facets are still low, your earlier readings were too conservative: correct them upward to reflect the evidence already gathered. Do not inflate numbers just to finish early, and do not stall a facet that is genuinely covered.`;

    const prompt = `
You are the ANALYSIS stage of a persona interview instrument. You do not talk to the user. You read the latest answer and report an honest measurement of the interview's progress.

You track ${FACETS.length} coverage facets (each 0..1 = how completely it is evidenced so far):
${facetGuide}

For every turn, return:
1. coverage — your current saturation estimate for ALL five facets, based on the whole transcript so far. A fact stated is not the same as a fact evidenced with a concrete story. Re-assess each facet from the whole transcript; do NOT just nudge the previous value by a hundredth.
2. probe_signal — "thin" if the answer just given was genuinely empty, evasive, deflecting, or off-topic (the instrument should dig deeper); "strong" if it carried real signal about the facet.
3. next_action — "follow_up" to probe the same facet again (only when probe_signal is "thin" and the facet is under-saturated), or "advance" to move on.
4. next_facet — which facet the next probe should target. Prefer the least-saturated facet that still needs evidence, unless a follow-up on the current facet is clearly more valuable.

## How much a single answer is worth (move in tenths, not hundredths)
Calibrate each facet's absolute saturation against the evidence in the whole transcript:
- 0.0 — the facet has not been touched at all.
- ~0.2–0.35 — one clear, on-topic answer (even a brief one) that opens the facet.
- ~0.4–0.6 — a concrete story, or a second independent data point.
- ~0.75–0.8 — richly evidenced; you could write a confident paragraph about it (this is "locked").
- ~0.9–1.0 — exhaustively covered; further probing would yield little.
A single substantive answer that directly addresses a facet should advance that facet by a meaningful step (roughly 0.15–0.3), not by hundredths.

## Honest uncertainty is evidence, not a thin answer
When the user honestly says "I don't know", "I've never thought about this", or "I'm not sure", that is NOT a thin answer — it is real signal about the facet (self-awareness, blind spots, how the person relates to that area, especially for hidden, growth, and drivers). Score it probe_signal "strong", advance that facet's saturation, and prefer next_action "advance": do not re-probe the same ground with reworded questions. Reserve "thin" for answers that genuinely reveal nothing — empty, evasive, deflecting, or off-topic.

${pacing}

Current saturation (a floor to build on, not a ceiling):
${facetSaturation}

Output ONLY the structured JSON result (a single JSON object with the fields above). No prose.`;

    return textMessage("system", prompt);
}

/**
 * The analysis user prompt: the question just asked, the answer just given, and
 * the full transcript so far for context. The caller (service layer) renders the
 * transcript and extracts the answer text — this builder stays pure.
 */
export function buildPersonaMetricsUserPrompt(question: string, answer: string, transcript: string): Message {
    const prompt = `
The probe just asked:
<question>
${question}
</question>

The user answered:
<answer>
${answer}
</answer>

Full transcript so far (for context):
<transcript>
${transcript}
</transcript>

Measure the reading now.
    `;

    return textMessage("user", prompt);
}
