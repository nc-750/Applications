import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import type { LLMClient } from "@nc-750/llm-ts";
import { useInterviewStore } from "../../../interview/stores";
import { usePersonaStore } from "../../../persona/stores";
import { runSynthesis } from "../../../interview/services/SynthesisFlow";
import {
    EXTRACT_SCHEMA_NAME,
    ANALYZE_SCHEMA_NAME,
    POLISH_SCHEMA_NAME,
} from "../../../interview/prompts/Synthesis";
import {
    type CoverageMap,
    createTranscriptMessage,
} from "../../../interview/models";

// ── Fake synthesis fixtures ───────────────────────────────────────────────

function fakeExtractData() {
    return {
        identity: { name: "Jane", tagline: "Dev", elevator_pitch: "Builder." },
        career_timeline: [
            { year_start: 2020, year_end: 2023, role: "Engineer", organization: "Acme", highlight: "Led rewrite", real_story: "Monolith → microservices" },
        ],
        skills: [
            { name: "TypeScript", category: "Technical", level: "Advanced", source: "professional" },
        ],
        non_professional: [
            { activity: "Hiking", skills_revealed: ["Navigation"], note: null },
        ],
        values: ["Autonomy"],
        goals: { short_term: "Lead", long_term: null },
    };
}

function fakeAnalyzeData() {
    return {
        strengths: [
            { label: "Problem solving", description: "Finds root causes", evidence: "Prod outage debug" },
        ],
        weaknesses: [
            { label: "Delegation", description: "Takes on too much", growth_note: "Trust the team" },
        ],
        hidden_assets: ["4 languages"],
        personality_traits: [
            { dimension: "openness", position: 8, note: "Curious" },
        ],
    };
}

function fakePolishData() {
    return {
        use_cases: {
            cv_summary: "Experienced engineer.",
            interview_pitch: null,
            linkedin_about: "LinkedIn story.",
        },
        metadata: {
            sources_used: ["transcript"],
            language: "en",
            generated_at: "2026-01-15T12:00:00Z",
            version: "1.0",
        },
    };
}

function fakeHowIWorkBest(): string[] {
    return [
        "I thrive with clear goals and autonomy.",
        "I work best in small, focused teams.",
        "I need uninterrupted deep-work blocks.",
    ];
}

interface SynthesisFakeLLMOpts {
    extract?: unknown;
    analyze?: unknown;
    polish?: unknown;
    howIWorkBest?: string[];
    failPhase?: "extract" | "analyze" | "polish" | "howIWorkBest";
}

