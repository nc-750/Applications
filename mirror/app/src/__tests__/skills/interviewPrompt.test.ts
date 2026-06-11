import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildProbePrompt,
  INTERVIEW_COMPLETE_SENTINEL,
} from "../../interview/prompts/interviewPrompt";

describe("interviewPrompt", () => {
  describe("INTERVIEW_COMPLETE_SENTINEL", () => {
    it("is the expected string", () => {
      expect(INTERVIEW_COMPLETE_SENTINEL).toBe("<<INTERVIEW_COMPLETE>>");
    });
  });

  describe("buildSystemPrompt", () => {
    const prompt = buildSystemPrompt("Some initial data");

    it("contains philosophy intro", () => {
      expect(prompt).toContain("a CV is a shadow of a person");
    });

    it("contains initial data section", () => {
      expect(prompt).toContain("<initial_data>");
      expect(prompt).toContain("Some initial data");
    });

    it("contains pro process (full excavation)", () => {
      expect(prompt).toContain("Step 1 — Analyze the data");
      expect(prompt).toContain("Layer 1 — Experience excavation");
      expect(prompt).toContain("Layer 2 — Transversal questions");
      expect(prompt).toContain("5–8 questions");
      expect(prompt).toContain("at least 5 questions");
      expect(prompt).toContain("8 questions maximum");
    });

    it("contains completion contract with sentinel", () => {
      expect(prompt).toContain("<<INTERVIEW_COMPLETE>>");
      expect(prompt).toContain("Finishing the interview");
    });

    it("contains language rule", () => {
      expect(prompt).toContain("Mirror their language naturally");
    });

    it("contains tone guidance", () => {
      expect(prompt).toContain("warm");
      expect(prompt).toContain("curious");
    });

    it("does NOT produce the interview JSON itself", () => {
      expect(prompt).toContain("do NOT write the persona profile");
    });
  });

  describe("buildSystemPrompt — no initial data", () => {
    const prompt = buildSystemPrompt("");

    it("informs the model no data was provided", () => {
      expect(prompt).toContain("has not provided any initial data");
      expect(prompt).not.toContain("<initial_data>");
    });
  });

  describe("buildProbePrompt", () => {
    it("scopes the probe to the given facet", () => {
      const prompt = buildProbePrompt({
        initialData: "Some data",
        facet: "strengths",
        action: "advance",
        isFirst: false,
      });
      expect(prompt).toContain("strengths");
    });

    it("keeps the first probe direct with no preamble", () => {
      const prompt = buildProbePrompt({
        initialData: "Some data",
        facet: "story",
        action: "advance",
        isFirst: true,
      });
      expect(prompt).toContain("FIRST probe");
      expect(prompt).toContain("no preamble or summary");
    });

    it("uses follow_up wording when action is follow_up", () => {
      const prompt = buildProbePrompt({
        initialData: "Data",
        facet: "growth",
        action: "follow_up",
        isFirst: false,
      });
      expect(prompt).toContain("Dig DEEPER");
    });
  });
});
