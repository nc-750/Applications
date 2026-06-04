import { describe, it, expect } from "vitest";
import {
  buildExtractSystemPrompt,
  buildExtractUserPrompt,
  buildAnalyzeSystemPrompt,
  buildAnalyzeUserPrompt,
  buildPolishSystemPrompt,
  buildPolishUserPrompt,
  FALLBACK_FORMAT_SUFFIX,
} from "../../skills/synthesisPrompts";

describe("synthesisPrompts", () => {
  describe("FALLBACK_FORMAT_SUFFIX", () => {
    it("is a non-empty string", () => {
      expect(FALLBACK_FORMAT_SUFFIX.length).toBeGreaterThan(0);
    });

    it("contains json code block instruction", () => {
      expect(FALLBACK_FORMAT_SUFFIX).toContain("```json");
    });
  });

  describe("buildExtractSystemPrompt", () => {
    it("contains pro tier instruction for pro", () => {
      const prompt = buildExtractSystemPrompt("pro");
      expect(prompt).toContain("Pro tier");
      expect(prompt).toContain("populate richly");
    });

    it("contains free tier instruction for free", () => {
      const prompt = buildExtractSystemPrompt("free");
      expect(prompt).toContain("Free tier");
      expect(prompt).toContain("keep content concise");
    });

    it("contains hard rules in both tiers", () => {
      const pro = buildExtractSystemPrompt("pro");
      const free = buildExtractSystemPrompt("free");
      for (const prompt of [pro, free]) {
        expect(prompt).toContain("HARD RULES");
        expect(prompt).toContain("Technical | Soft | Domain | Language | Transversal | Tool");
        expect(prompt).toContain("Beginner | Intermediate | Advanced | Expert | Native");
        expect(prompt).toContain("professional | personal | inferred");
      }
    });
  });

  describe("buildExtractUserPrompt", () => {
    it("wraps initial data and transcript in tags", () => {
      const prompt = buildExtractUserPrompt("Some initial data", "Q: Hello A: Hi");
      expect(prompt).toContain("<initial_data>");
      expect(prompt).toContain("Some initial data");
      expect(prompt).toContain("</initial_data>");
      expect(prompt).toContain("<interview_transcript>");
      expect(prompt).toContain("Q: Hello A: Hi");
      expect(prompt).toContain("</interview_transcript>");
    });

    it("includes extraction instructions for all 6 sections", () => {
      const prompt = buildExtractUserPrompt("data", "transcript");
      expect(prompt).toContain("identity");
      expect(prompt).toContain("career_timeline");
      expect(prompt).toContain("skills");
      expect(prompt).toContain("non_professional");
      expect(prompt).toContain("values");
      expect(prompt).toContain("goals");
    });
  });

  describe("buildAnalyzeSystemPrompt", () => {
    it("contains evidence requirement", () => {
      const prompt = buildAnalyzeSystemPrompt("pro");
      expect(prompt).toContain("evidence");
      expect(prompt).toContain("cite specific");
    });

    it("contains tier-specific depth", () => {
      const pro = buildAnalyzeSystemPrompt("pro");
      expect(pro).toContain("Pro tier");
      expect(pro).toContain("3–5 personality_traits");

      const free = buildAnalyzeSystemPrompt("free");
      expect(free).toContain("Free tier");
      expect(free).toContain("2–3 strengths");
    });
  });

  describe("buildAnalyzeUserPrompt", () => {
    it("includes extracted facts as JSON", () => {
      const extractOutput = { identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" } };
      const prompt = buildAnalyzeUserPrompt("data", "transcript", extractOutput);
      expect(prompt).toContain("<extracted_facts>");
      expect(prompt).toContain('"name": "Test"');
    });

    it("includes all 4 analysis sections", () => {
      const prompt = buildAnalyzeUserPrompt("data", "transcript", {});
      expect(prompt).toContain("strengths");
      expect(prompt).toContain("weaknesses");
      expect(prompt).toContain("hidden_assets");
      expect(prompt).toContain("personality_traits");
    });
  });

  describe("buildPolishSystemPrompt", () => {
    it("contains tier-specific instruction", () => {
      const prompt = buildPolishSystemPrompt("pro");
      expect(prompt).toContain("LinkedIn");
      expect(prompt).toContain("CV");
    });

    it("contains metadata requirements", () => {
      const prompt = buildPolishSystemPrompt("pro");
      expect(prompt).toContain("ISO 639-1");
      expect(prompt).toContain("ISO 8601");
      expect(prompt).toContain('"1.0"');
    });
  });

  describe("buildPolishUserPrompt", () => {
    it("includes both extract and analyze outputs", () => {
      const prompt = buildPolishUserPrompt("data", "t", { e: 1 }, { a: 2 });
      expect(prompt).toContain("<extracted_facts>");
      expect(prompt).toContain("<pattern_analysis>");
    });

    it("includes use_cases instructions", () => {
      const prompt = buildPolishUserPrompt("data", "t", {}, {});
      expect(prompt).toContain("cv_summary");
      expect(prompt).toContain("interview_pitch");
      expect(prompt).toContain("linkedin_about");
    });
  });

  describe("tier-agnostic hard rules", () => {
    it("are present in all three phase system prompts", () => {
      const phases = [
        buildExtractSystemPrompt("pro"),
        buildAnalyzeSystemPrompt("pro"),
        buildPolishSystemPrompt("pro"),
        buildExtractSystemPrompt("free"),
        buildAnalyzeSystemPrompt("free"),
        buildPolishSystemPrompt("free"),
      ];
      for (const prompt of phases) {
        expect(prompt).toContain("HARD RULES");
        expect(prompt).toContain("never output an empty array");
      }
    });
  });
});
