import { describe, it, expect } from "vitest";
import {
  TurnAnalysisSchema,
  CONCLUDE_THRESHOLD,
  SATURATION_LOCKED,
} from "../../interview/prompts/analysisPrompt";
import { mergeCoverage, emptyCoverage, FACETS } from "../../types/interview";

describe("TurnAnalysisSchema", () => {
  it("parses a full, valid analysis result", () => {
    const res = TurnAnalysisSchema.safeParse({
      coverage: { story: 0.4, strengths: 0.2, hidden: 0, growth: 0, drivers: 0.1 },
      probe_signal: "strong",
      next_action: "advance",
      next_facet: "strengths",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.coverage.story).toBe(0.4);
      expect(res.data.next_facet).toBe("strengths");
    }
  });

  it("defaults missing facets to 0", () => {
    const res = TurnAnalysisSchema.safeParse({
      coverage: { story: 0.5 },
      probe_signal: "thin",
      next_action: "follow_up",
      next_facet: "story",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.coverage.drivers).toBe(0);
      expect(res.data.coverage.story).toBe(0.5);
    }
  });

  it("rejects unknown enums", () => {
    const res = TurnAnalysisSchema.safeParse({
      coverage: {},
      probe_signal: "lukewarm",
      next_action: "advance",
      next_facet: "story",
    });
    expect(res.success).toBe(false);
  });
});

describe("mergeCoverage (monotonic)", () => {
  it("never decreases a facet", () => {
    const prior = { story: 0.6, strengths: 0.3, hidden: 0.2, growth: 0.1, drivers: 0.5 };
    const next = { story: 0.4, strengths: 0.5, hidden: 0.2, growth: 0.0, drivers: 0.9 };
    const merged = mergeCoverage(prior, next);
    expect(merged.story).toBe(0.6); // kept higher prior
    expect(merged.strengths).toBe(0.5); // took higher next
    expect(merged.drivers).toBe(0.9);
    expect(merged.growth).toBe(0.1);
  });

  it("emptyCoverage is all zero", () => {
    const e = emptyCoverage();
    for (const f of FACETS) expect(e[f.key]).toBe(0);
  });
});

describe("thresholds", () => {
  it("conclude threshold is below saturation locked", () => {
    expect(CONCLUDE_THRESHOLD).toBeLessThanOrEqual(SATURATION_LOCKED);
    expect(CONCLUDE_THRESHOLD).toBeGreaterThan(0);
  });
});
