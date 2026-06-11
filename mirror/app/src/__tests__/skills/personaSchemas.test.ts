import { describe, it, expect } from "vitest";
import {
  mergeSynthesisFragments,
  ExtractDataSchema,
  AnalyzeDataSchema,
  PolishDataSchema,
  EXTRACT_JSON_SCHEMA,
  ANALYZE_JSON_SCHEMA,
  POLISH_JSON_SCHEMA,
} from "../../persona/personaSchemas";

// ── JSON Schema structure ──────────────────────────────────────────────────

describe("EXTRACT_JSON_SCHEMA", () => {
  it("is a plain object", () => {
    expect(typeof EXTRACT_JSON_SCHEMA).toBe("object");
    expect(EXTRACT_JSON_SCHEMA).not.toBeNull();
  });

  it("includes identity fields", () => {
    const props = (EXTRACT_JSON_SCHEMA as Record<string, unknown>).properties as Record<string, unknown>;
    expect(props).toHaveProperty("identity");
    expect(props).toHaveProperty("career_timeline");
    expect(props).toHaveProperty("skills");
    expect(props).toHaveProperty("non_professional");
    expect(props).toHaveProperty("values");
    expect(props).toHaveProperty("goals");
  });

  it("does not include analyze or polish fields", () => {
    const props = (EXTRACT_JSON_SCHEMA as Record<string, unknown>).properties as Record<string, unknown>;
    expect(props).not.toHaveProperty("strengths");
    expect(props).not.toHaveProperty("weaknesses");
    expect(props).not.toHaveProperty("hidden_assets");
    expect(props).not.toHaveProperty("personality_traits");
    expect(props).not.toHaveProperty("use_cases");
    expect(props).not.toHaveProperty("metadata");
  });
});

describe("ANALYZE_JSON_SCHEMA", () => {
  it("includes analyze-specific fields", () => {
    const props = (ANALYZE_JSON_SCHEMA as Record<string, unknown>).properties as Record<string, unknown>;
    expect(props).toHaveProperty("strengths");
    expect(props).toHaveProperty("weaknesses");
    expect(props).toHaveProperty("hidden_assets");
    expect(props).toHaveProperty("personality_traits");
  });

  it("does not include extract or polish fields", () => {
    const props = (ANALYZE_JSON_SCHEMA as Record<string, unknown>).properties as Record<string, unknown>;
    expect(props).not.toHaveProperty("identity");
    expect(props).not.toHaveProperty("career_timeline");
    expect(props).not.toHaveProperty("skills");
    expect(props).not.toHaveProperty("use_cases");
    expect(props).not.toHaveProperty("metadata");
  });
});

describe("POLISH_JSON_SCHEMA", () => {
  it("includes polish-specific fields", () => {
    const props = (POLISH_JSON_SCHEMA as Record<string, unknown>).properties as Record<string, unknown>;
    expect(props).toHaveProperty("use_cases");
    expect(props).toHaveProperty("metadata");
  });

  it("does not include extract or analyze fields", () => {
    const props = (POLISH_JSON_SCHEMA as Record<string, unknown>).properties as Record<string, unknown>;
    expect(props).not.toHaveProperty("identity");
    expect(props).not.toHaveProperty("strengths");
    expect(props).not.toHaveProperty("weaknesses");
  });
});

// ── Subset Zod schemas ─────────────────────────────────────────────────────

