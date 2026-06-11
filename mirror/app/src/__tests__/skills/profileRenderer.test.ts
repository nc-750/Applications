import { describe, it, expect } from "vitest";
import { renderProfile } from "../../profile/services/profileRenderer";
import {
  minimalPersona,
  richPersona,
} from "../factories/persona";

// ── Full render (rich persona) ──────────────────────────────────────────────

describe("renderProfile — rich persona", () => {
  const howIWorkBest = [
    "Give me clear goals and autonomy to figure out the how.",
    "Pair me with people who value deep technical discussion.",
    "I thrive in environments that balance speed with craftsmanship.",
  ];
  const html = renderProfile(richPersona(), howIWorkBest);

  it("produces a complete HTML document", () => {
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("</html>");
  });

  it("includes CSP meta tag", () => {
    expect(html).toContain(
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:;">'
    );
  });

  it("renders hero with name and initials avatar", () => {
    expect(html).toContain("Alex Chen");
    expect(html).toContain(">AC<");
  });

  it("renders about section with elevator pitch", () => {
    expect(html).toContain("<h2>About</h2>");
    expect(html).toContain("polyglot developer");
  });

  it("renders How I Work Best section", () => {
    expect(html).toContain("<h2>How I Work Best</h2>");
    expect(html).toContain("clear goals and autonomy");
    expect(html).toContain("deep technical discussion");
  });

  it("renders strengths (capped at 5)", () => {
    expect(html).toContain("<h2>Strengths</h2>");
    expect(html).toContain("Full-stack fluency");
    expect(html).toContain("Mentorship");
  });

  it("renders skills map (excluding inferred source)", () => {
    expect(html).toContain("<h2>Skills</h2>");
    expect(html).toContain("TypeScript");
    expect(html).toContain("Rust");
    // "Product Strategy" is inferred — should be excluded
    expect(html).not.toContain("Product Strategy");
  });

  it("renders career timeline", () => {
    expect(html).toContain("<h2>Experience</h2>");
    expect(html).toContain("Senior Frontend Engineer");
    expect(html).toContain("Staff Engineer");
  });

  it("renders beyond work section", () => {
    expect(html).toContain("<h2>Beyond Work</h2>");
    expect(html).toContain("VS Code extension");
    expect(html).toContain("competitive cooking");
  });

  it("does NOT render weaknesses", () => {
    expect(html).not.toContain("Over-engineering");
    expect(html).not.toContain("Growth Areas");
  });

  it("does NOT render hidden assets", () => {
    expect(html).not.toContain("Speaks Mandarin");
  });

  it("does NOT render real_story", () => {
    expect(html).not.toContain("200+ components");
  });

  it("does NOT render personality traits", () => {
    expect(html).not.toContain("Openness");
    expect(html).not.toContain("trait-bar-fill");
  });

  it("does NOT render goals", () => {
    expect(html).not.toContain("Short-term");
    expect(html).not.toContain("Long-term");
  });

  it("renders dark mode theme CSS", () => {
    expect(html).toContain("prefers-color-scheme: dark");
  });

  it("renders footer with name", () => {
    expect(html).toContain("<footer>");
    expect(html).toContain("Built with Mirror");
  });
});

// ── Minimal persona ─────────────────────────────────────────────────────────

describe("renderProfile — minimal persona", () => {
  const html = renderProfile(minimalPersona(), []);

  it("produces valid HTML", () => {
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("</html>");
  });

  it("renders hero and about", () => {
    expect(html).toContain("Jane Doe");
    expect(html).toContain("Software Engineer");
  });

  it("hides How I Work Best when array is empty", () => {
    expect(html).not.toContain("<h2>How I Work Best</h2>");
  });

  it("hides strengths section when empty", () => {
    expect(html).not.toContain("<h2>Strengths</h2>");
  });

  it("hides skills section when empty", () => {
    expect(html).not.toContain("<h2>Skills</h2>");
  });

  it("hides experience section when empty", () => {
    expect(html).not.toContain("<h2>Experience</h2>");
  });

  it("hides beyond work section when empty", () => {
    expect(html).not.toContain("<h2>Beyond Work</h2>");
  });
});

