import { describe, it, expect } from "vitest";
import {
    transcriptOf,
    mergeCoverage,
    canConclude,
    coerceProbe,
} from "../../../interview/services/Helpers";
import {
    type CoverageMap,
    type TranscriptMessage,
    emptyCoverage,
    createTranscriptMessage,
} from "../../../interview/models";

// ── transcriptOf ──────────────────────────────────────────────────────────

describe("transcriptOf", () => {
    it("renders messages as labeled text with User/Interviewer prefixes", () => {
        const messages: TranscriptMessage[] = [
            createTranscriptMessage({ role: "assistant", content: "Hello!", context: "", timestamp: "2026-01-01T00:00:00.000Z" }),
            createTranscriptMessage({ role: "user", content: "Hi there.", timestamp: "2026-01-01T00:00:01.000Z" }),
        ];
        const result = transcriptOf(messages);
        expect(result).toBe("Interviewer: Hello!\n\nUser: Hi there.");
    });

    it("filters out error messages", () => {
        const messages: TranscriptMessage[] = [
            createTranscriptMessage({ role: "user", content: "answer", timestamp: "2026-01-01T00:00:00.000Z" }),
            createTranscriptMessage({ role: "assistant", content: "fail", timestamp: "2026-01-01T00:00:01.000Z", isError: true }),
        ];
        const result = transcriptOf(messages);
        expect(result).toBe("User: answer");
        expect(result).not.toContain("fail");
    });

    it("returns empty string for empty array", () => {
        expect(transcriptOf([])).toBe("");
    });
});

// ── mergeCoverage ─────────────────────────────────────────────────────────

describe("mergeCoverage", () => {
    it("returns max of each facet when both have values", () => {
        const prior: CoverageMap = { story: 0.2, strengths: 0.3, hidden: 0.1, growth: 0.0, drivers: 0.5 };
        const incoming: CoverageMap = { story: 0.8, strengths: 0.1, hidden: 0.9, growth: 0.3, drivers: 0.2 };
        const result = mergeCoverage(prior, incoming);
        expect(result).toEqual({ story: 0.8, strengths: 0.3, hidden: 0.9, growth: 0.3, drivers: 0.5 });
    });

    it("is monotonic — never decreases a facet below prior", () => {
        const prior: CoverageMap = { story: 0.5, strengths: 0.5, hidden: 0.5, growth: 0.5, drivers: 0.5 };
        const incoming: CoverageMap = { story: 0.0, strengths: 0.0, hidden: 0.0, growth: 0.0, drivers: 0.0 };
        const result = mergeCoverage(prior, incoming);
        expect(result).toEqual(prior);
    });

    it("handles zero coverage (both at emptyCoverage)", () => {
        const result = mergeCoverage(emptyCoverage(), emptyCoverage());
        expect(result).toEqual(emptyCoverage());
    });

    it("returns all five facets in output", () => {
        const result = mergeCoverage(emptyCoverage(), emptyCoverage());
        expect(Object.keys(result).sort()).toEqual([
            "drivers", "growth", "hidden", "story", "strengths",
        ]);
    });
});

// ── canConclude ───────────────────────────────────────────────────────────

describe("canConclude", () => {
    it("returns true when all facets >= 0.75", () => {
        const coverage: CoverageMap = { story: 0.8, strengths: 0.9, hidden: 0.75, growth: 0.8, drivers: 0.75 };
        expect(canConclude(coverage)).toBe(true);
    });

    it("returns false when any facet is below 0.75", () => {
        const coverage: CoverageMap = { story: 0.8, strengths: 0.9, hidden: 0.74, growth: 0.8, drivers: 0.8 };
        expect(canConclude(coverage)).toBe(false);
    });

    it("returns false for empty coverage (all zeros)", () => {
        expect(canConclude(emptyCoverage())).toBe(false);
    });

    it("returns true for exactly-at-threshold coverage (0.75 on all)", () => {
        const coverage: CoverageMap = { story: 0.75, strengths: 0.75, hidden: 0.75, growth: 0.75, drivers: 0.75 };
        expect(canConclude(coverage)).toBe(true);
    });
});

// ── coerceProbe ───────────────────────────────────────────────────────────

describe("coerceProbe", () => {
    it("returns probe from a valid parsed object", () => {
        const result = coerceProbe({ context: "Nice.", question: "Tell me more?" });
        expect(result).toEqual({ context: "Nice.", question: "Tell me more?" });
    });

    it("returns probe from a JSON string", () => {
        const result = coerceProbe(JSON.stringify({ context: "OK", question: "Next?" }));
        expect(result).toEqual({ context: "OK", question: "Next?" });
    });

    it("returns probe from a fenced JSON string", () => {
        const result = coerceProbe('```json\n{"context": "Got it", "question": "Proceed?"}\n```');
        expect(result).toEqual({ context: "Got it", question: "Proceed?" });
    });

    it("returns null when raw is null", () => {
        expect(coerceProbe(null)).toBeNull();
    });

    it("returns null when raw is undefined", () => {
        expect(coerceProbe(undefined)).toBeNull();
    });

    it("returns null when raw is a non-object primitive", () => {
        expect(coerceProbe(42)).toBeNull();
        expect(coerceProbe("not json")).toBeNull();
    });

    it("returns null when object lacks a question field", () => {
        expect(coerceProbe({ context: "only context" })).toBeNull();
    });

    it("returns null when question is an empty string", () => {
        expect(coerceProbe({ context: "Hi", question: "" })).toBeNull();
        expect(coerceProbe({ context: "Hi", question: "   " })).toBeNull();
    });

    it("returns probe with empty context when context is missing", () => {
        const result = coerceProbe({ question: "Just a question" });
        expect(result).toEqual({ context: "", question: "Just a question" });
    });

    it("trims whitespace from question and context", () => {
        const result = coerceProbe({ context: "  nice  ", question: "  What?  " });
        expect(result).toEqual({ context: "nice", question: "What?" });
    });
});
