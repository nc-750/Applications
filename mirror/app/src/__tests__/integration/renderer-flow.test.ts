import { describe, it, expect } from "vitest";
import { renderInsight } from "../../skills/insightRenderer";
import { renderProfile } from "../../profile/services/profileRenderer";
import {
  minimalPersona,
  richPersona,
  sparsePersona,
  emptyArraysPersona,
} from "../factories/persona";

describe("renderer integration — scenario matrix", () => {
  // ── Scenario 1: Low content persona ─────────────────────────────────────

  describe("low content persona (minimal)", () => {
    const persona = minimalPersona();
    const insight = renderInsight(persona);
    const profile = renderProfile(persona, []);

    it("insight: produces valid HTML document", () => {
      expect(insight).toMatch(/^<!DOCTYPE html>/);
    });

    it("insight: hides all optional sections", () => {
      expect(insight).not.toContain("<h2>Strengths</h2>");
      expect(insight).not.toContain("<h2>Growth Areas</h2>");
      expect(insight).not.toContain("<h2>Skills Map</h2>");
      expect(insight).not.toContain("<h2>Career Timeline</h2>");
      expect(insight).not.toContain("<h2>Hidden Assets</h2>");
      expect(insight).not.toContain("<h2>Outside Work</h2>");
    });

    it("insight: still renders header and identity", () => {
      expect(insight).toContain("Jane Doe");
      expect(insight).toContain("Software Engineer");
    });

    it("profile: produces valid HTML document", () => {
      expect(profile).toMatch(/^<!DOCTYPE html>/);
    });

    it("profile: hides all sections", () => {
      expect(profile).not.toContain("<h2>How I Work Best</h2>");
      expect(profile).not.toContain("<h2>Strengths</h2>");
      expect(profile).not.toContain("<h2>Skills</h2>");
      expect(profile).not.toContain("<h2>Experience</h2>");
    });
  });

  // ── Scenario 2: High content persona ────────────────────────────────────

  describe("high content persona (rich)", () => {
    const persona = richPersona();
    const howIWorkBest = [
      "Give me clear goals and autonomy.",
      "I thrive with deep technical collaboration.",
      "I work best balancing speed and craftsmanship.",
    ];
    const insight = renderInsight(persona);
    const profile = renderProfile(persona, howIWorkBest);

    it("insight: renders all major sections", () => {
      expect(insight).toContain("<h2>Strengths</h2>");
      expect(insight).toContain("<h2>Growth Areas</h2>");
      expect(insight).toContain("<h2>Skills Map</h2>");
      expect(insight).toContain("<h2>Career Timeline</h2>");
      expect(insight).toContain("<h2>Hidden Assets</h2>");
      expect(insight).toContain("<h2>Outside Work</h2>");
      expect(insight).toContain("<h2>Personality Dimensions</h2>");
      expect(insight).toContain("<h2>Ready-to-use Text</h2>");
    });

    it("profile: renders public-facing sections", () => {
      expect(profile).toContain("<h2>About</h2>");
      expect(profile).toContain("<h2>How I Work Best</h2>");
      expect(profile).toContain("<h2>Strengths</h2>");
      expect(profile).toContain("<h2>Skills</h2>");
      expect(profile).toContain("<h2>Experience</h2>");
      expect(profile).toContain("<h2>Beyond Work</h2>");
    });

    it("profile: does NOT expose private data", () => {
      expect(profile).not.toContain("real_story");
      expect(profile).not.toContain("Over-engineering"); // weaknesses
      expect(profile).not.toContain("Speaks Mandarin"); // hidden assets
    });
  });

  // ── Scenario 3: Missing data / sparse persona ───────────────────────────

  describe("missing data persona (sparse)", () => {
    const persona = sparsePersona();
    const insight = renderInsight(persona);
    const profile = renderProfile(persona, []);

    it("insight: renders available sections", () => {
      expect(insight).toContain("<h2>Strengths</h2>");
      expect(insight).toContain("<h2>Skills Map</h2>");
      expect(insight).toContain("Short-term"); // goals
    });

    it("insight: hides missing sections", () => {
      expect(insight).not.toContain("<h2>Growth Areas</h2>");
      expect(insight).not.toContain("<h2>Career Timeline</h2>");
      expect(insight).not.toContain("<h2>Hidden Assets</h2>");
      expect(insight).not.toContain("<h2>Personality Dimensions</h2>");
    });

    it("insight: renders only short-term goal (no long-term)", () => {
      expect(insight).not.toContain("Long-term");
    });

    it("profile: renders available sections", () => {
      expect(profile).toContain("<h2>Strengths</h2>");
    });

    it("profile: hides unavailable sections", () => {
      expect(profile).not.toContain("<h2>How I Work Best</h2>");
      expect(profile).not.toContain("<h2>Experience</h2>");
      expect(profile).not.toContain("<h2>Beyond Work</h2>");
    });
  });

  // ── Scenario 4: Empty arrays ────────────────────────────────────────────

  describe("empty arrays persona", () => {
    const persona = emptyArraysPersona();
    const insight = renderInsight(persona);

    it("handles all empty arrays without crashing", () => {
      expect(insight).toMatch(/^<!DOCTYPE html>/);
      expect(insight).toContain("</html>");
    });

    it("omits all array-backed sections", () => {
      expect(insight).not.toContain("<h2>Strengths</h2>");
      expect(insight).not.toContain("<h2>Skills Map</h2>");
    });
  });
});
