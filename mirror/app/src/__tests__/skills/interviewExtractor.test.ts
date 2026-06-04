import { describe, it, expect } from "vitest";
import { extractPersonaJSON, extractFencedJSON } from "../../skills/interviewExtractor";
import { minimalPersona } from "../factories/persona";

// ── extractPersonaJSON ──────────────────────────────────────────────────────

describe("extractPersonaJSON", () => {
  const validPersona = minimalPersona();

  it("extracts a valid persona from a json fenced code block", () => {
    const text = `Here's the result:\n\n\`\`\`json\n${JSON.stringify(validPersona)}\n\`\`\``;
    const result = extractPersonaJSON(text);
    expect(result).not.toBeNull();
    expect(result!.persona.identity.name).toBe("Jane Doe");
  });

  it("extracts from a fenced block without language tag", () => {
    const text = `\`\`\`\n${JSON.stringify(validPersona)}\n\`\`\``;
    const result = extractPersonaJSON(text);
    expect(result).not.toBeNull();
    expect(result!.persona.identity.name).toBe("Jane Doe");
  });

  it("returns the first valid JSON block when multiple exist", () => {
    const text = [
      "```json",
      JSON.stringify({ persona: { identity: { name: "First", tagline: "T", elevator_pitch: "E" }, strengths: [], weaknesses: [], skills: [], career_timeline: [], non_professional: [], personality_traits: [], values: [], hidden_assets: [], goals: {}, use_cases: {}, metadata: { sources_used: [], language: "en", generated_at: "2026-01-01T00:00:00Z", version: "1.0" } } }),
      "```",
      "```json",
      JSON.stringify(validPersona),
      "```",
    ].join("\n");
    const result = extractPersonaJSON(text);
    expect(result).not.toBeNull();
    expect(result!.persona.identity.name).toBe("First");
  });

  it("returns null when no valid persona JSON is found", () => {
    const text = "Just some regular text with no JSON blocks.";
    expect(extractPersonaJSON(text)).toBeNull();
  });

  it("continues scanning after invalid JSON in a fence", () => {
    const text = [
      "```json",
      "{invalid json here",
      "```",
      "```json",
      JSON.stringify(validPersona),
      "```",
    ].join("\n");
    const result = extractPersonaJSON(text);
    expect(result).not.toBeNull();
    expect(result!.persona.identity.name).toBe("Jane Doe");
  });

  it("skips blocks with valid JSON but invalid schema (missing required fields)", () => {
    const text = [
      "```json",
      JSON.stringify({ persona: { identity: { name: "Test" } } }), // missing fields
      "```",
      "```json",
      JSON.stringify(validPersona),
      "```",
    ].join("\n");
    const result = extractPersonaJSON(text);
    expect(result).not.toBeNull();
    expect(result!.persona.identity.name).toBe("Jane Doe");
  });

  it("does not match bare JSON outside fenced blocks", () => {
    // extractPersonaJSON only scans fenced blocks — bare JSON not picked up
    const text = JSON.stringify(validPersona); // no fences
    expect(extractPersonaJSON(text)).toBeNull();
  });

  it("handles unwrapped persona data inside wrapper shapes", () => {
    // The inner data object wrapped in { persona: {...} }
    const wrapped = { persona: validPersona.persona };
    const text = "```json\n" + JSON.stringify(wrapped) + "\n```";
    const result = extractPersonaJSON(text);
    expect(result).not.toBeNull();
    expect(result!.persona.identity.name).toBe("Jane Doe");
  });

  it("returns null for empty string", () => {
    expect(extractPersonaJSON("")).toBeNull();
  });
});

// ── extractFencedJSON ──────────────────────────────────────────────────────

describe("extractFencedJSON", () => {
  it("extracts JSON from a fenced code block", () => {
    const text = "```json\n" + JSON.stringify({ hello: "world" }) + "\n```";
    const result = extractFencedJSON(text);
    expect(result).toEqual({ hello: "world" });
  });

  it("falls back to bare JSON when no fences are present", () => {
    const text = JSON.stringify({ hello: "world" });
    const result = extractFencedJSON(text);
    expect(result).toEqual({ hello: "world" });
  });

  it("returns first fenced block when multiple", () => {
    const text = [
      "```json",
      JSON.stringify({ first: true }),
      "```",
      "```json",
      JSON.stringify({ second: true }),
      "```",
    ].join("\n");
    const result = extractFencedJSON(text);
    expect(result).toEqual({ first: true });
  });

  it("skips invalid JSON in fences and continues", () => {
    const text = [
      "```json",
      "not valid json {{{",
      "```",
      "```",
      JSON.stringify({ valid: true }),
      "```",
    ].join("\n");
    const result = extractFencedJSON(text);
    expect(result).toEqual({ valid: true });
  });

  it("returns null for no JSON anywhere", () => {
    expect(extractFencedJSON("just text")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractFencedJSON("")).toBeNull();
  });

  it("trims input before bare JSON fallback", () => {
    const text = "  \n  " + JSON.stringify({ trimmed: true }) + "  \n  ";
    const result = extractFencedJSON(text);
    expect(result).toEqual({ trimmed: true });
  });

  it("returns raw parsed value (no schema validation)", () => {
    const text = "```json\n" + JSON.stringify({ anything: "goes" }) + "\n```";
    const result = extractFencedJSON(text);
    expect(result).toEqual({ anything: "goes" });
  });
});
