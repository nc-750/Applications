import { describe, it, expect } from "vitest";
import type { Message } from "@nc-750/llm-ts";
import {
    buildExtractSystemPrompt,
    buildExtractUserPrompt,
    buildAnalyzeSystemPrompt,
    buildAnalyzeUserPrompt,
    buildPolishSystemPrompt,
    buildPolishUserPrompt,
    buildHowIWorkBestPrompt,
    mergeSynthesisFragments,
    ExtractSchema,
    AnalyzeSchema,
    PolishSchema,
    HowIWorkBestSchema,
    FALLBACK_FORMAT_SUFFIX,
    type ExtractData,
    type AnalyzeData,
    type PolishData,
} from "../../../interview/prompts";

function textOf(msg: Message): string {
    return typeof msg.content === "string"
        ? msg.content
        : msg.content.map((p) => (p.type === "text" ? p.text : "")).join("\n");
}

describe("FALLBACK_FORMAT_SUFFIX", () => {
    it("instructs a single fenced json block", () => {
        expect(FALLBACK_FORMAT_SUFFIX).toContain("```json");
    });
});

describe("extract phase", () => {
    it("system prompt is faithful + carries the hard rules", () => {
        const prompt = textOf(buildExtractSystemPrompt());
        expect(prompt).toContain("FAITHFUL to what was actually said");
        expect(prompt).toContain("HARD RULES");
        expect(prompt).toContain("Technical | Soft | Domain | Language | Transversal | Tool");
    });

    it("user prompt wraps initial data + transcript and lists all six sections", () => {
        const prompt = textOf(buildExtractUserPrompt("Initial bio", "Q: Hi A: Hello"));
        expect(prompt).toContain("<initial_data>");
        expect(prompt).toContain("Initial bio");
        expect(prompt).toContain("<interview_transcript>");
        expect(prompt).toContain("Q: Hi A: Hello");
        for (const s of ["identity", "career_timeline", "skills", "non_professional", "values", "goals"]) {
            expect(prompt).toContain(s);
        }
    });

    it("schema parses a minimal valid extract", () => {
        const res = ExtractSchema.safeParse({
            identity: { name: "Jane", tagline: "Dev", elevator_pitch: "Builds things" },
            career_timeline: [{ year_start: 2020, year_end: "present", role: "Eng", organization: "Acme", highlight: null, real_story: null }],
            skills: [{ name: "TypeScript", category: "Technical", level: "Advanced", source: "professional" }],
            non_professional: [{ activity: "Climbing", skills_revealed: ["grit"], note: null }],
            values: ["craft"],
            goals: { short_term: null, long_term: null },
        });
        expect(res.success).toBe(true);
    });

    it("schema rejects an unknown skill category token", () => {
        const res = ExtractSchema.safeParse({
            identity: { name: "Jane", tagline: "Dev", elevator_pitch: "x" },
            career_timeline: [],
            skills: [{ name: "X", category: "Wizardry", level: null, source: null }],
            non_professional: [],
            values: [],
            goals: { short_term: null, long_term: null },
        });
        expect(res.success).toBe(false);
    });
});

describe("analyze phase", () => {
    it("system prompt requires cited evidence", () => {
        const prompt = textOf(buildAnalyzeSystemPrompt());
        expect(prompt).toContain("cite specific evidence");
        expect(prompt).toContain("3–5 personality_traits");
    });

    it("user prompt embeds the extracted facts as JSON", () => {
        const prompt = textOf(buildAnalyzeUserPrompt("d", "t", { identity: { name: "Test" } }));
        expect(prompt).toContain("<extracted_facts>");
        expect(prompt).toContain('"name": "Test"');
    });

    it("schema parses a minimal valid analysis", () => {
        const res = AnalyzeSchema.safeParse({
            strengths: [{ label: "Focus", description: "Deep work", evidence: null }],
            weaknesses: [{ label: "Impatience", description: "Rushes", growth_note: null }],
            hidden_assets: ["mentoring"],
            personality_traits: [{ dimension: "Openness", position: 8, note: null }],
        });
        expect(res.success).toBe(true);
    });
});

describe("polish phase", () => {
    it("system prompt names the output channels + metadata formats", () => {
        const prompt = textOf(buildPolishSystemPrompt());
        expect(prompt).toContain("LinkedIn");
        expect(prompt).toContain("ISO 639-1");
        expect(prompt).toContain("ISO 8601");
    });

    it("user prompt embeds both extract and analyze outputs", () => {
        const prompt = textOf(buildPolishUserPrompt("d", "t", { e: 1 }, { a: 2 }));
        expect(prompt).toContain("<extracted_facts>");
        expect(prompt).toContain("<pattern_analysis>");
        expect(prompt).toContain("cv_summary");
    });

    it("schema parses a minimal valid polish", () => {
        const res = PolishSchema.safeParse({
            use_cases: { cv_summary: "Sum", interview_pitch: null, linkedin_about: null },
            metadata: { sources_used: ["cv"], language: "en", generated_at: "2026-01-01T00:00:00Z", version: "1.0" },
        });
        expect(res.success).toBe(true);
    });
});

describe("mergeSynthesisFragments", () => {
    it("combines the three fragments into one object", () => {
        const extract = {
            identity: { name: "Jane", tagline: "Dev", elevator_pitch: "x" },
            career_timeline: [],
            skills: [],
            non_professional: [],
            values: [],
            goals: { short_term: null, long_term: null },
        } as ExtractData;
        const analyze = { strengths: [], weaknesses: [], hidden_assets: [], personality_traits: [] } as AnalyzeData;
        const polish = {
            use_cases: { cv_summary: null, interview_pitch: null, linkedin_about: null },
            metadata: { sources_used: [], language: "en", generated_at: "now", version: "1.0" },
        } as PolishData;

        const merged = mergeSynthesisFragments(extract, analyze, polish);
        expect(merged.identity.name).toBe("Jane");
        expect(merged.strengths).toEqual([]);
        expect(merged.metadata.version).toBe("1.0");
    });
});

describe("how I work best", () => {
    it("builds a one-shot user prompt from the source data", () => {
        const msg = buildHowIWorkBestPrompt({
            name: "Jane",
            weaknesses: [{ label: "Indecision", description: "under uncertainty" }],
            traits: [{ dimension: "Openness", position: 8, note: null }],
            values: ["exploration"],
        });
        expect(msg.role).toBe("user");
        const prompt = textOf(msg);
        expect(prompt).toContain("How I Work Best");
        expect(prompt).toContain("Jane");
        expect(prompt).toContain("Indecision: under uncertainty");
        expect(prompt).toContain("Openness (8/10)");
    });

    it("schema parses a JSON array of statements", () => {
        const res = HowIWorkBestSchema.safeParse(["I focus deeply.", "I own problems end-to-end."]);
        expect(res.success).toBe(true);
    });
});
