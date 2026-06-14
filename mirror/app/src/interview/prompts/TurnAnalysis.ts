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

/** The analysis system prompt, seeded with the current coverage reading. */
export function buildPersonaMetricsSystemPrompt(coverage: CoverageMap): Message {
    const target = Math.round(CONCLUDE_THRESHOLD * 100);
    const facetGuide = FACETS.map((f) => `- ${f.key}: ${f.blurb}`).join("\n");
    const facetSaturation = `
    - Story: ${coverage.story}
    - Strength: ${coverage.strengths}
    - Growth: ${coverage.growth}
    - Hidden: ${coverage.hidden}
    - Drivers: ${coverage.drivers}
    `;
    const prompt = `
You are the ANALYSIS stage of a persona interview instrument. You do not talk to the user. You read the latest answer and report an honest measurement of the interview's progress.

You track ${FACETS.length} coverage facets (each 0..1 = how completely it is evidenced so far):
${facetGuide}

For every turn, return:
1. coverage — your current saturation estimate for ALL five facets, based on the whole transcript so far. Be honest and conservative: a fact stated is not the same as a fact evidenced with a concrete story. Saturation should only rise when real evidence is added; it never needs to climb just because a turn happened.
2. probe_signal — "thin" if the answer just given was vague, generic, or evasive (the instrument should dig deeper); "strong" if it was specific and well-evidenced.
3. next_action — "follow_up" to probe the same facet again (typically when probe_signal is "thin" and the facet is under-saturated), or "advance" to move on.
4. next_facet — which facet the next probe should target. Prefer the least-saturated facet that still needs evidence, unless a follow-up on the current facet is clearly more valuable.

Aim to reach roughly ${target}% saturation across all facets before the reading is considered sufficient. Do not inflate numbers to finish early, and do not stall a facet that is genuinely covered.

Current saturation is:
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
