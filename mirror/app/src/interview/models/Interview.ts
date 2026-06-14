// The Interview feature's canonical domain model: a single reflection session —
// its transcript, coverage reading, and lifecycle. Plain data + enums only; no
// persistence key and no wire (LLM) shape live here (CONVENTIONS 1.1).

export type InterviewStatus =
    | "idle"
    | "active"
    | "synthesizing"
    | "completed"
    | "error";

/** The five coverage facets the interview excavates. */
export type FacetKey = "story" | "strengths" | "hidden" | "growth" | "drivers";

/** Canonical, ordered list of every facet — lets factories build a full reading. */
export const FACET_KEYS: readonly FacetKey[] = [
    "story",
    "strengths",
    "hidden",
    "growth",
    "drivers",
] as const;

/** How well-evidenced the user's last answer was. */
export type ProbeSignal = "thin" | "strong";

/** Per-facet saturation, each 0..1 = how completely that facet is evidenced. */
export type CoverageMap = Record<FacetKey, number>;

/** A single line of the interview transcript. A domain message — not the LLM
 *  library's `Message` wire type, which stays in the llm/service layers.
 *
 *  Total, like `Interview`: every key is always present. `context` may be
 *  `undefined`; `isError` is a plain boolean (a message either errored or did
 *  not — never "absent"), defaulting to `false`. Build via
 *  `createTranscriptMessage` so the default is applied in one place. */
export interface TranscriptMessage {
    role: "user" | "assistant";
    content: string;
    /** Assistant probes carry a brief acknowledgement of the prior answer. */
    context: string | undefined;
    /** ISO-8601 timestamp. */
    timestamp: string;
    isError: boolean;
}

/** Build a total transcript line, defaulting `context` to `undefined`,
 *  `isError` to `false`, and `timestamp` to now. */
export function createTranscriptMessage(init: {
    role: TranscriptMessage["role"];
    content: string;
    context?: string;
    timestamp?: string;
    isError?: boolean;
}): TranscriptMessage {
    return {
        role: init.role,
        content: init.content,
        context: init.context,
        timestamp: init.timestamp ?? new Date().toISOString(),
        isError: init.isError ?? false,
    };
}

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
        hidden: 0,
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
