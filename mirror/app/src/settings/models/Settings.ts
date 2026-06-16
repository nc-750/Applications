// The Settings feature's canonical domain model: how this device talks to an LLM.
// Plain data only — no persistence key and no wire (LLM) shape live here
// (CONVENTIONS 1.1). The platform-specific API-key split and the IndexedDB record
// shape are the db layer's concern (Phase 2), not the model's.

import type { LLMProvider } from "../../llm";

// Optional fields are modelled as required keys whose value may be `undefined`,
// not absent keys (`x?: T`). A `Settings` is always "total" — every key present —
// which lets the store derive a ref per field via `toRefs` and reset cleanly via
// `Object.assign` (an absent key would mint no ref and leave a stale value behind).
// `provider` is the one optional: an enum has no "empty" member, so the unset
// state is `undefined`. `provider` stays the shared `LLMProvider` enum from
// `src/llm/` — a shared type, never re-declared here.
export interface Settings {
    provider: LLMProvider | undefined;
    model: string;
    apiKey: string;
    endpoint: string;
}

/** A fresh, unconfigured settings record with every field present and zeroed.
 *
 *  Two later callers rely on this totality: the store seeds its `reactive` state
 *  from here and derives one ref per key via `toRefs`, and `clearSettings` resets
 *  by `Object.assign`-ing this over the live state. `isLLMConfigured` is derived
 *  in the store from field-completeness (provider + model + apiKey present) — this
 *  model never carries a nullable "configured?" flag. */
export function createEmptySettings(): Settings {
    return {
        provider: undefined,
        model: "",
        apiKey: "",
        endpoint: "",
    };
}
