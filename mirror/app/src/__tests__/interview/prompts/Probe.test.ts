import { describe, it, expect } from "vitest";
import type { Message } from "@nc-750/llm-ts";
import {
    buildNextQuestionSystemPrompt,
    ProbeSchema,
    PROBE_SCHEMA_NAME,
    PROBE_JSON_SCHEMA,
    type TurnAnalysis,
} from "../../../interview/prompts";

function textOf(msg: Message): string {
    return typeof msg.content === "string"
        ? msg.content
        : msg.content.map((p) => (p.type === "text" ? p.text : "")).join("\n");
}

function analysis(overrides: Partial<TurnAnalysis> = {}): TurnAnalysis {
    return {
        coverage: { story: 0, strengths: 0, hidden: 0, growth: 0, drivers: 0 },
        probe_signal: "strong",
        next_action: "advance",
        next_facet: "strengths",
        ...overrides,
    };
}

describe("buildNextQuestionSystemPrompt", () => {
    it("scopes the probe to the selected facet", () => {
        const msg = buildNextQuestionSystemPrompt(analysis({ next_facet: "strengths" }));
        expect(msg.role).toBe("system");
        const prompt = textOf(msg);
        expect(prompt).toContain("Strengths");
        expect(prompt).toContain("strengths");
    });

    it("uses advance wording when next_action is advance", () => {
        const prompt = textOf(buildNextQuestionSystemPrompt(analysis({ next_action: "advance", next_facet: "story" })));
        expect(prompt).toContain("Move on to");
    });

    it("uses follow_up wording when next_action is follow_up", () => {
        const prompt = textOf(buildNextQuestionSystemPrompt(analysis({ next_action: "follow_up", next_facet: "growth" })));
        expect(prompt).toContain("Dig DEEPER");
    });

    it("asks for a strictly separated context + question", () => {
        const prompt = textOf(buildNextQuestionSystemPrompt(analysis()));
        expect(prompt).toContain('"context"');
        expect(prompt).toContain('"question"');
        expect(prompt).toContain("exactly ONE question");
    });
});

describe("ProbeSchema", () => {
    it("parses a context + question pair", () => {
        const res = ProbeSchema.safeParse({ context: "Nice.", question: "What next?" });
        expect(res.success).toBe(true);
    });

    it("accepts an empty context (first probe)", () => {
        const res = ProbeSchema.safeParse({ context: "", question: "Tell me about your first role." });
        expect(res.success).toBe(true);
    });

    it("rejects a missing question", () => {
        const res = ProbeSchema.safeParse({ context: "Nice." });
        expect(res.success).toBe(false);
    });
});

describe("Probe JSON schema", () => {
    it("is a named object schema requiring context and question", () => {
        expect(PROBE_SCHEMA_NAME).toBe("probe");
        expect(PROBE_JSON_SCHEMA.required).toEqual(["context", "question"]);
    });
});
