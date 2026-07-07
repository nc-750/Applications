import { describe, it, expect } from "vitest";
import { toPersona } from "../../../interview/services/SynthesisBridge";
import type { SynthesisResult } from "../../../interview/prompts/Synthesis";
import {
    type CoverageMap,
    type TranscriptMessage,
    createTranscriptMessage,
} from "../../../interview/models";
import {
    PersonaSkillCategory,
    PersonaSkillLevel,
    PersonaSkillSource,
    PersonaGoalType,
} from "../../../persona/models/Persona";

// ── Fixtures ──────────────────────────────────────────────────────────────

function fixtureResult(overrides?: Partial<SynthesisResult>): SynthesisResult {
    return {
        identity: { name: "Jane Doe", tagline: "Full-stack dev", elevator_pitch: "Builder of things." },
        career_timeline: [
            {
                year_start: 2020,
                year_end: 2023,
                role: "Senior Engineer",
                organization: "Acme Corp",
                highlight: "Led platform rewrite",
                real_story: "Actually rewrote the entire monolith",
            },
        ],
        skills: [
            { name: "TypeScript", category: "Technical", level: "Expert", source: "professional" },
            { name: "Leadership", category: "Soft", level: "Advanced", source: "inferred" },
            // Deliberately out-of-contract category (the boundary schema only
            // allows 6 categories) to exercise the mapCategory → Other fallback.
            {
                name: "Gardening",
                category: "Other" as unknown as SynthesisResult["skills"][number]["category"],
                level: null,
                source: null,
            },
        ],
        non_professional: [
            { activity: "Hiking", skills_revealed: ["Endurance", "Navigation"], note: "Weekend warrior" },
        ],
        values: ["Autonomy", "Craftsmanship"],
        goals: { short_term: "Lead a team", long_term: null },
        strengths: [
            { label: "Problem solving", description: "Finds root causes", evidence: "Debugged prod outage" },
        ],
        weaknesses: [
            { label: "Delegation", description: "Takes on too much", growth_note: "Learning to trust the team" },
        ],
        hidden_assets: ["Speaks 4 languages"],
        personality_traits: [
            { dimension: "openness", position: 8, note: "Very curious" },
        ],
        use_cases: {
            cv_summary: "A CV summary text.",
            interview_pitch: null,
            linkedin_about: "LinkedIn about text.",
        },
        metadata: {
            sources_used: ["transcript", "initial_data"],
            language: "en",
            generated_at: "2026-01-15T12:00:00Z",
            version: "1.0",
        },
        ...overrides,
    };
}

function fixtureTranscript(): TranscriptMessage[] {
    return [
        createTranscriptMessage({ role: "assistant", content: "Hello!", timestamp: "2026-01-15T10:00:00.000Z" }),
        createTranscriptMessage({ role: "user", content: "Hi!", timestamp: "2026-01-15T10:00:01.000Z" }),
    ];
}

