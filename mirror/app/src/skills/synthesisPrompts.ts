// Per-phase system + user prompts for the three-phase persona synthesis.
// Each call gets a focused prompt that matches its subset schema — the model
// has fewer fields to juggle and clearer expectations per call.

import type { InterviewTier } from "./interviewPrompt";

// ── Shared ────────────────────────────────────────────────────────────────────

/** Appended to the user prompt on retry when the first attempt produces invalid / no JSON. */
export const FALLBACK_FORMAT_SUFFIX = `\n\nReturn ONLY a single JSON object inside one \`\`\`json code block. Every required field must be present. Do not include any text outside the code block.`;

function tierExtractDepth(tier: InterviewTier): string {
  return tier === "free"
    ? `Free tier — keep content concise: 2–4 skills, 1–2 non-professional activities, a one-line real_story for the most recent role only, short values list.`
    : `Pro tier — populate richly: extract all skills mentioned or implied, list every role with a real excavated real_story, capture all non-professional activities with transferable skills.`;
}

function tierAnalyzeDepth(tier: InterviewTier): string {
  return tier === "free"
    ? `Free tier — keep concise: 2–3 strengths, 1–2 weaknesses, 1–2 hidden_assets, 1–2 personality_traits.`
    : `Pro tier — populate richly: multiple evidence-backed strengths, fully developed weaknesses, thorough hidden_assets, 3–5 personality_traits.`;
}

function tierPolishDepth(_tier: InterviewTier): string {
  // Use cases and metadata don't vary much by tier; the quality of the
  // upstream data drives the output.  We keep a single instruction set.
  return `Write professional-grade content suitable for LinkedIn, CVs, and interviews.`;
}

function hardRules(): string {
  return `HARD RULES:
- ALL FIELD KEYS must be the exact English keys defined by the schema. Never translate or rename a key.
- ALL ENUM VALUES must be the exact English tokens:
  - skill category: Technical | Soft | Domain | Language | Transversal | Tool
  - skill level: Beginner | Intermediate | Advanced | Expert | Native
  - skill source: professional | personal | inferred
  - career year_end is a number or the exact word "present"
- ALL human-readable text MUST be in the SAME LANGUAGE the user used during the interview. Keys and enums stay English; prose follows the user.
- Every section must be populated — never output an empty array.`;
}

// ── Phase 1: Extraction ──────────────────────────────────────────────────────

export function buildExtractSystemPrompt(tier: InterviewTier): string {
  return `You extract structured facts from a persona interview transcript. Be PRECISE and FAITHFUL to what was actually said — do not infer, paraphrase, or embellish. Every field must be grounded in the transcript or initial data.

${hardRules()}

${tierExtractDepth(tier)}`;
}

export function buildExtractUserPrompt(initialData: string, transcript: string): string {
  return `<initial_data>
${initialData}
</initial_data>

<interview_transcript>
${transcript}
</interview_transcript>

Extract the following structured sections from the transcript above:

1. **identity** — name, tagline (one-line professional identity in the user's language), elevator_pitch (2–3 sentences capturing who they are professionally)

2. **career_timeline** — each role with year_start (number), year_end (number, or the string "present"), role, organization, highlight (nullable), and real_story (the excavated detail from the interview — what the role was ACTUALLY like, not just the job description)

3. **skills** — with name, category (Technical|Soft|Domain|Language|Transversal|Tool), level (Beginner|Intermediate|Advanced|Expert|Native, nullable), and source (professional|personal|inferred, nullable)

4. **non_professional** — hobbies, side projects, caregiving, volunteering — each with activity name, skills_revealed array, and optional note

5. **values** — short phrases representing what the person cares about (extracted from what they said, not invented)

6. **goals** — short_term and long_term (nullable strings if not mentioned in the transcript)

Produce the structured JSON now.`;
}

// ── Phase 2: Analysis ────────────────────────────────────────────────────────

export function buildAnalyzeSystemPrompt(tier: InterviewTier): string {
  return `You analyze a persona interview to surface patterns, hidden strengths, and growth areas. Go BEYOND explicit statements — identify connections, name skills the person didn't label, and surface what's unspoken but present.

CRITICAL: Every strength and weakness MUST cite specific evidence from the transcript. Use the format: "When discussing [topic], [specific observation]."

${hardRules()}

${tierAnalyzeDepth(tier)}`;
}

export function buildAnalyzeUserPrompt(
  initialData: string,
  transcript: string,
  extractOutput: Record<string, unknown>,
): string {
  return `<initial_data>
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

Produce the structured JSON now.`;
}

// ── Phase 3: Polish ──────────────────────────────────────────────────────────

export function buildPolishSystemPrompt(tier: InterviewTier): string {
  return `You write polished, professional-grade content from a gathered persona profile. The output will be used on LinkedIn, in CVs, and in professional introductions. Write with confidence and clarity — help someone present their best professional self authentically.

${hardRules()}

${tierPolishDepth(tier)}

metadata.language must be the ISO 639-1 code of the user's language. metadata.generated_at must be the current ISO 8601 timestamp. metadata.version must be "1.0".`;
}

export function buildPolishUserPrompt(
  initialData: string,
  transcript: string,
  extractOutput: Record<string, unknown>,
  analyzeOutput: Record<string, unknown>,
): string {
  return `<initial_data>
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

Produce the structured JSON now.`;
}
