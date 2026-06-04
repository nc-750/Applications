// Canonical TypeScript types matching persona-schema.md.
// Zod is the source of truth: TS types are inferred from the schema so the
// runtime validator and the compile-time shape never drift apart.

import { z } from "zod";

// ── Enum vocabularies (single source for both Zod and the JSON Schema) ────────

export const SKILL_CATEGORIES = ["Technical", "Soft", "Domain", "Language", "Transversal", "Tool"] as const;
export const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert", "Native"] as const;
export const SKILL_SOURCES = ["professional", "personal", "inferred"] as const;

/**
 * Maps a possibly-noisy LLM enum value onto the canonical English vocabulary,
 * case-insensitively. Returns `fallback` when nothing matches — which covers
 * the multilingual case where a model emits a localized value (e.g. "技术")
 * that the deterministic renderers can't key on. The structured-output path
 * prevents this at the source; this is the safety net for plain-text providers.
 */
function normalizeEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T | undefined
): T | undefined {
  if (typeof value !== "string") return fallback;
  const v = value.trim().toLowerCase();
  return allowed.find((a) => a.toLowerCase() === v) ?? fallback;
}

// ── Leaf schemas ──────────────────────────────────────────────────────────────

export const StrengthSchema = z.object({
  label: z.string(),
  description: z.string(),
  evidence: z.string().optional(),
});

export const WeaknessSchema = z.object({
  label: z.string(),
  description: z.string(),
  growth_note: z.string().optional(),
});

export const SkillSchema = z.object({
  name: z.string(),
  category: z.preprocess(
    (v) => normalizeEnum(v, SKILL_CATEGORIES, "Technical"),
    z.enum(SKILL_CATEGORIES)
  ),
  level: z
    .preprocess((v) => normalizeEnum(v, SKILL_LEVELS, undefined), z.enum(SKILL_LEVELS))
    .optional(),
  source: z
    .preprocess((v) => normalizeEnum(v, SKILL_SOURCES, undefined), z.enum(SKILL_SOURCES))
    .optional(),
});

// A bare year may arrive as a string ("2020") from a plain-text provider; coerce it.
// year_end accepts a number or the literal "present"; any non-numeric string
// (including a localized word for "present") collapses to "present".
const yearEnd = z.preprocess((v) => {
  if (typeof v === "string") {
    const n = Number(v);
    return v.trim() !== "" && Number.isFinite(n) ? n : "present";
  }
  return v;
}, z.union([z.number(), z.literal("present")]));

export const CareerEntrySchema = z.object({
  year_start: z.coerce.number().catch(new Date().getFullYear()),
  year_end: yearEnd.catch("present"),
  role: z.string(),
  organization: z.string(),
  highlight: z.string().optional(),
  real_story: z.string().optional(),
});

export const NonProfessionalEntrySchema = z.object({
  activity: z.string(),
  skills_revealed: z.array(z.string()),
  note: z.string().optional(),
});

export const PersonalityTraitSchema = z.object({
  dimension: z.string(),
  position: z.number(), // 0–10
  note: z.string().optional(),
});

// ── Composite ─────────────────────────────────────────────────────────────────

export const PersonaDataSchema = z.object({
  identity: z.object({
    name: z.string(),
    tagline: z.string(),
    elevator_pitch: z.string(),
  }),
  strengths: z.array(StrengthSchema),
  weaknesses: z.array(WeaknessSchema),
  skills: z.array(SkillSchema),
  career_timeline: z.array(CareerEntrySchema),
  non_professional: z.array(NonProfessionalEntrySchema),
  personality_traits: z.array(PersonalityTraitSchema),
  values: z.array(z.string()),
  hidden_assets: z.array(z.string()),
  goals: z.object({
    short_term: z.string().optional(),
    long_term: z.string().optional(),
  }),
  use_cases: z.object({
    cv_summary: z.string().optional(),
    interview_pitch: z.string().optional(),
    linkedin_about: z.string().optional(),
  }),
  metadata: z.object({
    sources_used: z.array(z.string()),
    language: z.string(),
    generated_at: z.string(),
    version: z.string(),
  }),
});

// ── Source context (optional — added when persona is created via interview) ──

export const InterviewTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string(),
});