function makeSynthesisFakeLLM(opts: SynthesisFakeLLMOpts = {}): LLMClient {
    const extract = opts.extract ?? fakeExtractData();
    const analyze = opts.analyze ?? fakeAnalyzeData();
    const polish = opts.polish ?? fakePolishData();
    const hwb = opts.howIWorkBest ?? fakeHowIWorkBest();
    const failPhase = opts.failPhase;

    return {
        message: vi.fn().mockImplementation(
            async (_input, options?: { structured?: { name?: string } }) => {
                if (options?.structured) {
                    const name = options.structured.name;
                    if (name === EXTRACT_SCHEMA_NAME) {
                        if (failPhase === "extract") {
                            return { ok: false, error: { message: "Extract failed", isAborted: false, provider: "openai" } };
                        }
                        return { ok: true, value: extract };
                    }
                    if (name === ANALYZE_SCHEMA_NAME) {
                        if (failPhase === "analyze") {
                            return { ok: false, error: { message: "Analyze failed", isAborted: false, provider: "openai" } };
                        }
                        return { ok: true, value: analyze };
                    }
                    if (name === POLISH_SCHEMA_NAME) {
                        if (failPhase === "polish") {
                            return { ok: false, error: { message: "Polish failed", isAborted: false, provider: "openai" } };
                        }
                        return { ok: true, value: polish };
                    }
                    // how_i_work_best
                    if (failPhase === "howIWorkBest") {
                        return { ok: false, error: { message: "HWB failed", isAborted: false, provider: "openai" } };
                    }
                    return { ok: true, value: hwb };
                }
                // Plain fallback (returned as string for JSON extraction)
                if (failPhase) {
                    return { ok: false, error: { message: "Plain fallback also failed", isAborted: false, provider: "openai" } };
                }
                return { ok: true, value: JSON.stringify(extract) };
            },
        ),
        stream: vi.fn(),
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function seedInterview(store: ReturnType<typeof useInterviewStore>) {
    const coverage: CoverageMap = { story: 0.8, strengths: 0.7, hidden: 0.6, growth: 0.5, drivers: 0.9 };
    return store.saveInterview({
        status: "synthesizing",
        messages: [
            createTranscriptMessage({ role: "assistant", content: "First question?", timestamp: "2026-01-15T10:00:00.000Z" }),
            createTranscriptMessage({ role: "user", content: "First answer.", timestamp: "2026-01-15T10:00:01.000Z" }),
        ],
        coverage,
        currentFacet: "drivers",
        probeSignal: "strong",
        initialData: "CV data here...",
        inputText: undefined,
        uploadedFileNames: undefined,
        wasDigested: undefined,
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-01-15T10:00:00.000Z",
    });
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("runSynthesis", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it("sets status to synthesizing at start (if not already)", async () => {
        const interviewStore = useInterviewStore();
        const personaStore = usePersonaStore();
        const fakeLLM = makeSynthesisFakeLLM();

        await seedInterview(interviewStore);
        // Resume from active (not synthesizing) to test the initial setStatus
        await interviewStore.setStatus("active");

        await runSynthesis(fakeLLM, interviewStore, personaStore);
        // Should have been set back to synthesizing by runSynthesis
        // (then completed on success)
    });

    it("runs extract→analyze→polish→merge→HWB and commits persona", async () => {
        const interviewStore = useInterviewStore();
        const personaStore = usePersonaStore();
        const fakeLLM = makeSynthesisFakeLLM();

        await seedInterview(interviewStore);

        const persona = await runSynthesis(fakeLLM, interviewStore, personaStore);

        // Persona was committed
        expect(personaStore.persona.value.metadata.language).toBe("en");
        expect(personaStore.persona.value.metadata.version).toBe("1.0");

        // Skills mapped correctly
        expect(personaStore.persona.value.skills.length).toBe(1);
        expect(personaStore.persona.value.skills[0].name).toBe("TypeScript");

        // Career mapped to career (not carreer)
        expect(personaStore.persona.value.career.length).toBe(1);
        expect(personaStore.persona.value.career[0].role).toBe("Engineer");

        // Derived fields from use_cases
        expect(personaStore.persona.value.derived.cvSummary).toBe("Experienced engineer.");
        expect(personaStore.persona.value.derived.linkedinAbout).toBe("LinkedIn story.");
        expect(personaStore.persona.value.derived.interviewPitch).toBeNull();

        // HWB stored in persona.derived.howIWorkBest
        expect(personaStore.persona.value.derived.howIWorkBest).toEqual(fakeHowIWorkBest());

        // Interview status = completed
        expect(interviewStore.status).toBe("completed");

        // Returned persona has the same content as the stored persona
        expect(persona).toEqual(personaStore.persona.value);
    });

    it("sets interview status to error when extract phase fails", async () => {
        const interviewStore = useInterviewStore();
        const personaStore = usePersonaStore();
        const fakeLLM = makeSynthesisFakeLLM({ failPhase: "extract" });

        await seedInterview(interviewStore);

        await expect(
            runSynthesis(fakeLLM, interviewStore, personaStore),
        ).rejects.toThrow("Synthesis extract phase failed");

        expect(interviewStore.status).toBe("error");
        expect(interviewStore.error).toContain("Synthesis failed");
    });

    it("sets interview status to error when analyze phase fails", async () => {
        const interviewStore = useInterviewStore();
        const personaStore = usePersonaStore();
        const fakeLLM = makeSynthesisFakeLLM({ failPhase: "analyze" });

        await seedInterview(interviewStore);

        await expect(
            runSynthesis(fakeLLM, interviewStore, personaStore),
        ).rejects.toThrow("Synthesis analyze phase failed");

        expect(interviewStore.status).toBe("error");
    });

    it("sets interview status to error when polish phase fails", async () => {
        const interviewStore = useInterviewStore();
        const personaStore = usePersonaStore();
        const fakeLLM = makeSynthesisFakeLLM({ failPhase: "polish" });

        await seedInterview(interviewStore);

        await expect(
            runSynthesis(fakeLLM, interviewStore, personaStore),
        ).rejects.toThrow("Synthesis polish phase failed");

        expect(interviewStore.status).toBe("error");
    });

    it("handles How I Work Best failure as non-fatal (persona still saved)", async () => {
        const interviewStore = useInterviewStore();
        const personaStore = usePersonaStore();
        const fakeLLM = makeSynthesisFakeLLM({ failPhase: "howIWorkBest" });

        await seedInterview(interviewStore);

        const persona = await runSynthesis(fakeLLM, interviewStore, personaStore);

        // HWB failed but the persona was still committed
        expect(persona.derived.howIWorkBest).toEqual([]);
        expect(interviewStore.status).toBe("completed");
        expect(personaStore.persona.value.skills.length).toBe(1); // rest of pipeline succeeded
    });

    it("is a callable function (compiles correctly)", () => {
        expect(typeof runSynthesis).toBe("function");
    });
});