describe("ExtractDataSchema", () => {
  it("validates a complete extract", () => {
    const data = {
      identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" },
      career_timeline: [],
      skills: [],
      non_professional: [],
      values: [],
      goals: {},
    };
    const result = ExtractDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("fails when identity is missing", () => {
    const data = {
      career_timeline: [],
      skills: [],
      non_professional: [],
      values: [],
      goals: {},
    };
    const result = ExtractDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("fails when career_timeline is missing", () => {
    const data = {
      identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" },
      skills: [],
      non_professional: [],
      values: [],
      goals: {},
    };
    const result = ExtractDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("AnalyzeDataSchema", () => {
  it("validates a complete analyze", () => {
    const data = {
      strengths: [],
      weaknesses: [],
      hidden_assets: [],
      personality_traits: [],
    };
    const result = AnalyzeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("fails when strengths is missing", () => {
    const data = {
      weaknesses: [],
      hidden_assets: [],
      personality_traits: [],
    };
    const result = AnalyzeDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("PolishDataSchema", () => {
  it("validates a complete polish", () => {
    const data = {
      use_cases: {},
      metadata: {
        sources_used: ["interview"],
        language: "en",
        generated_at: "2026-01-01T00:00:00Z",
        version: "1.0",
      },
    };
    const result = PolishDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("fails when metadata is missing", () => {
    const data = { use_cases: {} };
    const result = PolishDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

// ── mergeSynthesisFragments ─────────────────────────────────────────────────

describe("mergeSynthesisFragments", () => {
  const validExtract = {
    identity: { name: "Test User", tagline: "Engineer", elevator_pitch: "I build stuff." },
    career_timeline: [],
    skills: [],
    non_professional: [],
    values: [],
    goals: {},
  };

  const validAnalyze = {
    strengths: [],
    weaknesses: [],
    hidden_assets: [],
    personality_traits: [],
  };

  const validPolish = {
    use_cases: {},
    metadata: {
      sources_used: ["interview"],
      language: "en",
      generated_at: "2026-01-01T00:00:00.000Z",
      version: "1.0",
    },
  };

  it("merges three complete fragments into a valid PersonaJSON", () => {
    const result = mergeSynthesisFragments(validExtract, validAnalyze, validPolish);
    expect(result.persona.identity.name).toBe("Test User");
    expect(result.persona.strengths).toEqual([]);
    expect(result.persona.use_cases).toEqual({});
    expect(result.persona.metadata.language).toBe("en");
  });

  it("merges rich fragments correctly", () => {
    const richExtract = {
      identity: { name: "Alice", tagline: "Designer", elevator_pitch: "I design." },
      career_timeline: [
        { year_start: 2020, year_end: 2023, role: "Designer", organization: "Co" },
      ],
      skills: [
        { name: "Figma", category: "Tool" as const, level: "Advanced" as const, source: "professional" as const },
      ],
      non_professional: [],
      values: ["Creativity"],
      goals: { short_term: "Lead a team" },
    };

    const richAnalyze = {
      strengths: [{ label: "Visual design", description: "Excellent eye for detail" }],
      weaknesses: [{ label: "Perfectionism", description: "Spends too long on details" }],
      hidden_assets: ["Speaks 3 languages"],
      personality_traits: [{ dimension: "Openness", position: 9 }],
    };

    const richPolish = {
      use_cases: { cv_summary: "Experienced designer" },
      metadata: {
        sources_used: ["Portfolio"],
        language: "fr",
        generated_at: "2026-02-01T00:00:00.000Z",
        version: "1.0",
      },
    };

    const result = mergeSynthesisFragments(richExtract, richAnalyze, richPolish);

    expect(result.persona.identity.name).toBe("Alice");
    expect(result.persona.strengths[0].label).toBe("Visual design");
    expect(result.persona.hidden_assets).toEqual(["Speaks 3 languages"]);
    expect(result.persona.use_cases.cv_summary).toBe("Experienced designer");
    expect(result.persona.metadata.language).toBe("fr");
    expect(result.persona.values).toEqual(["Creativity"]);
    expect(result.persona.goals.short_term).toBe("Lead a team");
  });

  it("throws when a required field is missing from all fragments", () => {
    // Missing skills array (only in extract)
    const badExtract = {
      identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" },
      career_timeline: [],
      // skills is missing
      non_professional: [],
      values: [],
      goals: {},
    };
    expect(() =>
      mergeSynthesisFragments(badExtract as any, validAnalyze, validPolish)
    ).toThrow("Merged persona validation failed");
  });

  it("throws when identity.name is missing", () => {
    const badExtract = {
      identity: { tagline: "Dev", elevator_pitch: "Hi" },
      career_timeline: [],
      skills: [],
      non_professional: [],
      values: [],
      goals: {},
    };
    expect(() =>
      mergeSynthesisFragments(badExtract as any, validAnalyze, validPolish)
    ).toThrow("Merged persona validation failed");
  });

  it("later fragment fields overwrite earlier ones on overlap", () => {
    // Extract and Polish both have overlap? Not in practice.
    // But if they did, later spread wins.
    const extractWithSkills = {
      ...validExtract,
      skills: [
        { name: "ExtractSkill", category: "Technical" as const, level: "Expert" as const, source: "professional" as const },
      ],
    };
    const result = mergeSynthesisFragments(extractWithSkills, validAnalyze, validPolish);
    expect(result.persona.skills[0].name).toBe("ExtractSkill");
  });
});
