// File to be reworked or scrapped

// // Subset JSON Schemas and Zod validators for the three-phase synthesis.
// // Each phase gets a smaller, focused schema so the model is less likely to
// // produce invalid JSON. The merge step recombines fragments into the full
// // PersonaJSON and validates against the complete Zod schema.
// //
// // The JSON Schemas reuse the builder helpers exported from personaJsonSchema.ts
// // so the enum vocabularies and nullable patterns stay in sync.

// import { z } from "zod";
// import { PersonaDataSchema, parsePersonaJSONLenient, type PersonaJSON } from "../types/persona";
// import { SKILL_CATEGORIES, SKILL_LEVELS, SKILL_SOURCES } from "../types/persona";
// import {
//   obj, arr, str, nullableStr, nullableEnum,
// } from "../types/personaJsonSchema";

// // ── JSON Schemas (for llm.structuredComplete) ─────────────────────────────────

// export const EXTRACT_SCHEMA_NAME = "persona_extract";

// export const EXTRACT_JSON_SCHEMA: Record<string, unknown> = obj({
//   identity: obj({
//     name: str,
//     tagline: str,
//     elevator_pitch: str,
//   }),
//   career_timeline: arr(obj({
//     year_start: { type: "number" },
//     year_end: { type: ["number", "string"] },
//     role: str,
//     organization: str,
//     highlight: nullableStr,
//     real_story: nullableStr,
//   })),
//   skills: arr(obj({
//     name: str,
//     category: { type: "string", enum: [...SKILL_CATEGORIES] },
//     level: nullableEnum(SKILL_LEVELS),
//     source: nullableEnum(SKILL_SOURCES),
//   })),
//   non_professional: arr(obj({
//     activity: str,
//     skills_revealed: arr(str),
//     note: nullableStr,
//   })),
//   values: arr(str),
//   goals: obj({ short_term: nullableStr, long_term: nullableStr }),
// });

// export const ANALYZE_SCHEMA_NAME = "persona_analyze";

// export const ANALYZE_JSON_SCHEMA: Record<string, unknown> = obj({
//   strengths: arr(obj({
//     label: str,
//     description: str,
//     evidence: nullableStr,
//   })),
//   weaknesses: arr(obj({
//     label: str,
//     description: str,
//     growth_note: nullableStr,
//   })),
//   hidden_assets: arr(str),
//   personality_traits: arr(obj({
//     dimension: str,
//     position: { type: "number" },
//     note: nullableStr,
//   })),
// });

// export const POLISH_SCHEMA_NAME = "persona_polish";

// export const POLISH_JSON_SCHEMA: Record<string, unknown> = obj({
//   use_cases: obj({
//     cv_summary: nullableStr,
//     interview_pitch: nullableStr,
//     linkedin_about: nullableStr,
//   }),
//   metadata: obj({
//     sources_used: arr(str),
//     language: str,
//     generated_at: str,
//     version: str,
//   }),
// });

// // ── Zod subset schemas (post-hoc validation per phase) ────────────────────────

// export const ExtractDataSchema = PersonaDataSchema.pick({
//   identity: true,
//   career_timeline: true,
//   skills: true,
//   non_professional: true,
//   values: true,
//   goals: true,
// });
// export type ExtractData = z.infer<typeof ExtractDataSchema>;

// export const AnalyzeDataSchema = PersonaDataSchema.pick({
//   strengths: true,
//   weaknesses: true,
//   hidden_assets: true,
//   personality_traits: true,
// });
// export type AnalyzeData = z.infer<typeof AnalyzeDataSchema>;

// export const PolishDataSchema = PersonaDataSchema.pick({
//   use_cases: true,
//   metadata: true,
// });
// export type PolishData = z.infer<typeof PolishDataSchema>;

// // ── Merge ─────────────────────────────────────────────────────────────────────

// /**
//  * Combines the three synthesis fragments into a full PersonaJSON and validates
//  * against the complete schema. Throws a single-line Error if validation fails.
//  */
// export function mergeSynthesisFragments(
//   extract: ExtractData,
//   analyze: AnalyzeData,
//   polish: PolishData,
// ): PersonaJSON {
//   const merged = {
//     persona: {
//       ...extract,
//       ...analyze,
//       ...polish,
//     },
//   };
//   const result = parsePersonaJSONLenient(merged);
//   if (!result.ok) {
//     throw new Error(`Merged persona validation failed: ${result.error}`);
//   }
//   return result.data;
// }
