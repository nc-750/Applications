// File to be reworked or scraped.

// /**
//  * Call B — the per-turn ANALYSIS call of the interview instrument.
//  *
//  * After each user answer, this structured (non-streaming) call reads the answer
//  * against the five coverage facets and the prior reading, and returns an honest
//  * measurement that drives the live readout:
//  *   - coverage:     current saturation estimate per facet (0..1)
//  *   - probe_signal: was the answer thin (dig deeper) or strong (advance)?
//  *   - next_action:  follow_up the same facet, or advance
//  *   - next_facet:   which facet the next probe should target
//  *
//  * This is the honest source of the readout (VISUAL_IDENTITY P5 / DESIGN_USE
//  * Rule I1 — no fake meters). The streaming probe question (Call A) and the
//  * end-of-interview synthesis (Call C) are separate.
//  */

// import { z } from "zod";
// import { FACETS, type FacetKey, type CoverageMap } from "../types/interview";

// /** A facet meter reads "locked" (green) at or above this saturation. */
// export const SATURATION_LOCKED = 0.8;

// /** The interview concludes once every facet reaches this saturation. */
// export const CONCLUDE_THRESHOLD = 0.75;

// const FACET_KEYS = FACETS.map((f) => f.key) as [FacetKey, ...FacetKey[]];

// const Saturation = z.number().min(0).max(1).catch(0);

// /** Zod schema for the analysis call result. Lenient: missing facets default to 0. */
// export const TurnAnalysisSchema = z.object({
//   coverage: z
//     .object({
//       story: Saturation,
//       strengths: Saturation,
//       hidden: Saturation,
//       growth: Saturation,
//       drivers: Saturation,
//     })
//     .partial()
//     .transform((c): CoverageMap => ({
//       story: c.story ?? 0,
//       strengths: c.strengths ?? 0,
//       hidden: c.hidden ?? 0,
//       growth: c.growth ?? 0,
//       drivers: c.drivers ?? 0,
//     })),
//   probe_signal: z.enum(["thin", "strong"]),
//   next_action: z.enum(["follow_up", "advance"]),
//   next_facet: z.enum(FACET_KEYS),
// });

// export const ANALYSIS_SCHEMA_NAME = "turn_analysis";

// /** JSON Schema (for structuredComplete / strict json_schema providers). */
// export const ANALYSIS_JSON_SCHEMA: Record<string, unknown> = {
//   type: "object",
//   additionalProperties: false,
//   properties: {
//     coverage: {
//       type: "object",
//       additionalProperties: false,
//       description: "Saturation 0..1 per facet — how completely each is evidenced so far.",
//       properties: {
//         story: { type: "number" },
//         strengths: { type: "number" },
//         hidden: { type: "number" },
//         growth: { type: "number" },
//         drivers: { type: "number" },
//       },
//       required: ["story", "strengths", "hidden", "growth", "drivers"],
//     },
//     probe_signal: {
//       type: "string",
//       enum: ["thin", "strong"],
//       description: "Was the answer just given thin/vague (thin) or specific and evidenced (strong)?",
//     },
//     next_action: {
//       type: "string",
//       enum: ["follow_up", "advance"],
//       description: "follow_up to dig the same facet deeper; advance to move to next_facet.",
//     },
//     next_facet: {
//       type: "string",
//       enum: [...FACET_KEYS],
//       description: "The facet the next probe should target.",
//     },
//   },
//   required: ["coverage", "probe_signal", "next_action", "next_facet"],
// };