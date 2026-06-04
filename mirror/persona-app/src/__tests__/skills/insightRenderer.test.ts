import { describe, it, expect } from "vitest";
import { renderInsight } from "../../skills/insightRenderer";
import {
  minimalPersona,
  richPersona,
  sparsePersona,
} from "../factories/persona";

// ── Full render (rich persona) ──────────────────────────────────────────────

describe("renderInsight — rich persona", () => {
  const html = renderInsight(richPersona());

  it("produces a complete HTML document", () => {
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("</html>");
  });

  it("includes CSP meta tag", () => {
    expect(html).toContain(
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:;">'
    );
  });

  it("sets lang attribute from persona metadata", () => {
    expect(html).toContain('<html lang="en">');
  });

  it("renders the persona name and initials", () => {
    expect(html).toContain("Alex Chen");
    expect(html).toContain(">AC<"); // initials in avatar
  });

  it("renders the tagline", () => {
    expect(html).toContain("Full-Stack Developer &amp; Open Source Contributor");
  });

  it("renders the elevator pitch", () => {
    expect(html).toContain("polyglot developer");
  });

  it("renders the Private badge", () => {
    expect(html).toContain("Private");
  });

  it("renders strengths with evidence", () => {
    expect(html).toContain("Full-stack fluency");
    expect(html).toContain("Mentorship");
    // Evidence
    expect(html).toContain("dashboard project");
  });

  it("renders growth areas with growth notes", () => {
    expect(html).toContain("Growth Areas");
    expect(html).toContain("Over-engineering");
    expect(html).toContain("Practice shipping MVPs");
  });

  it("renders skills map with categories", () => {
    expect(html).toContain("Skills Map");
    expect(html).toContain("TypeScript");
    expect(html).toContain("Rust");
    // Source badges
    expect(html).toContain("skill-pro"); // professional
    expect(html).toContain("skill-personal"); // personal
    expect(html).toContain("skill-inferred"); // inferred
  });

  it("renders career timeline", () => {
    expect(html).toContain("Career Timeline");
    expect(html).toContain("Senior Frontend Engineer");
    expect(html).toContain("Staff Engineer");
    expect(html).toContain("TechCo");
    expect(html).toContain("StartupX");
  });

  it("renders real_story in timeline", () => {
    expect(html).toContain("real-story");
    expect(html).toContain("200+ components");
  });

  it("renders outside work section", () => {
    expect(html).toContain("Outside Work");
    expect(html).toContain("VS Code extension");
    expect(html).toContain("competitive cooking");
  });

  it("renders hidden assets", () => {
    expect(html).toContain("Hidden Assets");
    expect(html).toContain("Speaks Mandarin natively");
  });

  it("renders personality dimensions with bar charts", () => {
    expect(html).toContain("Personality Dimensions");
    expect(html).toContain("Openness");
    expect(html).toContain("trait-bar-fill");
    expect(html).toContain("width:80%"); // position 8 → 80%
  });

  it("renders values tags", () => {
    expect(html).toContain("Values");
    expect(html).toContain("Craftsmanship");
    expect(html).toContain("Continuous Learning");
  });

  it("renders goals with short and long term", () => {
    expect(html).toContain("Short-term");
    expect(html).toContain("Long-term");
    expect(html).toContain("production-grade Rust service");
    expect(html).toContain("CTO or technical founder");
  });

  it("renders ready-to-use text with details elements", () => {
    expect(html).toContain("Ready-to-use Text");
    expect(html).toContain("CV Summary");
    expect(html).toContain("60-second Interview Pitch");
    expect(html).toContain("LinkedIn About");
  });

  it("renders footer with date", () => {
    expect(html).toContain("Persona Insight");
    expect(html).toContain("15 January 2026");
  });
});

// ── Minimal persona (all arrays empty) ──────────────────────────────────────

describe("renderInsight — minimal persona", () => {
  const html = renderInsight(minimalPersona());

  it("produces valid HTML structure", () => {
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("</html>");
  });

  it("renders header with name and tagline", () => {
    expect(html).toContain("Jane Doe");
    expect(html).toContain("Software Engineer");
  });

  it("renders elevator pitch section", () => {
    expect(html).toContain("Elevator Pitch");
    expect(html).toContain("I build things.");
  });

  it("omits strengths section when empty", () => {
    expect(html).not.toContain("<h2>Strengths</h2>");
  });

  it("omits growth areas section when empty", () => {
    expect(html).not.toContain("<h2>Growth Areas</h2>");
  });

  it("omits skills map when empty", () => {
    expect(html).not.toContain("<h2>Skills Map</h2>");
  });

  it("omits career timeline when empty", () => {
    expect(html).not.toContain("<h2>Career Timeline</h2>");
  });

  it("omits outside work section when empty", () => {
    expect(html).not.toContain("<h2>Outside Work</h2>");
  });

  it("omits hidden assets when empty", () => {
    expect(html).not.toContain("<h2>Hidden Assets</h2>");
  });

  it("omits personality dimensions when empty", () => {
    expect(html).not.toContain("<h2>Personality Dimensions</h2>");
  });

  it("renders values section even with empty tags", () => {
    expect(html).toContain("<h2>Values</h2>");
  });

  it("omits goals grid when both goals are empty", () => {
    expect(html).not.toContain("Short-term");
    expect(html).not.toContain("Long-term");
  });

  it("omits ready-to-use text when all use cases are empty", () => {
    expect(html).not.toContain("<h2>Ready-to-use Text</h2>");
  });
});

