import { describe, it, expect } from "vitest";
import { esc, groupSkills } from "../../profile/services/html";

// ── esc ─────────────────────────────────────────────────────────────────────

describe("esc", () => {
  it("escapes & to &amp;", () => {
    expect(esc("A & B")).toBe("A &amp; B");
  });

  it("escapes < to &lt;", () => {
    expect(esc("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes > to &gt;", () => {
    expect(esc("a > b")).toBe("a &gt; b");
  });

  it('escapes " to &quot;', () => {
    expect(esc('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("returns empty string for null", () => {
    expect(esc(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(esc(undefined)).toBe("");
  });

  it("converts numbers to strings", () => {
    expect(esc(42)).toBe("42");
  });

  it("escapes combined XSS vector", () => {
    const input = '<script>alert("XSS")</script>';
    const output = esc(input);
    expect(output).not.toContain("<script>");
    expect(output).not.toContain('"');
    expect(output).toContain("&lt;");
    expect(output).toContain("&gt;");
    expect(output).toContain("&quot;");
  });

  it("handles empty string", () => {
    expect(esc("")).toBe("");
  });

  it("handles string with only safe characters unchanged", () => {
    expect(esc("Hello World 123")).toBe("Hello World 123");
  });
});

// ── groupSkills ─────────────────────────────────────────────────────────────

describe("groupSkills", () => {
  it("returns an empty map for an empty array", () => {
    const map = groupSkills([]);
    expect(map.size).toBe(0);
  });

  it("groups skills by category in display order", () => {
    const skills = [
      { name: "React", category: "Technical" as const, level: "Advanced" as const, source: "professional" as const },
      { name: "Kubernetes", category: "Tool" as const, level: "Intermediate" as const, source: "professional" as const },
      { name: "Mentoring", category: "Soft" as const, level: "Advanced" as const, source: "professional" as const },
    ];
    const map = groupSkills(skills);
    const keys = [...map.keys()];
    // Display order: Technical, Tool, Domain, Soft, Transversal, Language
    expect(keys).toEqual(["Technical", "Tool", "Soft"]);
  });

  it("omits empty categories", () => {
    const skills = [
      { name: "Python", category: "Domain" as const, level: "Advanced" as const, source: "professional" as const },
    ];
    const map = groupSkills(skills);
    expect(map.size).toBe(1);
    expect(map.has("Domain")).toBe(true);
    expect(map.has("Technical")).toBe(false);
  });

  it("appends unknown categories after known ones", () => {
    const skills = [
      { name: "React", category: "Technical" as const, level: "Advanced" as const, source: "professional" as const },
      { name: "CustomSkill", category: "CustomCategory" as any, level: "Advanced" as const, source: "professional" as const },
    ];
    const map = groupSkills(skills);
    const keys = [...map.keys()];
    expect(keys[0]).toBe("Technical");
    expect(keys[keys.length - 1]).toBe("CustomCategory");
  });

  it("defaults missing category to 'Technical'", () => {
    const skills = [
      { name: "React", level: "Advanced" as const, source: "professional" as const },
    ];
    const map = groupSkills(skills as any);
    expect(map.has("Technical")).toBe(true);
    expect(map.get("Technical")!.length).toBe(1);
  });

  it("groups multiple skills in same category", () => {
    const skills = [
      { name: "React", category: "Technical" as const, level: "Advanced" as const, source: "professional" as const },
      { name: "TypeScript", category: "Technical" as const, level: "Expert" as const, source: "professional" as const },
    ];
    const map = groupSkills(skills);
    expect(map.get("Technical")!.length).toBe(2);
  });

  it("preserves skill order within a category", () => {
    const skills = [
      { name: "Skill A", category: "Technical" as const, level: "Advanced" as const, source: "professional" as const },
      { name: "Skill B", category: "Technical" as const, level: "Advanced" as const, source: "professional" as const },
      { name: "Skill C", category: "Technical" as const, level: "Advanced" as const, source: "professional" as const },
    ];
    const map = groupSkills(skills);
    const names = map.get("Technical")!.map((s) => s.name);
    expect(names).toEqual(["Skill A", "Skill B", "Skill C"]);
  });
});
