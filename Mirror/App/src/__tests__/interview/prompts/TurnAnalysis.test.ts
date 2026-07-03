import { describe, it, expect } from "vitest";
import type { Message } from "@nc-750/llm-ts";
import {
    buildPersonaMetricsSystemPrompt,
    buildPersonaMetricsUserPrompt,
    TurnAnalysisSchema,
    TURN_ANALYSIS_SCHEMA_NAME,
    TURN_ANALYSIS_JSON_SCHEMA,
} from "../../../interview/prompts";
import { emptyCoverage } from "../../../interview/models";

function textOf(msg: Message): string {
    return typeof msg.content === "string"
        ? msg.content
        : msg.content.map((p) => (p.type === "text" ? p.text : "")).join("\n");
}

describe("buildPersonaMetricsSystemPrompt", () => {
    it("is a system message that renders the current saturation", () => {
        const coverage = { ...emptyCoverage(), story: 0.4, strengths: 0.2 };
        const msg = buildPersonaMetricsSystemPrompt(coverage, 8, 15, false);
        expect(msg.role).toBe("system");
        const prompt = textOf(msg);
        expect(prompt).toContain("ANALYSIS stage");
        expect(prompt).toContain("Story: 0.4");
        expect(prompt).toContain("Strength: 0.2");
    });

    it("renders the budget position while inside the budget", () => {
        const coverage = emptyCoverage();
        const prompt = textOf(buildPersonaMetricsSystemPrompt(coverage, 8, 15, false));
        expect(prompt).toContain("question 8");
        expect(prompt).toContain("soft maximum of 15");
    });

    it("drops the budget line once past the budget", () => {
        const coverage = emptyCoverage();
        const prompt = textOf(buildPersonaMetricsSystemPrompt(coverage, 18, 15, true));
        expect(prompt).not.toContain("soft maximum of");
        expect(prompt).not.toContain("question 18");
    });
});

describe("buildPersonaMetricsUserPrompt", () => {
    it("wraps the question, answer, and transcript", () => {
        const msg = buildPersonaMetricsUserPrompt("What went wrong?", "A lot did", "U: hi\n\nA: ok");
        expect(msg.role).toBe("user");
        const prompt = textOf(msg);
        expect(prompt).toContain("<question>");
        expect(prompt).toContain("What went wrong?");
        expect(prompt).toContain("<answer>");
        expect(prompt).toContain("A lot did");
        expect(prompt).toContain("<transcript>");
        expect(prompt).toContain("U: hi");
    });
});

describe("TurnAnalysisSchema", () => {
    it("parses a full, valid analysis result", () => {
        const res = TurnAnalysisSchema.safeParse({
            coverage: { story: 0.4, strengths: 0.2, hidden: 0, growth: 0, drivers: 0.1 },
            probe_signal: "strong",
            next_action: "advance",
            next_facet: "strengths",
        });
        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.coverage.story).toBe(0.4);
            expect(res.data.next_facet).toBe("strengths");
        }
    });

    it("defaults missing facets to 0", () => {
        const res = TurnAnalysisSchema.safeParse({
            coverage: { story: 0.5 },
            probe_signal: "thin",
            next_action: "follow_up",
            next_facet: "story",
        });
        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.coverage.drivers).toBe(0);
            expect(res.data.coverage.story).toBe(0.5);
        }
    });

    it("rejects unknown enum values", () => {
        const res = TurnAnalysisSchema.safeParse({
            coverage: {},
            probe_signal: "lukewarm",
            next_action: "advance",
            next_facet: "story",
        });
        expect(res.success).toBe(false);
    });
});

describe("TurnAnalysis JSON schema", () => {
    it("is a named object schema requiring all four fields", () => {
        expect(TURN_ANALYSIS_SCHEMA_NAME).toBe("turn_analysis");
        expect(TURN_ANALYSIS_JSON_SCHEMA.type).toBe("object");
        expect(TURN_ANALYSIS_JSON_SCHEMA.required).toEqual([
            "coverage",
            "probe_signal",
            "next_action",
            "next_facet",
        ]);
    });
});
