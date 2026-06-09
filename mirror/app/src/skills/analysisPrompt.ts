/**
 * Call B — the per-turn ANALYSIS call of the interview instrument.
 *
 * After each user answer, this structured (non-streaming) call reads the answer
 * against the five coverage facets and the prior reading, and returns an honest
 * measurement that drives the live readout:
 *   - coverage:     current saturation estimate per facet (0..1)
 *   - probe_signal: was the answer thin (dig deeper) or strong (advance)?
 *   - next_action:  follow_up the same facet, or advance
 *   - next_facet:   which facet the next probe should target
 *
 * This is the honest source of the readout (VISUAL_IDENTITY P5 / DESIGN_USE
 * Rule I1 — no fake meters). The streaming probe question (Call A) and the
 * end-of-interview synthesis (Call C) are separate.
 */

import { z } from "zod";
import { FACETS, type FacetKey, type CoverageMap } from "../types/interview";

/** A facet meter reads "locked" (green) at or above this saturation. */
export const SATURATION_LOCKED = 0.8;

/** The interview concludes once every facet reaches this saturation. */
export const CONCLUDE_THRESHOLD = 0.75;

const FACET_KEYS = FACETS.map((f) => f.key) as [FacetKey, ...FacetKey[]];

const Saturation = z.number().min(0).max(1).catch(0);

/** Zod schema for the analysis call result. Lenient: missing facets default to 0. */
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
  next_facet: z.enum(FACET_KEYS),
});

export const ANALYSIS_SCHEMA_NAME = "turn_analysis";

/** JSON Schema (for structuredComplete / strict json_schema providers). */
export const ANALYSIS_JSON_SCHEMA: Record<string, unknown> = {
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
      enum: [...FACET_KEYS],
      description: "The facet the next probe should target.",
    },
  },
  required: ["coverage", "probe_signal", "next_action", "next_facet"],
};

const facetGuide = FACETS.map((f) => `- ${f.key}: ${f.blurb}`).join("\n");

export function buildAnalysisSystemPrompt(): string {
  const target = Math.round(CONCLUDE_THRESHOLD * 100);
  return `You are the ANALYSIS stage of a persona interview instrument. You do not talk to the user. You read the latest answer and report an honest measurement of the interview's progress.

You track five coverage facets (each 0..1 = how completely it is evidenced so far):
${facetGuide}

For every turn, return:
1. coverage — your current saturation estimate for ALL five facets, based on the whole transcript so far. Be honest and conservative: a fact stated is not the same as a fact evidenced with a concrete story. Saturation should only rise when real evidence is added; it never needs to climb just because a turn happened.
2. probe_signal — "thin" if the answer just given was vague, generic, or evasive (the instrument should dig deeper); "strong" if it was specific and well-evidenced.
3. next_action — "follow_up" to probe the same facet again (typically when probe_signal is "thin" and the facet is under-saturated), or "advance" to move on.
4. next_facet — which facet the next probe should target. Prefer the least-saturated facet that still needs evidence, unless a follow-up on the current facet is clearly more valuable.

Aim to reach roughly ${target}% saturation across all facets before the reading is considered sufficient. Do not inflate numbers to finish early, and do not stall a facet that is genuinely covered.

Output ONLY the structured result. No prose.`;
}

export function buildAnalysisUserPrompt(
  currentFacet: FacetKey,
  question: string,
  answer: string,
  priorCoverage: CoverageMap,
  transcript: string,
): string {
  const cov = (Object.keys(priorCoverage) as FacetKey[])
    .map((k) => `${k}=${priorCoverage[k].toFixed(2)}`)
    .join(", ");
  return `Prior coverage: ${cov}

Current facet being probed: ${currentFacet}

The probe just asked:
<question>
${question.trim()}
</question>

The user's answer:
<answer>
${answer.trim()}
</answer>

Full transcript so far (for context):
<transcript>
${transcript.trim() || "(this is the first answer)"}
</transcript>

Measure the reading now.`;
}
