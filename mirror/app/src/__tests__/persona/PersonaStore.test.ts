import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePersonaStore } from "../../persona/stores";
import {
    createEmptyPersona,
    PersonaSkillCategory,
    PersonaSkillLevel,
    PersonaSkillSource,
    PersonaGoalType,
    type Persona,
} from "../../persona/models";
import { readPersona } from "../../persona/db";

/** A fully-populated domain persona — every optional field set so a round-trip
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
        strengths: [
            { title: "Systems thinking", description: "Sees the whole board" },
            { title: "Mentorship", description: "Grows the people around them" },
        ],
        weaknesses: [{ title: "Over-engineering", description: "Reaches for the general case too soon" }],
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
                note: "Formative role.",
            },
        ],
        personal: [],
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

describe("usePersonaStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("starts from an empty, non-null record", () => {
        const store = usePersonaStore();
        // Stable fields only — `createEmptyPersona()` stamps `metadata.createdAt`
        // with `Date.now()`, so a whole-object equality against a freshly-built
        // empty record is timing-flaky.
        expect(store.persona.skills).toEqual([]);
        expect(store.persona.strengths).toEqual([]);
        expect(store.persona.career).toEqual([]);
        expect(store.persona.derived.cvSummary).toBeNull();
        expect(store.error).toBeNull();
    });

    it("savePersona assigns the live record and persists it", async () => {
        const store = usePersonaStore();
        await store.savePersona(populatedPersona());

        // In-memory aggregate updated in place.
        expect(store.persona.metadata.language).toBe("en-us");
        expect(store.persona.skills[0].name).toBe("TypeScript");
        expect(store.persona.career[0].role).toBe("Senior Engineer");

        // Persisted to the db layer, not just held in memory.
        const persisted = await readPersona();
        expect(persisted).not.toBeNull();
        expect(persisted!.derived.cvSummary).toBe("Experienced full-stack engineer.");
    });

    it("loadPersona rehydrates from persistence into a fresh store", async () => {
        const writer = usePersonaStore();
        await writer.savePersona(populatedPersona());

        setActivePinia(createPinia());
        const reader = usePersonaStore();
        expect(reader.persona.skills).toEqual([]); // fresh instance starts empty

        await reader.loadPersona();
        expect(reader.persona.skills[0].name).toBe("TypeScript");
        expect(reader.persona.goals[0].description).toBe("Ship a Rust service.");
    });

    it("loadPersona leaves the empty seed when nothing is stored", async () => {
        const store = usePersonaStore();
        await store.loadPersona();
        expect(store.persona.skills).toEqual([]);
        expect(store.persona.strengths).toEqual([]);
        expect(store.error).toBeNull();
    });

    it("clearPersona resets to empty and removes the persisted record", async () => {
        const store = usePersonaStore();
        await store.savePersona(populatedPersona());
        expect(await readPersona()).not.toBeNull();

        await store.clearPersona();

        expect(store.persona.skills).toEqual([]);
        expect(store.persona.strengths).toEqual([]);
        expect(store.persona.derived.cvSummary).toBeNull();
        expect(await readPersona()).toBeNull();
    });

    it("is a shared singleton — two usePersonaStore() calls see the same state", async () => {
        // The bug this rung fixes: the old factory stub handed each caller its own
        // unshared copy, so a persona saved by synthesis was invisible to the
        // insight/profile screens. With a real defineStore, a save through one handle
        // is visible through another.
        const a = usePersonaStore();
        const b = usePersonaStore();
        expect(a).toBe(b);

        await a.savePersona(populatedPersona());
        expect(b.persona.metadata.language).toBe("en-us");
        expect(b.persona.skills[0].name).toBe("TypeScript");
    });
});
