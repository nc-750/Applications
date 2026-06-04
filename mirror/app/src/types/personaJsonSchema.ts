// JSON Schema for the persona *data* object (the inner `persona` payload),
// used to constrain structured-output synthesis calls.
//
// Why hand-written rather than generated from Zod: the whole point of this
// schema is to FORCE the model onto the canonical English enum vocabulary and
// exact key names regardless of the interview language. Generators don't map
// cleanly onto OpenAI strict mode (every property must be required;
// "optional" is expressed as a nullable type), so we keep an explicit,
// provider-tuned shape here. The enum arrays are imported from persona.ts so
// the vocabulary never drifts from the Zod validator.

import { SKILL_CATEGORIES, SKILL_LEVELS, SKILL_SOURCES } from "./persona";

export const str = { type: "string" } as const;
/** A required-but-nullable string (strict mode has no true "optional"). */
export const nullableStr = { type: ["string", "null"] } as const;

export function nullableEnum(values: readonly string[]) {
  // null is permitted by the "string"|"null" type union; it does NOT belong
  // inside the enum array — strict-mode validators reject mixed-type enums.
  return { type: ["string", "null"], enum: [...values] };
}

export function obj(properties: Record<string, unknown>) {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

export function arr(items: unknown) {
  return { type: "array", items };
}

export const PERSONA_SCHEMA_NAME = "persona_data";

export const PERSONA_DATA_JSON_SCHEMA: Record<string, unknown> = obj({
  identity: obj({
    name: str,
    tagline: str,
    elevator_pitch: str,
  }),
  strengths: arr(obj({ label: str, description: str, evidence: nullableStr })),
  weaknesses: arr(obj({ label: str, description: str, growth_note: nullableStr })),
  skills: arr(
    obj({
      name: str,
      category: { type: "string", enum: [...SKILL_CATEGORIES] },
      level: nullableEnum(SKILL_LEVELS),
      source: nullableEnum(SKILL_SOURCES),
    })
  ),
  career_timeline: arr(
    obj({
      year_start: { type: "number" },
      year_end: { type: ["number", "string"] },
      role: str,
      organization: str,
      highlight: nullableStr,
      real_story: nullableStr,
    })
  ),
  non_professional: arr(
    obj({ activity: str, skills_revealed: arr(str), note: nullableStr })
  ),
  personality_traits: arr(
    obj({ dimension: str, position: { type: "number" }, note: nullableStr })
  ),
  values: arr(str),
  hidden_assets: arr(str),
  goals: obj({ short_term: nullableStr, long_term: nullableStr }),
  use_cases: obj({
    cv_summary: nullableStr,
    interview_pitch: nullableStr,
    linkedin_about: nullableStr,
  }),
  metadata: obj({
    sources_used: arr(str),
    language: str,
    generated_at: str,
    version: str,
  }),
});
