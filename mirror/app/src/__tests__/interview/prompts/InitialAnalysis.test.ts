import { describe, it, expect } from "vitest";
import type { Message } from "@nc-750/llm-ts";
import { buildInterviewSystemPrompt } from "../../../interview/prompts";
import { INTERVIEW_COMPLETE_SENTINEL } from "../../../interview/reference";

function textOf(msg: Message): string {
    return typeof msg.content === "string"
        ? msg.content
        : msg.content.map((p) => (p.type === "text" ? p.text : "")).join("\n");
}

describe("buildInterviewSystemPrompt", () => {
    const msg = buildInterviewSystemPrompt("Some initial data");
    const prompt = textOf(msg);

    it("is a system message", () => {
        expect(msg.role).toBe("system");
    });

    it("contains the philosophy intro", () => {
        expect(prompt).toContain("a CV is a shadow of a person");
    });

    it("embeds the user's initial data", () => {
        expect(prompt).toContain("<user-data>");
        expect(prompt).toContain("Some initial data");
    });

    it("contains the two-layer excavation process", () => {
        expect(prompt).toContain("Step 1 — Analyze the data");
        expect(prompt).toContain("Layer 1 — Experience excavation");
        expect(prompt).toContain("Layer 2 — Transversal questions");
        expect(prompt).toContain("at least 5 questions");
    });

    it("contains the completion contract with the sentinel", () => {
        expect(prompt).toContain("Finishing the interview");
        expect(prompt).toContain(INTERVIEW_COMPLETE_SENTINEL);
    });

    it("tells the model not to write the persona itself", () => {
        expect(prompt).toContain("do NOT write the persona profile");
    });

    it("contains the language and tone rules", () => {
        expect(prompt).toContain("Mirror their language naturally");
        expect(prompt).toContain("warm");
        expect(prompt).toContain("curious");
    });
});
