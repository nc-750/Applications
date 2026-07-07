// Flow 4 — Synthesis (Call C).
//
// The end-of-interview pipeline that turns the transcript into a structured
// persona, in three focused calls — each with a smaller prompt and a smaller
// boundary schema so the model has fewer fields to juggle:
//   1. extract  — faithful facts (identity, career, skills, non-professional, …)
//   2. analyze  — patterns (strengths, weaknesses, hidden assets, traits)
//   3. polish   — professional copy (CV summary, pitch, LinkedIn about) + metadata
// `mergeSynthesisFragments` recombines the three validated fragments into one
// `SynthesisResult`. A final one-shot "How I Work Best" call derives constructive
// working conditions for the public profile.
//
// This file owns the prompt builders AND the boundary contracts. The LLM is an
// untrusted edge, so each phase output is validated by its Zod schema and its type
// derived via `z.infer` (CONVENTIONS 1.9 / 1.10); the `*_JSON_SCHEMA` is the
// strict-structured-output form. The orchestration that *runs* these calls, and the
// transform from `SynthesisResult` into the persona domain model, live in the
// service layer (Phase 2.5) — not here.

import { z } from "zod";
import type { Message } from "@nc-750/llm-ts";
import { textMessage } from "./Fragments";

// ── Boundary vocabulary ──────────────────────────────────────────────────────
// The exact English tokens the model must emit. These describe the LLM wire
// output, so they live with the boundary schema — not in domain reference data.

const SKILL_CATEGORIES = ["Technical", "Soft", "Domain", "Language", "Transversal", "Tool"] as const;
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert", "Native"] as const;
const SKILL_SOURCES = ["professional", "personal", "inferred"] as const;

// ── Shared ───────────────────────────────────────────────────────────────────

/** Appended to the user prompt on retry when the first attempt produces invalid / no JSON. */
export const FALLBACK_FORMAT_SUFFIX = `\n\nReturn ONLY a single JSON object inside one \`\`\`json code block. Every required field must be present. Do not include any text outside the code block.`;

function hardRules(): string {
    return `HARD RULES:
- ALL FIELD KEYS must be the exact English keys defined by the schema. Never translate or rename a key.
- ALL ENUM VALUES must be the exact English tokens:
  - skill category: ${SKILL_CATEGORIES.join(" | ")}
  - skill level: ${SKILL_LEVELS.join(" | ")}
  - skill source: ${SKILL_SOURCES.join(" | ")}
  - career year_end is a number or the exact word "present"
- ALL human-readable text MUST be in the SAME LANGUAGE the user used during the interview. Keys and enums stay English; prose follows the user.
- Every section must be populated — never output an empty array.`;
}

// JSON-Schema helpers — keep the strict-structured-output forms compact.
const str = { type: "string" };
const num = { type: "number" };
const nullableStr = { type: ["string", "null"] };
function obj(properties: Record<string, unknown>, required = Object.keys(properties)): Record<string, unknown> {
    return { type: "object", additionalProperties: false, properties, required };
}
function arr(items: unknown): Record<string, unknown> {
    return { type: "array", items };
}
function nullableEnum(values: readonly string[]): Record<string, unknown> {
    return { type: ["string", "null"], enum: [...values, null] };
}

// ── Phase 1: Extraction ──────────────────────────────────────────────────────

export const EXTRACT_SCHEMA_NAME = "persona_extract";

export const ExtractSchema = z.object({
    identity: z.object({
        name: z.string(),
        tagline: z.string(),
        elevator_pitch: z.string(),
    }),
    career_timeline: z.array(z.object({
        year_start: z.number(),
        year_end: z.union([z.number(), z.string()]),
        role: z.string(),
        organization: z.string(),
        highlight: z.string().nullable(),
        real_story: z.string().nullable(),
    })),
    skills: z.array(z.object({
        name: z.string(),
        category: z.enum(SKILL_CATEGORIES),
        level: z.enum(SKILL_LEVELS).nullable(),
        source: z.enum(SKILL_SOURCES).nullable(),
    })),
    non_professional: z.array(z.object({
        activity: z.string(),
        skills_revealed: z.array(z.string()),
        note: z.string().nullable(),
    })),
    values: z.array(z.string()),
    goals: z.object({
        short_term: z.string().nullable(),
        long_term: z.string().nullable(),
    }),
});
export type ExtractData = z.infer<typeof ExtractSchema>;

