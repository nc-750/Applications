import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import {
    personaToInterview,
    syncInterviewAfterImport,
    deletePersona,
} from "../../../persona/services";
import { usePersonaStore } from "../../../persona/stores";
import { useInterviewStore } from "../../../interview/stores";
import {
    createEmptyPersona,
    PersonaSkillCategory,
    PersonaSkillLevel,
    PersonaSkillSource,
    type Persona,
} from "../../../persona/models";
import { createTranscriptMessage } from "../../../core/Transcript";
import type { Interview } from "../../../interview/models";

/** A persona that carries a completed interview transcript and metrics. */
function personaWithInterview(): Persona {
    return {
        ...createEmptyPersona(),
        metrics: {
            story: 0.75,
            strengths: 0.6,
            hidden: 0.4,
            growth: 0.8,
            drivers: 0.5,
        },
        strengths: [{ title: "Systems thinking", description: "Sees the whole board" }],
        skills: [
            {
                name: "TypeScript",
                category: PersonaSkillCategory.Technical,
                level: PersonaSkillLevel.Expert,
                source: PersonaSkillSource.Professional,
            },
        ],
        interview: {
            messages: [
                createTranscriptMessage({
                    role: "assistant",
                    content: "What drives you?",
                }),
                createTranscriptMessage({
                    role: "user",
                    content: "Solving hard problems.",
                }),
            ],
        },
    };
}

/** A persona with no interview data at all (the empty seed). */
function emptyPersona(): Persona {
    return createEmptyPersona();
}

describe("personaToInterview", () => {
    it("maps persona metrics to coverage 1:1", () => {
        const persona = personaWithInterview();
        const interview = personaToInterview(persona);

        expect(interview.status).toBe("completed");
        expect(interview.coverage).toEqual({
            story: 0.75,
            strengths: 0.6,
            hidden: 0.4,
            growth: 0.8,
            drivers: 0.5,
        });
    });

    it("copies the full transcript into interview messages", () => {
        const persona = personaWithInterview();
        const interview = personaToInterview(persona);

        expect(interview.messages).toHaveLength(2);
        expect(interview.messages[0].role).toBe("assistant");
        expect(interview.messages[0].content).toBe("What drives you?");
        expect(interview.messages[1].role).toBe("user");
        expect(interview.messages[1].content).toBe("Solving hard problems.");
    });

    it("sets status to completed", () => {
        const interview = personaToInterview(emptyPersona());
        expect(interview.status).toBe("completed");
    });

    it("handles empty persona (zero metrics, no messages)", () => {
        const interview = personaToInterview(emptyPersona());

        expect(interview.status).toBe("completed");
        expect(interview.messages).toHaveLength(0);
        expect(interview.coverage).toEqual({
            story: 0,
            strengths: 0,
            hidden: 0,
            growth: 0,
            drivers: 0,
        });
    });

    it("sets fresh createdAt and updatedAt for the import moment", () => {
        const before = new Date().toISOString();
        const interview = personaToInterview(emptyPersona());
        const after = new Date().toISOString();

        expect(interview.createdAt >= before).toBe(true);
        expect(interview.createdAt <= after).toBe(true);
        expect(interview.updatedAt).toBe(interview.createdAt);
    });

    it("resets transient interview fields to defaults", () => {
        const interview = personaToInterview(personaWithInterview());

        expect(interview.currentFacet).toBeUndefined();
        expect(interview.probeSignal).toBeUndefined();
        expect(interview.initialData).toBe("");
        expect(interview.inputText).toBeUndefined();
        expect(interview.uploadedFileNames).toBeUndefined();
        expect(interview.wasDigested).toBeUndefined();
    });
});

describe("syncInterviewAfterImport", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("syncs the interview store when persona has messages", async () => {
        const persona = personaWithInterview();
        const interviewStore = useInterviewStore();
        const spy = vi.spyOn(interviewStore, "saveInterview");

        await syncInterviewAfterImport(persona, interviewStore);

        expect(spy).toHaveBeenCalledTimes(1);
        const saved: Interview = spy.mock.calls[0][0];
        expect(saved.status).toBe("completed");
        expect(saved.messages).toHaveLength(2);
        expect(saved.coverage).toEqual({
            story: 0.75,
            strengths: 0.6,
            hidden: 0.4,
            growth: 0.8,
            drivers: 0.5,
        });
    });

    it("does NOT sync when persona has no interview messages", async () => {
        const interviewStore = useInterviewStore();
        const spy = vi.spyOn(interviewStore, "saveInterview");

        await syncInterviewAfterImport(emptyPersona(), interviewStore);

        expect(spy).not.toHaveBeenCalled();
        // Interview store is left untouched — still contains the empty seed.
        expect(interviewStore.status).toBe("idle");
    });
});

describe("deletePersona", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("calls clearPersona and clearInterview on their respective stores", async () => {
        const personaStore = usePersonaStore();
        const interviewStore = useInterviewStore();
        const personaSpy = vi.spyOn(personaStore, "clearPersona");
        const interviewSpy = vi.spyOn(interviewStore, "clearInterview");

        await deletePersona(personaStore, interviewStore);

        expect(personaSpy).toHaveBeenCalledTimes(1);
        expect(interviewSpy).toHaveBeenCalledTimes(1);
    });

    it("still calls clearInterview when clearPersona surfaces an error", async () => {
        const personaStore = usePersonaStore();
        const interviewStore = useInterviewStore();
        // clearPersona catches into personaStore.error — it never throws.
        // Simulate an error by spying and rejecting its internal path.
        const personaSpy = vi
            .spyOn(personaStore, "clearPersona")
            .mockRejectedValueOnce(new Error("persona clear failed"));
        const interviewSpy = vi.spyOn(interviewStore, "clearInterview");

        await deletePersona(personaStore, interviewStore);

        // Both were still reached.
        expect(personaSpy).toHaveBeenCalledTimes(1);
        expect(interviewSpy).toHaveBeenCalledTimes(1);
    });

    it("runs clearInterview even when the persona clear already failed", async () => {
        const personaStore = usePersonaStore();
        const interviewStore = useInterviewStore();
        vi.spyOn(personaStore, "clearPersona").mockRejectedValueOnce(new Error("fail"));
        const interviewSpy = vi.spyOn(interviewStore, "clearInterview");

        // deletePersona swallows the rejection — it does not throw.
        await expect(deletePersona(personaStore, interviewStore)).resolves.toBeUndefined();
        expect(interviewSpy).toHaveBeenCalledTimes(1);
    });
});
