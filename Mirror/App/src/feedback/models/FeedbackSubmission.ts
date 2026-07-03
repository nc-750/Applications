// The feedback feature's canonical domain model: one submission the user composes
// before it is dispatched via mailto:. Plain data only — no persistence key and no
// wire shape live here (CONVENTIONS 1.1). Feedback is never stored locally; the
// mailto: transport means this model is ephemeral by design.

import type { FeedbackCategory } from "../reference";

// Optional fields are modelled as required keys whose value may be `undefined`,
// not absent keys (`x?: T`). A `FeedbackSubmission` is always "total" — every key
// present — which lets a future store derive a ref per field via `toRefs` and reset
// cleanly via `Object.assign` (an absent key would mint no ref and leave a stale
// value behind). `category` is the one optional: the enum-like string-literal union
// has no "empty" member, so the unset state is `undefined`. This mirrors the
// `Settings.provider` pattern in `src/settings/models/Settings.ts`.
export interface FeedbackSubmission {
    category: FeedbackCategory | undefined;
    email: string;
    subject: string;
    content: string;
}

/** A fresh, unconfigured feedback submission with every field present and zeroed.
 *
 *  Two later callers rely on this totality: the store seeds its `reactive` state
 *  from here and derives one ref per key via `toRefs`, and the form-reset action
 *  resets by `Object.assign`-ing this over the live state. `category` is `undefined`
 *  rather than a pre-selected value so the Phase 2 form can distinguish "user has
 *  not chosen yet" from "user chose a category" for its validation logic. */
export function createEmptyFeedbackSubmission(): FeedbackSubmission {
    return {
        category: undefined,
        email: "",
        subject: "",
        content: "",
    };
}
