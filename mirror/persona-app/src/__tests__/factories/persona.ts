import type { PersonaJSON, StoredPersona } from "../../types/persona";

// ── Scenario factories ────────────────────────────────────────────────────────

/**
 * Minimal valid PersonaJSON — every required field present, all arrays empty,
 * no optional fields populated. Used to validate schema acceptance of the
 * smallest valid shape and to exercise renderers' "empty section omitted" paths.
 */
export function minimalPersona(overrides?: Partial<PersonaJSON["persona"]>): PersonaJSON {
  return {
    persona: {
      identity: {
        name: "Jane Doe",
        tagline: "Software Engineer",
        elevator_pitch: "I build things.",
      },
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
      metadata: {
        sources_used: ["interview"],
        language: "en",
        generated_at: "2026-01-15T10:00:00.000Z",
        version: "1.0",
      },
      ...overrides,
    },
  };
}

/**
 * Rich PersonaJSON — every optional field populated with multiple realistic
 * entries. Used to verify that renderers produce all sections and that the
 * full synthesis pipeline output validates correctly.
 */
export function richPersona(): PersonaJSON {
  return {
    persona: {
      identity: {
        name: "Alex Chen",
        tagline: "Full-Stack Developer & Open Source Contributor",
        elevator_pitch:
          "A polyglot developer who bridges frontend and backend, with a passion for developer tooling and open-source collaboration. I bring curiosity and craftsmanship to every project, from prototyping to production.",
      },
      strengths: [
        {
          label: "Full-stack fluency",
          description: "Moves seamlessly between frontend and backend.",
          evidence:
            "When discussing the dashboard project, Alex described owning the full stack from React to PostgreSQL.",
        },
        {
          label: "Mentorship",
          description: "Naturally teaches and unblocks teammates.",
          evidence:
            "When discussing team dynamics, Alex mentioned running weekly code review sessions.",
        },
        {
          label: "Systems thinking",
          description: "Sees the big picture and connects dots across domains.",
        },
      ],
      weaknesses: [
        {
          label: "Over-engineering",
          description: "Tends to build abstractions too early.",
          growth_note: "Practice shipping MVPs and iterating based on feedback.",
        },
        {
          label: "Delegation",
          description: "Struggles to let go of implementation details.",
          growth_note: "Start with small, well-scoped tasks for teammates.",
        },
      ],
      skills: [
        { name: "TypeScript", category: "Technical", level: "Expert", source: "professional" },
        { name: "React", category: "Technical", level: "Advanced", source: "professional" },
        { name: "Rust", category: "Technical", level: "Intermediate", source: "personal" },
        { name: "Technical Writing", category: "Soft", level: "Advanced", source: "professional" },
        { name: "Kubernetes", category: "Tool", level: "Intermediate", source: "professional" },
        { name: "Mandarin", category: "Language", level: "Native", source: "personal" },
        { name: "Product Strategy", category: "Domain", level: "Intermediate", source: "inferred" },
        { name: "Cross-team Collaboration", category: "Transversal", source: "professional" },
      ],
      career_timeline: [
        {
          year_start: 2020,
          year_end: 2023,
          role: "Senior Frontend Engineer",
          organization: "TechCo",
          highlight: "Led migration from AngularJS to React, reducing bundle size by 60%.",
          real_story:
            "The migration was much harder than it looked on paper. We had 200+ components. I spent the first month just auditing the codebase.",
        },
        {
          year_start: 2023,
          year_end: "present" as const,
          role: "Staff Engineer",
          organization: "StartupX",
          highlight: "Built the core platform from zero to 50k users.",
        },
      ],
      non_professional: [
        {
          activity: "Open source contributor — maintainer of a popular VS Code extension",
          skills_revealed: ["TypeScript", "API Design", "Community Management"],
          note: "Started as a hobby project, now has 10k+ installs.",
        },
        {
          activity: "Amateur competitive cooking",
          skills_revealed: ["Planning", "Adaptability", "Multi-tasking"],
          note: "Won a local competition in 2024.",
        },
      ],
      personality_traits: [
        {
          dimension: "Openness",
          position: 8,
          note: "Constantly exploring new technologies and approaches.",
        },
        {
          dimension: "Conscientiousness",
          position: 7,
          note: "Organized but not rigid.",
        },
        {
          dimension: "Extraversion",
          position: 4,
          note: "Prefers small-group collaboration to large crowds.",
        },
      ],
      values: ["Craftsmanship", "Collaboration", "Continuous Learning", "Honesty"],
      hidden_assets: [
        "Speaks Mandarin natively — valuable for international teams",
        "Has built and grown an open-source community from scratch",
      ],
      goals: {
        short_term: "Ship a production-grade Rust service this year.",
        long_term: "Become a CTO or technical founder.",
      },
      use_cases: {
        cv_summary: "Experienced full-stack engineer with 8+ years building web applications and developer tools. Led a migration from AngularJS to React serving 200+ components, then built a platform from zero to 50k users as a Staff Engineer.",
        interview_pitch:
          "I'm Alex, and I build products end-to-end — from React component libraries to Rust backend services. At TechCo I led the migration from AngularJS to React, and at StartupX I built the core platform from scratch to 50k users. I also maintain an open-source VS Code extension with 10k+ installs.",
        linkedin_about:
          "Full-stack developer passionate about developer tooling, open-source, and shipping great products. 8+ years of experience across frontend, backend, and platform engineering.",
      },
      metadata: {
        sources_used: ["LinkedIn", "GitHub", "Interview"],
        language: "en",
        generated_at: "2026-01-15T10:00:00.000Z",
        version: "1.0",
      },
    },
    source: {
      input_text: "Extensive background data...",
      uploaded_files: ["resume.pdf"],
      interview: [
        {
          role: "user",
          content: "I started coding in high school.",
          timestamp: "2026-01-15T10:00:00.000Z",
        },
        {
          role: "assistant",
          content: "Tell me more about your early projects.",
          timestamp: "2026-01-15T10:00:05.000Z",
        },
      ],
    },
  };
}

/**
 * Sparse PersonaJSON — has required fields plus only a few optional fields.
 * Simulates an LLM that produced incomplete output (missing weaknesses,
 * most optional fields, etc.). Used to verify graceful degradation in renderers.
 */
export function sparsePersona(): PersonaJSON {
  return minimalPersona({
    strengths: [{ label: "Debugging", description: "Good at finding bugs." }],
    skills: [
      { name: "Python", category: "Technical", level: "Intermediate", source: "professional" },
    ],
    values: ["Quality"],
    goals: { short_term: "Learn Rust." },
    // missing: weaknesses, career_timeline, non_professional, personality_traits,
    // hidden_assets, use_cases, long_term goals
  });
}

/**
 * PersonaJSON with all arrays present but empty. Useful as a baseline for
 * renderers testing empty-collection handling.
 */
export function emptyArraysPersona(): PersonaJSON {
  return minimalPersona();
}

/** Wraps a PersonaJSON in the StoredPersona envelope used by IndexedDB. */
export function storedPersona(
  persona: PersonaJSON,
  howIWorkBest: string[] = []
): StoredPersona {
  return {
    id: "default",
    data: persona,
    derived: { how_i_work_best: howIWorkBest },
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
  };
}