export const SourceSchema = z.object({
  /** Raw text the user typed in the data-input step. */
  input_text: z.string().optional(),
  /** Names of files the user uploaded (contents are not stored). */
  uploaded_files: z.array(z.string()).optional(),
  /** Full interview transcript. */
  interview: z.array(InterviewTurnSchema).optional(),
});

export const PersonaJSONSchema = z.object({
  persona: PersonaDataSchema,
  /** Source context captured at interview time. Optional — absent in imported files. */
  source: SourceSchema.optional(),
});

// ── Inferred types (canonical) ────────────────────────────────────────────────

export type Strength = z.infer<typeof StrengthSchema>;
export type Weakness = z.infer<typeof WeaknessSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type CareerEntry = z.infer<typeof CareerEntrySchema>;
export type NonProfessionalEntry = z.infer<typeof NonProfessionalEntrySchema>;
export type PersonalityTrait = z.infer<typeof PersonalityTraitSchema>;
export type PersonaData = z.infer<typeof PersonaDataSchema>;
export type InterviewTurn = z.infer<typeof InterviewTurnSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type PersonaJSON = z.infer<typeof PersonaJSONSchema>;

// ── Storage wrapper (not part of the import/export schema) ────────────────────

export interface StoredPersona {
  id: "default";
  data: PersonaJSON;
  derived: {
    how_i_work_best: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Recursively drops keys whose value is null. Structured-output providers
 * represent absent optional fields as `null` (a schema cannot mark a property
 * both optional and required under strict mode), whereas our Zod optionals
 * expect the key to be missing. Stripping nulls reconciles the two.
 */
export function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNulls);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === null) continue;
      out[k] = stripNulls(v);
    }
    return out;
  }
  return value;
}

/**
 * Parse + validate a PersonaJSON object (e.g. from importFromJSON or the
 * interview extractor). On failure, throws a friendly single-line Error
 * pointing at the first invalid field.
 */
export function parsePersonaJSON(raw: unknown): PersonaJSON {
  const result = PersonaJSONSchema.safeParse(stripNulls(raw));
  if (result.success) return result.data;
  const first = result.error.issues[0];
  const path = first.path.length ? first.path.join(".") : "(root)";
  throw new Error(`Invalid persona.json — ${path}: ${first.message}`);
}

/**
 * Non-throwing variant for the synthesis path. Strips nulls, normalizes enums,
 * and returns either the validated persona or a single-line reason. The caller
 * surfaces the reason to the user instead of silently locking the feature.
 */
export function parsePersonaJSONLenient(
  raw: unknown
): { ok: true; data: PersonaJSON } | { ok: false; error: string } {
  const result = PersonaJSONSchema.safeParse(stripNulls(raw));
  if (result.success) return { ok: true, data: result.data };
  const first = result.error.issues[0];
  const path = first.path.length ? first.path.join(".") : "(root)";
  return { ok: false, error: `${path}: ${first.message}` };
}

/**
 * Finds the persona *data* object inside whatever a model returned. Different
 * providers/paths hand back different shapes: the bare data object
 * (`{ identity, ... }`), the standard wrapper (`{ persona: { identity, ... } }`),
 * or occasionally a double wrap. We key off the presence of `identity`.
 */
export function locatePersonaData(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;
  if ("identity" in o) return o;

  // Search all top-level keys for a sub-object containing "identity" — different
  // providers / structured-output paths wrap in different keys ("persona",
  // "data", "result", the schema name, etc.).
  for (const [, val] of Object.entries(o)) {
    if (val && typeof val === "object" && "identity" in (val as Record<string, unknown>)) {
      return val;
    }
  }

  // Double-wrap fallback: { persona: { persona: { identity } } }
  const p = o.persona;
  if (p && typeof p === "object") {
    for (const [, val] of Object.entries(p as Record<string, unknown>)) {
      if (val && typeof val === "object" && "identity" in (val as Record<string, unknown>)) {
        return val;
      }
    }
  }

  return o;
}

/**
 * Coerce an arbitrary model return into a validated PersonaJSON, tolerating the
 * inner-data / wrapper / double-wrapper shapes. `source` is added later by the
 * caller, so it is intentionally dropped here.
 */
export function coercePersonaJSON(
  raw: unknown
): { ok: true; data: PersonaJSON } | { ok: false; error: string } {
  return parsePersonaJSONLenient({ persona: locatePersonaData(raw) });
}