// ── Sparse persona (partial data) ───────────────────────────────────────────

describe("renderInsight — sparse persona", () => {
  const html = renderInsight(sparsePersona());

  it("renders available strengths", () => {
    expect(html).toContain("<h2>Strengths</h2>");
    expect(html).toContain("Debugging");
  });

  it("omits growth areas (no weaknesses)", () => {
    expect(html).not.toContain("<h2>Growth Areas</h2>");
  });

  it("renders available skills", () => {
    expect(html).toContain("<h2>Skills Map</h2>");
    expect(html).toContain("Python");
  });

  it("renders short-term goal but not long-term", () => {
    expect(html).toContain("Short-term");
    expect(html).toContain("Learn Rust.");
    expect(html).not.toContain("Long-term");
  });
});

// ── XSS safety ──────────────────────────────────────────────────────────────

describe("renderInsight — XSS safety", () => {
  it("escapes user-provided text in name", () => {
    const p = minimalPersona({
      identity: {
        name: '<script>alert("xss")</script>',
        tagline: "Dev",
        elevator_pitch: "Hi",
      },
    });
    const html = renderInsight(p);
    expect(html).not.toContain('<script>alert');
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes user-provided text in strength label", () => {
    const p = minimalPersona({
      strengths: [{ label: '<img onerror="alert(1)">', description: "Bad" }],
    });
    const html = renderInsight(p);
    // esc() converts < and > to &lt; and &gt; so the tag is defanged
    expect(html).not.toContain("<img onerror");
    expect(html).toContain("&lt;img");
  });

  it("escapes user-provided text in skill names", () => {
    const p = minimalPersona({
      skills: [
        { name: '<script>bad()</script>', category: "Technical", level: "Advanced", source: "professional" },
      ],
    });
    const html = renderInsight(p);
    expect(html).not.toContain("<script>bad()</script>");
  });

  it("escapes double quotes in user text", () => {
    const p = minimalPersona({
      identity: {
        name: 'Test "The Best" User',
        tagline: "Dev",
        elevator_pitch: "Hi",
      },
    });
    const html = renderInsight(p);
    expect(html).not.toContain('"The Best"');
    expect(html).toContain("&quot;The Best&quot;");
  });
});

// ── Personality trait rendering ─────────────────────────────────────────────

describe("renderInsight — personality traits", () => {
  it("renders position 0 as 0% width", () => {
    const p = minimalPersona({
      personality_traits: [{ dimension: "Extraversion", position: 0 }],
    });
    const html = renderInsight(p);
    expect(html).toContain("width:0%");
  });

  it("renders position 10 as 100% width", () => {
    const p = minimalPersona({
      personality_traits: [{ dimension: "Conscientiousness", position: 10 }],
    });
    const html = renderInsight(p);
    expect(html).toContain("width:100%");
  });

  it("clamps position below 0 to 0 in the bar", () => {
    const p = minimalPersona({
      personality_traits: [{ dimension: "Openness", position: -5 }],
    });
    const html = renderInsight(p);
    // The renderer uses Math.max(0, ...) → 0%
    expect(html).toContain("width:0%");
  });

  it("clamps position above 10 to 10 in the bar", () => {
    const p = minimalPersona({
      personality_traits: [{ dimension: "Openness", position: 15 }],
    });
    const html = renderInsight(p);
    // The renderer uses Math.min(10, ...) → 100%
    expect(html).toContain("width:100%");
  });

  it("renders trait note when present", () => {
    const p = minimalPersona({
      personality_traits: [
        { dimension: "Openness", position: 8, note: "Very curious" },
      ],
    });
    const html = renderInsight(p);
    expect(html).toContain("Very curious");
  });

  it("renders score label (X/10)", () => {
    const p = minimalPersona({
      personality_traits: [{ dimension: "Openness", position: 7 }],
    });
    const html = renderInsight(p);
    expect(html).toContain("7/10");
  });
});

// ── Date rendering ──────────────────────────────────────────────────────────

describe("renderInsight — dates", () => {
  it("renders en-GB formatted date", () => {
    const html = renderInsight(minimalPersona());
    expect(html).toContain("15 January 2026");
  });

  it("renders year range in timeline", () => {
    const html = renderInsight(richPersona());
    expect(html).toContain("2020"); // year_start
    expect(html).toContain("Present"); // year_end
  });
});

// ── Source info ─────────────────────────────────────────────────────────────

describe("renderInsight — source info", () => {
  it("renders sources used in meta line", () => {
    const html = renderInsight(richPersona());
    expect(html).toContain("LinkedIn, GitHub, Interview");
  });
});