export const EXTRACT_JSON_SCHEMA: Record<string, unknown> = obj({
    identity: obj({ name: str, tagline: str, elevator_pitch: str }),
    career_timeline: arr(obj({
        year_start: num,
        year_end: { type: ["number", "string"] },
        role: str,
        organization: str,
        highlight: nullableStr,
        real_story: nullableStr,
    })),
    skills: arr(obj({
        name: str,
        category: { type: "string", enum: [...SKILL_CATEGORIES] },
        level: nullableEnum(SKILL_LEVELS),
        source: nullableEnum(SKILL_SOURCES),
    })),
    non_professional: arr(obj({
        activity: str,
        skills_revealed: arr(str),
        note: nullableStr,
    })),
    values: arr(str),
    goals: obj({ short_term: nullableStr, long_term: nullableStr }),
});

export function buildExtractSystemPrompt(): Message {
    return textMessage("system", `You extract structured facts from a persona interview transcript. Be PRECISE and FAITHFUL to what was actually said — do not infer, paraphrase, or embellish. Every field must be grounded in the transcript or initial data.

${hardRules()}

Populate richly: extract all skills mentioned or implied, list every role with a real excavated real_story, capture all non-professional activities with transferable skills.`);
}

export function buildExtractUserPrompt(initialData: string, transcript: string): Message {
    return textMessage("user", `<initial_data>
${initialData}
</initial_data>

<interview_transcript>
${transcript}
</interview_transcript>

Extract the following structured sections from the transcript above:

1. **identity** — name, tagline (one-line professional identity in the user's language), elevator_pitch (2–3 sentences capturing who they are professionally)

2. **career_timeline** — each role with year_start (number), year_end (number, or the string "present"), role, organization, highlight (nullable), and real_story (the excavated detail from the interview — what the role was ACTUALLY like, not just the job description)

3. **skills** — with name, category (${SKILL_CATEGORIES.join("|")}), level (${SKILL_LEVELS.join("|")}, nullable), and source (${SKILL_SOURCES.join("|")}, nullable)

4. **non_professional** — hobbies, side projects, caregiving, volunteering — each with activity name, skills_revealed array, and optional note

5. **values** — short phrases representing what the person cares about (extracted from what they said, not invented)

6. **goals** — short_term and long_term (nullable strings if not mentioned in the transcript)

Produce the structured JSON now.`);
}

// ── Phase 2: Analysis ────────────────────────────────────────────────────────

export const ANALYZE_SCHEMA_NAME = "persona_analyze";

export const AnalyzeSchema = z.object({
    strengths: z.array(z.object({
        label: z.string(),
        description: z.string(),
        evidence: z.string().nullable(),
    })),
    weaknesses: z.array(z.object({
        label: z.string(),
        description: z.string(),
        growth_note: z.string().nullable(),
    })),
    hidden_assets: z.array(z.string()),
    personality_traits: z.array(z.object({
        dimension: z.string(),
        position: z.number(),
        note: z.string().nullable(),
    })),
});
export type AnalyzeData = z.infer<typeof AnalyzeSchema>;

export const ANALYZE_JSON_SCHEMA: Record<string, unknown> = obj({
    strengths: arr(obj({ label: str, description: str, evidence: nullableStr })),
    weaknesses: arr(obj({ label: str, description: str, growth_note: nullableStr })),
    hidden_assets: arr(str),
    personality_traits: arr(obj({ dimension: str, position: num, note: nullableStr })),
});