function fixtureCoverage(): CoverageMap {
    return { story: 0.8, strengths: 0.7, growth: 0.5, drivers: 0.9 };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("toPersona", () => {
    it("maps metadata fields correctly", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.metadata.sourceUsed).toEqual(["transcript", "initial_data"]);
        expect(persona.metadata.language).toBe("en");
        expect(persona.metadata.version).toBe("1.0");
        expect(typeof persona.metadata.createdAt).toBe("number");
        expect(persona.metadata.createdAt).toBeGreaterThan(0);
    });

    it("maps coverage to PersonaMetrics (note: coverage.strengths → metrics.strengths)", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.metrics.story).toBe(0.8);
        expect(persona.metrics.strengths).toBe(0.7); // both now plural
        expect(persona.metrics.growth).toBe(0.5);
        expect(persona.metrics.drivers).toBe(0.9);
    });

    it("maps strengths into PersonaStrength objects, folding evidence into the description", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.strengths.length).toBe(1);
        expect(persona.strengths[0]).toEqual({
            title: "Problem solving",
            description: "Finds root causes (Debugged prod outage)",
        });
    });

    it("maps weaknesses into PersonaWeakness objects, folding growth_note into the description", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.weaknesses.length).toBe(1);
        expect(persona.weaknesses[0]).toEqual({
            title: "Delegation",
            description: "Takes on too much → Learning to trust the team",
        });
    });

    it("omits the folded suffix when evidence / growth_note are null", () => {
        const persona = toPersona(
            fixtureResult({
                strengths: [{ label: "Focus", description: "Stays on task", evidence: null }],
                weaknesses: [{ label: "Patience", description: "Wants results fast", growth_note: null }],
            }),
            fixtureTranscript(),
            fixtureCoverage(),
        );
        expect(persona.strengths[0]).toEqual({ title: "Focus", description: "Stays on task" });
        expect(persona.weaknesses[0]).toEqual({ title: "Patience", description: "Wants results fast" });
    });

    it("maps skills with name and correct enum mappings", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.skills.length).toBe(3);

        // TypeScript → Technical (0)
        expect(persona.skills[0].name).toBe("TypeScript");
        expect(persona.skills[0].category).toBe(PersonaSkillCategory.Technical);
        expect(persona.skills[0].level).toBe(PersonaSkillLevel.Expert);
        expect(persona.skills[0].source).toBe(PersonaSkillSource.Professional);

        // Leadership → Soft (1)
        expect(persona.skills[1].name).toBe("Leadership");
        expect(persona.skills[1].category).toBe(PersonaSkillCategory.Soft);
        expect(persona.skills[1].level).toBe(PersonaSkillLevel.Advanced);
        expect(persona.skills[1].source).toBe(PersonaSkillSource.Inferred);
    });

    it("maps Other category, null level→Beginner, null source→Inferred", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        const gardening = persona.skills[2];
        expect(gardening.name).toBe("Gardening");
        expect(gardening.category).toBe(PersonaSkillCategory.Other);
        expect(gardening.level).toBe(PersonaSkillLevel.Beginner);
        expect(gardening.source).toBe(PersonaSkillSource.Inferred);
    });

    it("maps career_timeline to career (not carreer) with correct date handling", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.career.length).toBe(1);
        expect(persona.career[0].role).toBe("Senior Engineer");
        expect(persona.career[0].organization).toBe("Acme Corp");
        expect(persona.career[0].dateStart).toBe(2020);
        expect(persona.career[0].dateEnd).toBe(2023);
        expect(persona.career[0].highlights).toEqual(["Led platform rewrite"]);
        expect(persona.career[0].realStory).toBe("Actually rewrote the entire monolith");
    });

    it("handles 'present' year_end → current year", () => {
        const result = fixtureResult({
            career_timeline: [{
                year_start: 2023,
                year_end: "present",
                role: "Current Role",
                organization: "Now",
                highlight: null,
                real_story: null,
            }],
        });
        const persona = toPersona(result, fixtureTranscript(), fixtureCoverage());
        expect(persona.career[0].dateEnd).toBe(new Date().getFullYear());
    });

    it("handles string year_end that is a number → parseInt", () => {
        const result = fixtureResult({
            career_timeline: [{
                year_start: 2019,
                year_end: "2022",
                role: "Role",
                organization: "Org",
                highlight: null,
                real_story: null,
            }],
        });
        const persona = toPersona(result, fixtureTranscript(), fixtureCoverage());
        expect(persona.career[0].dateEnd).toBe(2022);
    });

    it("maps non_professional to personal with activity→role and skills_revealed→highlights", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.personal.length).toBe(1);
        expect(persona.personal[0].role).toBe("Hiking");
        expect(persona.personal[0].highlights).toEqual(["Endurance", "Navigation"]);
        expect(persona.personal[0].note).toBe("Weekend warrior");
        expect(persona.personal[0].dateStart).toBe(0);
        expect(persona.personal[0].dateEnd).toBe(0);
    });

    it("maps personality_traits to traits", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.traits.length).toBe(1);
        expect(persona.traits[0].dimension).toBe("openness");
        expect(persona.traits[0].position).toBe(8);
        expect(persona.traits[0].note).toBe("Very curious");
    });

    it("maps values and hiddenAssets directly", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.values).toEqual(["Autonomy", "Craftsmanship"]);
        expect(persona.hiddenAssets).toEqual(["Speaks 4 languages"]);
    });

    it("maps goals with type enums — skips null goals", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.goals.length).toBe(1);
        expect(persona.goals[0].type).toBe(PersonaGoalType.ShortTerm);
        expect(persona.goals[0].description).toBe("Lead a team");
    });

    it("maps both goals when both are present", () => {
        const result = fixtureResult({
            goals: { short_term: "Ship MVP", long_term: "CTO" },
        });
        const persona = toPersona(result, fixtureTranscript(), fixtureCoverage());
        expect(persona.goals.length).toBe(2);
        expect(persona.goals[0].type).toBe(PersonaGoalType.ShortTerm);
        expect(persona.goals[1].type).toBe(PersonaGoalType.LongTerm);
    });

    it("stores the domain TranscriptMessage[] verbatim on interview.messages", () => {
        const transcript = fixtureTranscript();
        const persona = toPersona(fixtureResult(), transcript, fixtureCoverage());
        expect(persona.interview.messages.length).toBe(2);
        expect(persona.interview.messages[0].role).toBe("assistant");
        expect(persona.interview.messages[1].role).toBe("user");
        // No wire wrapping — content stays a plain string and the full domain
        // shape is preserved.
        expect(persona.interview.messages[0].content).toBe("Hello!");
        expect(persona.interview.messages).toEqual(transcript);
    });

    it("populates derived fields from use_cases", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.derived.howIWorkBest).toEqual([]); // filled by orchestrator
        expect(persona.derived.cvSummary).toBe("A CV summary text.");
        expect(persona.derived.linkedinAbout).toBe("LinkedIn about text.");
        expect(persona.derived.interviewPitch).toBeNull();
    });

    it("produces a complete Persona with all required fields", () => {
        const persona = toPersona(fixtureResult(), fixtureTranscript(), fixtureCoverage());
        expect(persona.metadata).toBeDefined();
        expect(persona.metrics).toBeDefined();
        expect(persona.strengths).toBeDefined();
        expect(persona.weaknesses).toBeDefined();
        expect(persona.skills).toBeDefined();
        expect(persona.career).toBeDefined();
        expect(persona.personal).toBeDefined();
        expect(persona.traits).toBeDefined();
        expect(persona.values).toBeDefined();
        expect(persona.hiddenAssets).toBeDefined();
        expect(persona.goals).toBeDefined();
        expect(persona.interview).toBeDefined();
        expect(persona.derived).toBeDefined();
    });
});
