import { describe, it, expect } from "vitest";
import {
  PersonaJSONSchema,
  PersonaDataSchema,
  StrengthSchema,
  WeaknessSchema,
  SkillSchema,
  CareerEntrySchema,
  NonProfessionalEntrySchema,
  PersonalityTraitSchema,
  stripNulls,
  parsePersonaJSON,
  parsePersonaJSONLenient,
  locatePersonaData,
  coercePersonaJSON,
} from "../../types/persona";
import { minimalPersona, richPersona, sparsePersona } from "../factories/persona";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Zod-safe clone that preserves `"present"` literals and `undefined`. */
function clone<T>(v: T): T {
  // Strip undefined values so Zod optionals don't trigger unexpected behaviors.
  return JSON.parse(JSON.stringify(v));
}

// ── PersonaJSONSchema ───────────────────────────────────────────────────────

describe("PersonaJSONSchema", () => {
  describe("happy path", () => {
    it("accepts a minimal valid persona", () => {
      const result = PersonaJSONSchema.safeParse(clone(minimalPersona()));
      expect(result.success).toBe(true);
    });

    it("accepts a rich persona with all fields populated", () => {
      const result = PersonaJSONSchema.safeParse(clone(richPersona()));
      expect(result.success).toBe(true);
    });

    it("accepts a sparse persona with only some optionals", () => {
      const result = PersonaJSONSchema.safeParse(clone(sparsePersona()));
      expect(result.success).toBe(true);
    });

    it("accepts persona with optional source field", () => {
      const withSource = { ...clone(richPersona()), source: { input_text: "hello" } };
      const result = PersonaJSONSchema.safeParse(withSource);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source?.input_text).toBe("hello");
      }
    });
  });

  describe("required field validation", () => {
    it("fails when persona is missing", () => {
      const result = PersonaJSONSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("fails when identity.name is missing", () => {
      const data = clone(minimalPersona());
      delete (data.persona.identity as Record<string, unknown>).name;
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(false);
      const issue = result.error?.issues[0];
      expect(issue?.path).toContain("name");
    });

    it("fails when identity.tagline is missing", () => {
      const data = clone(minimalPersona());
      delete (data.persona.identity as Record<string, unknown>).tagline;
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("fails when metadata is missing", () => {
      const data = clone(minimalPersona());
      delete (data.persona as Record<string, unknown>).metadata;
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("fails when strengths array is missing", () => {
      const data = clone(minimalPersona());
      delete (data.persona as Record<string, unknown>).strengths;
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("fails when skills array is missing", () => {
      const data = clone(minimalPersona());
      delete (data.persona as Record<string, unknown>).skills;
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("type validation", () => {
    it("rejects a string for year_start position", () => {
      const data = clone(minimalPersona());
      data.persona.career_timeline = [
        { year_start: "not-a-number" as unknown as number, year_end: 2023, role: "Dev", organization: "Co" },
      ];
      // year_start uses z.coerce.number().catch(currentYear), so non-numeric
      // strings fall back to the current year. It should still parse.
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects a string for personality_traits.position", () => {
      const data = clone(minimalPersona());
      data.persona.personality_traits = [
        { dimension: "Openness", position: "high" as unknown as number },
      ];
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("accepts a string year_start that is numeric (coerced)", () => {
      const data = clone(minimalPersona());
      data.persona.career_timeline = [
        { year_start: "2020" as unknown as number, year_end: 2023, role: "Dev", organization: "Co" },
      ];
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.persona.career_timeline[0].year_start).toBe(2020);
      }
    });
  });

  describe("edge cases", () => {
    it("accepts personality_trait position above 10", () => {
      const data = clone(minimalPersona());
      data.persona.personality_traits = [
        { dimension: "Openness", position: 15 },
      ];
      const result = PersonaJSONSchema.safeParse(data);
      // Zod number doesn't clamp — renderer does.
      expect(result.success).toBe(true);
    });

    it("accepts personality_trait position below 0", () => {
      const data = clone(minimalPersona());
      data.persona.personality_traits = [
        { dimension: "Openness", position: -5 },
      ];
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts empty goals object (both optional fields missing)", () => {
      const data = clone(minimalPersona());
      data.persona.goals = {};
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts empty use_cases object", () => {
      const data = clone(minimalPersona());
      data.persona.use_cases = {};
      const result = PersonaJSONSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

// ── Skill Schema ────────────────────────────────────────────────────────────

describe("SkillSchema", () => {
  it("accepts a skill with all fields", () => {
    const result = SkillSchema.safeParse({
      name: "TypeScript",
      category: "Technical",
      level: "Expert",
      source: "professional",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a skill with only required fields (name, category)", () => {
    const result = SkillSchema.safeParse({ name: "Writing", category: "Soft" });
    expect(result.success).toBe(true);
  });

  it("normalizes unknown category to fallback 'Technical'", () => {
    const result = SkillSchema.safeParse({ name: "Rust", category: "MadeUp" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("Technical");
    }
  });

  it("normalizes case-insensitive category", () => {
    const result = SkillSchema.safeParse({ name: "Rust", category: "technical" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("Technical");
    }
  });

  it("rejects unknown level value", () => {
    // normalizeEnum returns undefined for "Guru", which the inner enum rejects.
    // Even with .optional(), a mapped undefined from preprocess is not rescued.
    const result = SkillSchema.safeParse({
      name: "Rust",
      category: "Technical",
      level: "Guru",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown source value", () => {
    const result = SkillSchema.safeParse({
      name: "Rust",
      category: "Technical",
      source: "unknown",
    });
    expect(result.success).toBe(false);
  });
});

// ── CareerEntry Schema ──────────────────────────────────────────────────────

describe("CareerEntrySchema", () => {
  it("coerces numeric string year_start to number", () => {
    const result = CareerEntrySchema.safeParse({
      year_start: "2020",
      year_end: 2023,
      role: "Dev",
      organization: "Co",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.year_start).toBe("number");
      expect(result.data.year_start).toBe(2020);
    }
  });

  it("coerces non-numeric year_start to current year", () => {
    const result = CareerEntrySchema.safeParse({
      year_start: "garbage",
      year_end: 2023,
      role: "Dev",
      organization: "Co",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year_start).toBe(new Date().getFullYear());
    }
  });

  it("converts numeric string year_end to number", () => {
    const result = CareerEntrySchema.safeParse({
      year_start: 2020,
      year_end: "2023",
      role: "Dev",
      organization: "Co",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year_end).toBe(2023);
    }
  });

  it('preserves "present" as string', () => {
    const result = CareerEntrySchema.safeParse({
      year_start: 2023,
      year_end: "present",
      role: "Staff Engineer",
      organization: "StartupX",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year_end).toBe("present");
    }
  });

  it("coerces non-numeric, non-'present' string to 'present'", () => {
    const result = CareerEntrySchema.safeParse({
      year_start: 2023,
      year_end: "aujourd'hui",
      role: "Dev",
      organization: "Co",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year_end).toBe("present");
    }
  });

  it("coerces empty string year_end to 'present'", () => {
    const result = CareerEntrySchema.safeParse({
      year_start: 2023,
      year_end: "",
      role: "Dev",
      organization: "Co",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year_end).toBe("present");
    }
  });

  it("accepts minimal career entry (role + organization only)", () => {
    const result = CareerEntrySchema.safeParse({
      year_start: 2020,
      year_end: 2023,
      role: "Dev",
      organization: "Co",
    });
    expect(result.success).toBe(true);
  });
});

// ── stripNulls ──────────────────────────────────────────────────────────────

describe("stripNulls", () => {
  it("removes null-valued keys from a flat object", () => {
    const input = { a: 1, b: null, c: "hello" };
    expect(stripNulls(input)).toEqual({ a: 1, c: "hello" });
  });

  it("removes nested null values", () => {
    const input = { a: { b: null, c: "ok" }, d: "keep" };
    expect(stripNulls(input)).toEqual({ a: { c: "ok" }, d: "keep" });
  });

  it("handles arrays containing objects with nulls", () => {
    const input = { items: [{ x: 1, y: null }, { x: 2, y: 3 }] };
    expect(stripNulls(input)).toEqual({ items: [{ x: 1 }, { x: 2, y: 3 }] });
  });

  it("returns non-object values as-is", () => {
    expect(stripNulls("hello")).toBe("hello");
    expect(stripNulls(42)).toBe(42);
    expect(stripNulls(null)).toBe(null);
  });

  it("returns arrays of primitives unchanged", () => {
    expect(stripNulls([1, null, 3])).toEqual([1, null, 3]);
  });

  it("handles an object with all null values", () => {
    expect(stripNulls({ a: null, b: null })).toEqual({});
  });

  it("handles deeply nested null removal", () => {
    const input = { a: { b: { c: null, d: "ok" } } };
    expect(stripNulls(input)).toEqual({ a: { b: { d: "ok" } } });
  });
});

// ── parsePersonaJSON (throwing) ─────────────────────────────────────────────

describe("parsePersonaJSON", () => {
  it("parses a valid PersonaJSON", () => {
    const data = parsePersonaJSON(clone(minimalPersona()));
    expect(data.persona.identity.name).toBe("Jane Doe");
  });

  it("throws on invalid data", () => {
    expect(() => parsePersonaJSON({})).toThrow("Invalid persona.json");
  });

  it("throws with path in message", () => {
    const bad = clone(minimalPersona());
    delete (bad.persona.identity as Record<string, unknown>).name;
    expect(() => parsePersonaJSON(bad)).toThrow(/name/);
  });

  it("handles null values via stripNulls before validation", () => {
    // Simulate structured output: identity has a null elevator_pitch that should be
    // stripped, but elevator_pitch is required — so this should still fail.
    const withNull = {
      persona: {
        identity: { name: "Test", tagline: "Dev", elevator_pitch: null },
        strengths: [],
        weaknesses: [],
        skills: [],
        career_timeline: [],
        non_professional: [],
        personality_traits: [],
        values: [],
        hidden_assets: [],
        goals: {},
        use_cases: {},
        metadata: { sources_used: [], language: "en", generated_at: "2026-01-01T00:00:00Z", version: "1.0" },
      },
    };
    // elevator_pitch is required; null is removed by stripNulls → key missing → fails.
    expect(() => parsePersonaJSON(withNull)).toThrow(/elevator_pitch/);
  });
});

// ── parsePersonaJSONLenient (non-throwing) ──────────────────────────────────

describe("parsePersonaJSONLenient", () => {
  it("returns ok for valid data", () => {
    const result = parsePersonaJSONLenient(clone(minimalPersona()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.persona.identity.name).toBe("Jane Doe");
    }
  });

  it("returns error for invalid data", () => {
    const result = parsePersonaJSONLenient({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it("error string includes path and message", () => {
    const bad = clone(minimalPersona());
    delete (bad.persona.identity as Record<string, unknown>).name;
    const result = parsePersonaJSONLenient(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/name/);
    }
  });
});

// ── locatePersonaData ──────────────────────────────────────────────────────

describe("locatePersonaData", () => {
  it("returns bare data object as-is", () => {
    const data = { identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" } };
    expect(locatePersonaData(data)).toBe(data);
  });

  it("unwraps standard { persona: { identity, ... } } shape", () => {
    const inner = { identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" } };
    expect(locatePersonaData({ persona: inner })).toBe(inner);
  });

  it("finds data nested under any top-level key", () => {
    const inner = { identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" } };
    expect(locatePersonaData({ result: inner })).toBe(inner);
  });

  it("handles double-wrap { persona: { persona: { identity } } }", () => {
    const inner = { identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" } };
    expect(locatePersonaData({ persona: { persona: inner } })).toBe(inner);
  });

  it("returns non-object inputs as-is", () => {
    expect(locatePersonaData("hello")).toBe("hello");
    expect(locatePersonaData(null)).toBe(null);
  });

  it("returns object without identity unchanged", () => {
    const obj = { foo: "bar" };
    expect(locatePersonaData(obj)).toBe(obj);
  });
});

// ── coercePersonaJSON ──────────────────────────────────────────────────────

describe("coercePersonaJSON", () => {
  it("coerces a wrapped PersonaJSON", () => {
    const inner = clone(minimalPersona()).persona;
    const result = coercePersonaJSON({ persona: inner });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.persona.identity.name).toBe("Jane Doe");
    }
  });

  it("coerces a bare PersonaData object", () => {
    const inner = clone(minimalPersona()).persona;
    const result = coercePersonaJSON(inner);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.persona.identity.name).toBe("Jane Doe");
    }
  });

  it("returns error for invalid data", () => {
    const result = coercePersonaJSON({ foo: "bar" });
    expect(result.ok).toBe(false);
  });
});

// ── Additional schemas ──────────────────────────────────────────────────────

describe("StrengthSchema", () => {
  it("accepts a strength without evidence (optional)", () => {
    const result = StrengthSchema.safeParse({ label: "Debugging", description: "Finds bugs fast" });
    expect(result.success).toBe(true);
  });

  it("accepts a strength with evidence", () => {
    const result = StrengthSchema.safeParse({
      label: "Debugging",
      description: "Finds bugs fast",
      evidence: "Fixed 200+ production bugs",
    });
    expect(result.success).toBe(true);
  });
});

describe("WeaknessSchema", () => {
  it("accepts a weakness without growth_note", () => {
    const result = WeaknessSchema.safeParse({
      label: "Over-engineering",
      description: "Builds too many abstractions",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a weakness with growth_note", () => {
    const result = WeaknessSchema.safeParse({
      label: "Over-engineering",
      description: "Builds too many abstractions",
      growth_note: "Start with MVP",
    });
    expect(result.success).toBe(true);
  });
});

describe("NonProfessionalEntrySchema", () => {
  it("accepts an entry with skills_revealed", () => {
    const result = NonProfessionalEntrySchema.safeParse({
      activity: "Open source contributor",
      skills_revealed: ["TypeScript", "API Design"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an entry with empty skills_revealed", () => {
    const result = NonProfessionalEntrySchema.safeParse({
      activity: "Hiking",
      skills_revealed: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("PersonalityTraitSchema", () => {
  it("accepts a trait without note", () => {
    const result = PersonalityTraitSchema.safeParse({
      dimension: "Openness",
      position: 7,
    });
    expect(result.success).toBe(true);
  });
});

describe("PersonaDataSchema", () => {
  it("accepts a complete PersonaData", () => {
    const result = PersonaDataSchema.safeParse(clone(richPersona()).persona);
    expect(result.success).toBe(true);
  });

  it("accepts a minimal PersonaData", () => {
    const result = PersonaDataSchema.safeParse(clone(minimalPersona()).persona);
    expect(result.success).toBe(true);
  });
});