export function buildAnalyzeSystemPrompt(): Message {
    return textMessage("system", `You analyze a persona interview to surface patterns, strengths, growth areas, and — crucially — hidden aspects the person does not claim for themselves.

**Hidden-aspect inference is now this phase's job alone.** The live interview no longer probes for "hidden talents" (asking someone about what they don't see about themselves produces empty answers). Instead, YOU read the full transcript AFTER the fact and surface hidden aspects by inference. Specifically look for:
- Skills the user *demonstrates* through concrete story details but never *labels* as skills.
- Things the user treats as trivial or obvious ("anyone could do that", "it's just…") that a neutral observer would name as real capability.
- Consistent patterns visible across two or more roles or stories that the user never names as a pattern.
- Capabilities implied by the shape of what they built, chose, or endured, but never claimed in words.

Go BEYOND explicit statements — identify connections, name skills the person didn't label, and surface what's unspoken but present. Do NOT invent facts; every hidden asset must be traceable to something concrete in the transcript.

CRITICAL: Every strength and weakness MUST cite specific evidence from the transcript. Use the format: "When discussing [topic], [specific observation]."

${hardRules()}

Populate richly: multiple evidence-backed strengths, fully developed weaknesses, thorough hidden_assets, 3–5 personality_traits.`);
}

export function buildAnalyzeUserPrompt(
    initialData: string,
    transcript: string,
    extractOutput: Record<string, unknown>,
): Message {
    return textMessage("user", `<initial_data>
${initialData}
</initial_data>

<interview_transcript>
${transcript}
</interview_transcript>

<extracted_facts>
${JSON.stringify(extractOutput, null, 2)}
</extracted_facts>

Using the transcript and extracted facts above, produce:

1. **strengths** — Array of objects with:
   - label: short name for the strength
   - description: what it means and how it manifests
   - evidence: specific transcript moment that demonstrates it (nullable but include whenever possible — cite what the person said or did)

2. **weaknesses** — Array of objects with:
   - label: short name
   - description: how it manifests
   - growth_note: constructive framing (nullable)

3. **hidden_assets** — Array of strings. Skills, experiences, or qualities the person possesses but doesn't label as strengths. Things an interviewer would notice that the person doesn't claim for themselves.

4. **personality_traits** — Array of objects with:
   - dimension: the trait name
   - position: 0–10 scale score
   - note: brief explanation grounded in the transcript (nullable)

Produce the structured JSON now.`);
}

// ── Phase 3: Polish ──────────────────────────────────────────────────────────

export const POLISH_SCHEMA_NAME = "persona_polish";

export const PolishSchema = z.object({
    use_cases: z.object({
        cv_summary: z.string().nullable(),
        interview_pitch: z.string().nullable(),
        linkedin_about: z.string().nullable(),
    }),
    metadata: z.object({
        sources_used: z.array(z.string()),
        language: z.string(),
        generated_at: z.string(),
        version: z.string(),
    }),
});
export type PolishData = z.infer<typeof PolishSchema>;

