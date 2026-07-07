// The Interview feature's canonical domain model: a single reflection session —
// its transcript, coverage reading, and lifecycle. Plain data + enums only; no
// persistence key and no wire (LLM) shape live here (CONVENTIONS 1.1).
//
// The transcript line type (`TranscriptMessage`) is shared with the persona
// feature, so it lives in the foundational `core` layer; re-exported below so
// existing `interview/models` consumers keep their import path.

import type { TranscriptMessage } from "../../core/Transcript";

export type InterviewStatus =
  | "idle"
  | "active"
  | "synthesizing"
  | "completed"
  | "error";

/** The five coverage facets the interview excavates. */
export type FacetKey = "story" | "strengths" | "growth" | "drivers";

/** Canonical, ordered list of every facet — lets factories build a full reading. */
export const FACET_KEYS: readonly FacetKey[] = [
  "story",
  "strengths",
  "growth",
  "drivers",
] as const;

/** How well-evidenced the user's last answer was. */
export type ProbeSignal = "thin" | "strong";

/** Per-facet saturation, each 0..1 = how completely that facet is evidenced. */
export type CoverageMap = Record<FacetKey, number>;

// Optional fields are modelled as required keys whose value may be `undefined`
// (`x: T | undefined`), not absent keys (`x?: T`). An `Interview` is always
// "total" — every key present — which lets the store derive a ref per field via
// `toRefs` and reset cleanly via `Object.assign` (an absent key would mint no ref
// and would not overwrite a stale value). `createEmptyInterview()` sets them all.
export interface Interview {
  status: InterviewStatus;
  messages: TranscriptMessage[];
  coverage: CoverageMap;
  currentFacet: FacetKey | undefined;
  probeSignal: ProbeSignal | undefined;
  /** The pasted text / CV / file content that seeded the session. */
  initialData: string;
  inputText: string | undefined;
  uploadedFileNames: string[] | undefined;
  wasDigested: boolean | undefined;
  /** ISO-8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

/** A zeroed coverage reading — every facet at 0. */
export function emptyCoverage(): CoverageMap {
  return {
    story: 0,
    strengths: 0,
    growth: 0,
    drivers: 0,
  };
}

/** A fresh, idle interview with nothing recorded yet.
 *
 *  Every field — including the optional ones — is present (optionals set to
 *  `undefined`), so the object is "total". Two callers rely on this: the store
 *  seeds its `reactive` state from here and derives one ref per key via `toRefs`
 *  (a key absent at that moment would yield no ref), and `clearInterview` resets
 *  by `Object.assign`-ing this over the live state (which only overwrites keys it
 *  actually carries — an omitted optional would leave a stale value behind). */
export function createEmptyInterview(): Interview {
  const now = new Date().toISOString();
  return {
    status: "idle",
    messages: [],
    coverage: emptyCoverage(),
    currentFacet: undefined,
    probeSignal: undefined,
    initialData: "",
    inputText: undefined,
    uploadedFileNames: undefined,
    wasDigested: undefined,
    createdAt: now,
    updatedAt: now,
  };
}
