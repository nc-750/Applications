import { describe, it, expect } from "vitest";
import { readPersona, writePersona, clearPersona } from "../../persona/db";
import {
    createEmptyPersona,
    PersonaSkillCategory,
    PersonaSkillLevel,
    PersonaSkillSource,
    PersonaGoalType,
    type Persona,
} from "../../persona/models";

/** A fully-populated domain persona — every optional field set so the round-trip
 *  exercises the whole shape (nested skills, career, traits, goals, interview
 *  messages, derived fields). */
function populatedPersona(): Persona {
    return {
        ...createEmptyPersona(),
        metadata: {
            sourceUsed: ["LinkedIn", "Interview"],
            language: "en-us",
            createdAt: 1700000000000,
            version: "1.0",
        },
        metrics: { story: 0.5, strengths: 0.3, hidden: 0.1, growth: 0, drivers: 0.8 },
        strengths: ["Systems thinking", "Mentorship"],
        weaknesses: ["Over-engineering"],
        skills: [
            {
                name: "TypeScript",
                category: PersonaSkillCategory.Technical,
                level: PersonaSkillLevel.Expert,
                source: PersonaSkillSource.Professional,
            },
        ],
        career: [
            {
                dateStart: 2020,
                dateEnd: 2023,
                role: "Senior Engineer",
                highlights: ["Led a migration"],
                organization: "TechCo",
                realStory: "Harder than it looked.",
                skillsRevealed: [
                    {
                        name: "Rust",
                        category: PersonaSkillCategory.Technical,
                        level: PersonaSkillLevel.Intermediate,
                        source: PersonaSkillSource.Personal,
                    },
                ],
                note: "Formative role.",
            },
        ],
        personal: [
            {
                dateStart: 2019,
                dateEnd: 2024,
                role: "Open-source maintainer",
                highlights: ["10k+ installs"],
            },
        ],
        traits: [{ dimension: "Openness", position: 8, note: "Explores constantly." }],
        values: ["Craftsmanship"],
        hiddenAssets: ["Speaks Mandarin natively"],
        goals: [{ type: PersonaGoalType.ShortTerm, description: "Ship a Rust service." }],
        interview: {
            messages: [{
                role: "user",
                content: "I started in high school.",
                context: undefined,
                timestamp: "2026-01-01T00:00:00.000Z",
                isError: false,
            }],
        },
        derived: {
            howIWorkBest: ["Small-group collaboration"],
            cvSummary: "Experienced full-stack engineer.",
            linkedinAbout: "Builds developer tooling.",
            interviewPitch: "I build products end-to-end.",
        },
    };
}

describe("persona/db", () => {
    it("round-trips a domain persona through write → read", async () => {
        const persona = populatedPersona();

        await writePersona(persona);

        // read returns a domain model equal to the original — proving the key is
        // added on write and stripped on read (no DTO `id` leaks back up).
        expect(await readPersona()).toEqual(persona);
    });

    it("returns null when no persona has been persisted", async () => {
        expect(await readPersona()).toBeNull();
    });

    it("clearPersona removes the record", async () => {
        await writePersona(populatedPersona());
        expect(await readPersona()).not.toBeNull();

        await clearPersona();

        expect(await readPersona()).toBeNull();
    });
});