export const POLISH_JSON_SCHEMA: Record<string, unknown> = obj({
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

export function buildPolishSystemPrompt(): Message {
    return textMessage("system", `You write polished, professional-grade content from a gathered persona profile. The output will be used on LinkedIn, in CVs, and in professional introductions. Write with confidence and clarity — help someone present their best professional self authentically.

${hardRules()}

Write professional-grade content suitable for LinkedIn, CVs, and interviews.

metadata.language must be the ISO 639-1 code of the user's language. metadata.generated_at must be the current ISO 8601 timestamp. metadata.version must be "1.0".`);
}

export function buildPolishUserPrompt(
    initialData: string,
    transcript: string,
    extractOutput: Record<string, unknown>,
    analyzeOutput: Record<string, unknown>,
): Message {
    return textMessage("user", `<initial_data>
${initialData}
</initial_data>

<interview_transcript>
${transcript}
</interview_transcript>

<extracted_facts>
${JSON.stringify(extractOutput, null, 2)}
</extracted_facts>

<pattern_analysis>
${JSON.stringify(analyzeOutput, null, 2)}
</pattern_analysis>

Write the following professional content:

1. **use_cases**:
   - cv_summary: A 3–5 sentence professional summary capturing the person's career arc, key skills, and trajectory. Suitable for the top of a CV.
   - interview_pitch: A 30–60 second verbal pitch. Start with "I'm [name], and..."
   - linkedin_about: A 1–2 paragraph LinkedIn About section that tells their professional story engagingly.

2. **metadata**:
   - sources_used: array listing the sources used for this synthesis
   - language: ISO 639-1 code of the user's language
   - generated_at: current ISO 8601 timestamp
   - version: "1.0"

Produce the structured JSON now.`);
}

// ── Merge ────────────────────────────────────────────────────────────────────

/** The three synthesis fragments combined into one boundary object. The transform
 *  from here into the persona domain model lives in the service layer (Phase 2.5). */
export type SynthesisResult = ExtractData & AnalyzeData & PolishData;

/** Combines the three validated synthesis fragments into one `SynthesisResult`. */
export function mergeSynthesisFragments(
    extract: ExtractData,
    analyze: AnalyzeData,
    polish: PolishData,
): SynthesisResult {
    return { ...extract, ...analyze, ...polish };
}

// ── "How I Work Best" (one-shot) ─────────────────────────────────────────────

/** Boundary schema for the one-shot derivation — a JSON array of statements. */
export const HowIWorkBestSchema = z.array(z.string());
export type HowIWorkBest = z.infer<typeof HowIWorkBestSchema>;

/** The narrowed source data the "How I Work Best" prompt reads from. */
export interface HowIWorkBestInput {
    name: string;
    weaknesses: { label: string; description: string }[];
    traits: { dimension: string; position: number; note: string | null }[];
    values: string[];
}

/**
 * One-shot prompt deriving "How I Work Best" — constructive working conditions for
 * the public profile — from weaknesses, personality traits, and values. Run exactly
 * once at interview completion; the result is cached on the persona.
 */
export function buildHowIWorkBestPrompt(input: HowIWorkBestInput): Message {
    const weaknessesSummary = input.weaknesses
        .map((w) => `- ${w.label}: ${w.description}`)
        .join("\n");
    const traitsSummary = input.traits
        .map((t) => `- ${t.dimension} (${t.position}/10)${t.note ? `: ${t.note}` : ""}`)
        .join("\n");
    const valuesLine = input.values.join(", ");
    const count = "3–4";

    return textMessage("user", `You are helping write a professional "How I Work Best" section for ${input.name}'s public profile.

This section should translate honest self-knowledge into constructive working conditions — not expose weaknesses, but describe the environment and conditions in which this person genuinely thrives.

**Source data (private — do NOT copy verbatim into output):**

Weaknesses:
${weaknessesSummary || "Not provided"}

Personality traits:
${traitsSummary || "Not provided"}

Values: ${valuesLine || "Not provided"}

**Transform rules:**
- "indecision under uncertainty" + "needs challenge/interlocutor" → "I do my best work with a trusted collaborator or team that challenges my assumptions"
- "motivation needs anchors" + value "exploration" → "I thrive on projects with a clear problem to solve and enough autonomy to find my own path to it"
- "introvert-leaning" + value "meaningful conversation" → "I work best with focused, substantive collaboration rather than constant group interaction"

**Output:** Return ONLY a JSON array of ${count} strings. Each string is one "how I work best" statement. Honest, self-aware, and constructive — not marketing copy. No explanation, no preamble. Just the JSON array.

Example output:
["I do my best thinking with uninterrupted focus time, then validate with the team.", "I thrive when I can own a problem end-to-end rather than execute on someone else's solution.", "I work best with a small, trusted team where direct feedback is the norm."]`);
}
