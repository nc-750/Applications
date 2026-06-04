import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  INTERVIEW_COMPLETE_SENTINEL,
} from "../../skills/interviewPrompt";

describe("interviewPrompt", () => {
  describe("INTERVIEW_COMPLETE_SENTINEL", () => {
    it("is the expected string", () => {
      expect(INTERVIEW_COMPLETE_SENTINEL).toBe("<<INTERVIEW_COMPLETE>>");
    });
  });

  describe("buildSystemPrompt — pro tier", () => {
    const prompt = buildSystemPrompt("Some initial data", "pro");

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

  describe("buildSystemPrompt — free tier", () => {
    const prompt = buildSystemPrompt("Some data", "free");

    it("contains free process (surface interview)", () => {
      expect(prompt).toContain("Step 1 — Quickly review the data");
      expect(prompt).toContain("2–3 questions");
      expect(prompt).toContain("at least 2 questions");
      expect(prompt).toContain("3 questions maximum");
    });

    it("requires at least 1 transversal question", () => {
      expect(prompt).toContain("At least ONE must be a transversal question");
      expect(prompt).toContain("At least 1 of your questions must be a transversal question");
    });

    it("contains free tier constraints", () => {
      expect(prompt).toContain("Do NOT plan deep excavation");
    });
  });

  describe("buildSystemPrompt — no initial data", () => {
    const prompt = buildSystemPrompt("", "pro");

    it("informs the model no data was provided", () => {
      expect(prompt).toContain("has not provided any initial data");
      expect(prompt).not.toContain("<initial_data>");
    });
  });

  describe("buildSystemPrompt — default tier", () => {
    it("defaults to pro when tier is omitted", () => {
      const prompt = buildSystemPrompt("data"); // no tier
      expect(prompt).toContain("5–8 questions");
      expect(prompt).toContain("Layer 1 — Experience excavation");
    });
  });
});
