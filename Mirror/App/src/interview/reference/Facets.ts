// Descriptive reference data for the interview's coverage facets — labels, help
// text, and per-facet probing guidance. Reference data, not a domain model
// (CONVENTIONS 1.2 / 6.10); the FacetKey enum itself lives in the model.

import type { FacetKey } from "../models";

export interface FacetMeta {
  key: FacetKey;
  /** Short display name shown on the meter. */
  label: string;
  /** What the meter measures, in coach language (tooltip / help). */
  blurb: string;
}

export const FACETS: readonly FacetMeta[] = [
  {
    key: "story",
    label: "Story",
    blurb: "Career history and the real stories behind the roles.",
  },
  {
    key: "strengths",
    label: "Strengths",
    blurb: "Demonstrated strengths and skills, with evidence.",
  },
  {
    key: "growth",
    label: "Growth",
    blurb: "Honest growth areas and how they are handled.",
  },
  {
    key: "drivers",
    label: "Drivers",
    blurb: "Values, goals, and the personality that drives them.",
  },
] as const;

export const FACET_PROBE_GUIDE: Record<FacetKey, string> = {
  story:
    "Excavate lived experience: pick a specific role, project, or non-professional activity and ask what it was actually like — what they built, what went wrong, what isn't on the CV.",
  strengths:
    "Surface a demonstrated strength with evidence: ask for a concrete example where a particular ability clearly showed, or what others rely on them for.",
  growth:
    "Explore growth honestly: ask where they last felt out of their depth, what they find hard, and whether they stayed in it or routed around it.",
  drivers:
    "Go transversal (not answerable from a CV): values, what motivates them, how they prefer to work, what they want next, or how they handle pressure or disagreement.",
};
