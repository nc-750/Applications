// Interview-instrument types — the shared contract between the per-turn
// analysis call (Call B), the interview store, and the readout components.
//
// These describe interview SESSION state only. None of this is written into
// persona.json (see types/persona.ts for the canonical persona schema).

/** The five coverage facets, derived from persona-schema sections. */
export type FacetKey = "story" | "strengths" | "hidden" | "growth" | "drivers";

export interface FacetMeta {
  key: FacetKey;
  /** Short display name shown on the meter. */
  label: string;
  /** What the meter measures, in coach language (tooltip / help). */
  blurb: string;
}

/** Facet metadata + display order. Maps each facet to the persona sections it tracks. */
export const FACETS: readonly FacetMeta[] = [
  { key: "story", label: "Story", blurb: "Career history and the real stories behind the roles." },
  { key: "strengths", label: "Strengths", blurb: "Demonstrated strengths and skills, with evidence." },
  { key: "hidden", label: "Hidden", blurb: "Undervalued or unnamed strengths the person overlooks." },
  { key: "growth", label: "Growth", blurb: "Honest growth areas and how they are handled." },
  { key: "drivers", label: "Drivers", blurb: "Values, goals, and the personality that drives them." },
] as const;

/** The model's honest read on the answer just given. */
export type ProbeSignal = "thin" | "strong";

/** Whether the instrument should dig the same facet or move on. */
export type NextAction = "follow_up" | "advance";

/** Cumulative saturation per facet, 0..1. Monotonic non-decreasing across turns. */
export type CoverageMap = Record<FacetKey, number>;

/** Structured output of the per-turn analysis call (Call B). */
export interface TurnAnalysis {
  /** Current saturation estimate (0..1) for every facet, from the whole transcript. */
  coverage: CoverageMap;
  /** Depth read of the answer just given. */
  probe_signal: ProbeSignal;
  /** Dig the same facet, or advance to the next. */
  next_action: NextAction;
  /** The facet to probe next — drives the nc-facet tag the UI shows. */
  next_facet: FacetKey;
}

/** Merge a new coverage reading into the prior one, monotonically (never decreases). */
export function mergeCoverage(prior: CoverageMap, next: CoverageMap): CoverageMap {
  return {
    story: Math.max(prior.story, next.story),
    strengths: Math.max(prior.strengths, next.strengths),
    hidden: Math.max(prior.hidden, next.hidden),
    growth: Math.max(prior.growth, next.growth),
    drivers: Math.max(prior.drivers, next.drivers),
  };
}

/** A zeroed coverage map (all facets at 0). */
export function emptyCoverage(): CoverageMap {
  return { story: 0, strengths: 0, hidden: 0, growth: 0, drivers: 0 };
}
