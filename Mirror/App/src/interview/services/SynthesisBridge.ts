// Boundary-to-domain transform: SynthesisResult → Persona.
//
// The LLM is an untrusted boundary — it returns string enums, nullable fields,
// and snake_case keys. This module is the SINGLE place where those boundary
// shapes cross into the domain (CONVENTIONS 1.5 / 1.6). Every enum mapping,
// every nullable default, and every field rename lives here and nowhere else.
// The analyze boundary names a strength/weakness `label`; the domain calls it
// `title` (PersonaStrength / PersonaWeakness) — that rename happens here.

import {
    type Persona,
    type PersonaCareer,
    type PersonaStrength,
    type PersonaWeakness,
    PersonaSkillCategory,
    PersonaSkillLevel,
    PersonaSkillSource,
    PersonaGoalType,
    type PersonaGoal,
    createEmptyPersona,
} from "../../persona/models/Persona";
import type { CoverageMap, TranscriptMessage } from "../models";
import type { SynthesisResult } from "../prompts/Synthesis";

// ── Enum mappers ──────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, PersonaSkillCategory> = {
    Technical: PersonaSkillCategory.Technical,
    Soft: PersonaSkillCategory.Soft,
    Domain: PersonaSkillCategory.Domain,
    Language: PersonaSkillCategory.Language,
    Transversal: PersonaSkillCategory.Transversal,
    Tool: PersonaSkillCategory.Tool,
    Other: PersonaSkillCategory.Other,
};

function mapCategory(raw: string): PersonaSkillCategory {
    return CATEGORY_MAP[raw] ?? PersonaSkillCategory.Other;
}

const LEVEL_MAP: Record<string, PersonaSkillLevel> = {
    Beginner: PersonaSkillLevel.Beginner,
    Intermediate: PersonaSkillLevel.Intermediate,
    Advanced: PersonaSkillLevel.Advanced,
    Expert: PersonaSkillLevel.Expert,
    Native: PersonaSkillLevel.Native,
};

function mapLevel(raw: string | null): PersonaSkillLevel {
    if (!raw) return PersonaSkillLevel.Beginner;
    return LEVEL_MAP[raw] ?? PersonaSkillLevel.Beginner;
}

const SOURCE_MAP: Record<string, PersonaSkillSource> = {
    professional: PersonaSkillSource.Professional,
    personal: PersonaSkillSource.Personal,
    inferred: PersonaSkillSource.Inferred,
};

function mapSource(raw: string | null): PersonaSkillSource {
    if (!raw) return PersonaSkillSource.Inferred;
    return SOURCE_MAP[raw] ?? PersonaSkillSource.Inferred;
}

// ── Field helpers ─────────────────────────────────────────────────────────

function parseYearEnd(raw: number | string): number {
    if (typeof raw === "number") return raw;
    if (raw === "present") return new Date().getFullYear();
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? new Date().getFullYear() : parsed;
}

/** Map an analysis strength onto the domain `PersonaStrength` ({ title, description }).
 *  `label` → `title`; supporting `evidence` is folded into the description so the
 *  boundary detail isn't lost. */
function toStrength(s: {
    label: string;
    description: string;
    evidence: string | null;
}): PersonaStrength {
    const evidence = s.evidence ? ` (${s.evidence})` : "";
    return { title: s.label, description: `${s.description}${evidence}` };
}

/** Map an analysis weakness onto the domain `PersonaWeakness` ({ title, description }).
 *  `label` → `title`; the constructive `growth_note` is folded into the description. */
function toWeakness(w: {
    label: string;
    description: string;
    growth_note: string | null;
}): PersonaWeakness {
    const growth = w.growth_note ? ` → ${w.growth_note}` : "";
    return { title: w.label, description: `${w.description}${growth}` };
}

/** Build `PersonaGoal[]` from the synthesis boundary's `{ short_term, long_term }`. */
function buildGoals(g: {
    short_term: string | null;
    long_term: string | null;
}): PersonaGoal[] {
    const goals: PersonaGoal[] = [];
    if (g.short_term) {
        goals.push({
            type: PersonaGoalType.ShortTerm,
            description: g.short_term,
        });
    }
    if (g.long_term) {
        goals.push({
            type: PersonaGoalType.LongTerm,
            description: g.long_term,
        });
    }
    return goals;
}

// ── Public transform ──────────────────────────────────────────────────────

/**
 * Transform the LLM boundary output (`SynthesisResult` + transcript + coverage)
 * into the domain `Persona` model.
 *
 * The returned Persona has `derived.howIWorkBest` set to `[]` — the caller
 * (SynthesisFlow) fills it after the "How I Work Best" LLM call completes.
 * `derived.cvSummary`, `derived.linkedinAbout`, and `derived.interviewPitch`
 * are populated from the polish phase's `use_cases`.
 */
export function toPersona(
    result: SynthesisResult,
    transcript: TranscriptMessage[],
    coverage: CoverageMap,
): Persona {
    const persona = createEmptyPersona();

    // Metadata
    persona.metadata.sourceUsed = result.metadata.sources_used;
    persona.metadata.language = result.metadata.language;
    persona.metadata.createdAt = Date.now();
    persona.metadata.version = result.metadata.version;

    // Metrics (coverage)
    persona.metrics.story = coverage.story;
    persona.metrics.strengths = coverage.strengths;
    persona.metrics.growth = coverage.growth;
    persona.metrics.drivers = coverage.drivers;

    // Strengths / weaknesses
    persona.strengths = result.strengths.map(toStrength);
    persona.weaknesses = result.weaknesses.map(toWeakness);

    // Skills (with name, enum mapping)
    persona.skills = result.skills.map((s) => ({
        name: s.name,
        category: mapCategory(s.category),
        level: mapLevel(s.level),
        source: mapSource(s.source),
    }));

    // Career timeline → career (not carreer)
    persona.career = result.career_timeline.map((c): PersonaCareer => ({
        dateStart: c.year_start,
        dateEnd: parseYearEnd(c.year_end),
        role: c.role,
        organization: c.organization,
        highlights: c.highlight ? [c.highlight] : [],
        realStory: c.real_story ?? undefined,
    }));

    // Non-professional → personal
    persona.personal = result.non_professional.map((n): PersonaCareer => ({
        dateStart: 0,
        dateEnd: 0,
        role: n.activity,
        highlights: n.skills_revealed,
        realStory: undefined,
        note: n.note ?? undefined,
    }));

    // Traits
    persona.traits = result.personality_traits.map((t) => ({
        dimension: t.dimension,
        position: t.position,
        note: t.note ?? undefined,
    }));

    // Direct arrays
    persona.values = result.values;
    persona.hiddenAssets = result.hidden_assets;

    // Goals
    persona.goals = buildGoals(result.goals);

    // Interview transcript is already the domain `TranscriptMessage[]` the
    // persona stores — keep it as-is (the store JSON-clones on persist).
    persona.interview.messages = transcript;

    // Derived fields from polish's use_cases
    persona.derived.howIWorkBest = []; // filled by SynthesisFlow after HWB call
    persona.derived.cvSummary = result.use_cases.cv_summary;
    persona.derived.linkedinAbout = result.use_cases.linkedin_about;
    persona.derived.interviewPitch = result.use_cases.interview_pitch;

    return persona;
}