// ── How I Work Best edge cases ──────────────────────────────────────────────

describe("renderProfile — how I work best", () => {
  it("renders bullets when array is populated", () => {
    const html = renderProfile(minimalPersona(), ["I work best with clear goals."]);
    expect(html).toContain("<h2>How I Work Best</h2>");
    expect(html).toContain("clear goals");
  });

  it("hides section completely when array is empty", () => {
    const html = renderProfile(richPersona(), []);
    expect(html).not.toContain("<h2>How I Work Best</h2>");
  });
});

// ── Strength cap at 5 ──────────────────────────────────────────────────────

describe("renderProfile — strength cap", () => {
  it("caps strengths at 5", () => {
    const manyStrengths = minimalPersona({
      strengths: [
        { label: "S1", description: "d" },
        { label: "S2", description: "d" },
        { label: "S3", description: "d" },
        { label: "S4", description: "d" },
        { label: "S5", description: "d" },
        { label: "S6", description: "d" }, // should be cut
      ],
    });
    const html = renderProfile(manyStrengths, []);
    expect(html).toContain("S1");
    expect(html).toContain("S5");
    expect(html).not.toContain("S6");
  });
});

// ── Non-professional cap at 4 ──────────────────────────────────────────────

describe("renderProfile — non-professional cap", () => {
  it("caps beyond-work entries at 4", () => {
    const manyActivities = minimalPersona({
      non_professional: [
        { activity: "A1", skills_revealed: [] },
        { activity: "A2", skills_revealed: [] },
        { activity: "A3", skills_revealed: [] },
        { activity: "A4", skills_revealed: [] },
        { activity: "A5", skills_revealed: [] }, // should be cut
      ],
    });
    const html = renderProfile(manyActivities, []);
    expect(html).toContain("A1");
    expect(html).toContain("A4");
    expect(html).not.toContain("A5");
  });
});

// ── Skill source filtering ─────────────────────────────────────────────────

describe("renderProfile — skill source filtering", () => {
  it("includes professional skills", () => {
    const p = minimalPersona({
      skills: [
        { name: "React", category: "Technical", level: "Advanced", source: "professional" },
      ],
    });
    const html = renderProfile(p, []);
    expect(html).toContain("React");
    expect(html).toContain("skill-pro");
  });

  it("includes personal skills", () => {
    const p = minimalPersona({
      skills: [
        { name: "Rust", category: "Technical", level: "Intermediate", source: "personal" },
      ],
    });
    const html = renderProfile(p, []);
    expect(html).toContain("Rust");
    expect(html).toContain("skill-personal");
  });

  it("excludes inferred skills entirely", () => {
    const p = minimalPersona({
      skills: [
        { name: "Leadership", category: "Soft", level: "Advanced", source: "inferred" },
      ],
    });
    const html = renderProfile(p, []);
    expect(html).not.toContain("Leadership");
    expect(html).not.toContain("<h2>Skills</h2>"); // all inferred → no skills to show
  });
});

// ── XSS safety ──────────────────────────────────────────────────────────────

describe("renderProfile — XSS safety", () => {
  it("escapes user text in name", () => {
    const p = minimalPersona({
      identity: {
        name: '<script>alert(1)</script>',
        tagline: "Dev",
        elevator_pitch: "Hi",
      },
    });
    const html = renderProfile(p, []);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes howIWorkBest entries", () => {
    const p = minimalPersona();
    const html = renderProfile(p, ['<img onerror="alert(1)">']);
    // esc() converts < and > to &lt; and &gt; so the tag is defanged
    expect(html).not.toContain("<img onerror");
    expect(html).toContain("&lt;img");
  });
});
