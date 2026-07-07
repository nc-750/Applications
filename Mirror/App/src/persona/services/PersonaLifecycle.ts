// Cross-store orchestration for persona lifecycle events (import, delete) that
// must keep the interview store in sync (CONVENTIONS 3.6).  Lives in the persona
// feature's service layer because the persona lifecycle is the trigger; the
// interview side-effect is an implementation detail.  All functions receive their
// stores by injection (2.5) and persist only through store actions (4.5).
//
// Imports `usePersonaStore` and `useInterviewStore` as types only (for
// `ReturnType<typeof ...>`) — same pattern as `core/Wipe.ts`.

import { createEmptyInterview, type Interview } from "../../interview/models";
import type { Persona } from "../models";
import type { usePersonaStore } from "../stores";
import type { useInterviewStore } from "../../interview/stores";

type PersonaStore = ReturnType<typeof usePersonaStore>;
type InterviewStore = ReturnType<typeof useInterviewStore>;

/**
 * Build an Interview domain record seeded from a persona's post-interview state.
 * Pure helper — takes plain domain data, returns plain domain data (4.3–4.4).
 *
 * The persona's `metrics` map 1:1 onto the interview's `CoverageMap`:
 *   PersonaMetrics { story, strengths, growth, drivers }
 *   CoverageMap   { story, strengths, growth, drivers }
 *
 * The persona's `interview.messages` is the full transcript — it becomes the
 * interview's `messages` array.  `createdAt` is set to the import moment, not the
 * persona's original interview timestamp, because this is a new local session record.
 */
export function personaToInterview(persona: Persona): Interview {
    const now = new Date().toISOString();
    return {
        ...createEmptyInterview(),
        status: "completed",
        messages: persona.interview.messages,
        coverage: { ...persona.metrics },
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * After a persona import, synchronize the interview store from the newly imported
 * persona's interview data.  Only syncs when the persona carries a completed
 * interview (non-empty transcript); an empty persona (no interview ever completed)
 * leaves the interview store untouched so no stale state is written.
 *
 * Persists only through `interviewStore.saveInterview()` (4.5); never reaches into
 * the interview db module directly (2.2).
 */
export async function syncInterviewAfterImport(
    persona: Persona,
    interviewStore: InterviewStore,
): Promise<void> {
    if (persona.interview.messages.length === 0) {
        // No interview data to sync — nothing to write.
        return;
    }
    const interview = personaToInterview(persona);
    await interviewStore.saveInterview(interview);
}

/**
 * Clear both the persona and interview stores, then drop their persisted records.
 * Composes each store's own `clear*` action (5.8) — never reaches into db modules
 * directly.
 *
 * Both clears are awaited sequentially; if one surfaces an error into its store's
 * `error` ref, the other still runs (best-effort teardown, matching the
 * unsentimental style of `core/Wipe.ts`).
 */
export async function deletePersona(
    personaStore: PersonaStore,
    interviewStore: InterviewStore,
): Promise<void> {
    try {
        await personaStore.clearPersona();
    } catch {
        // clearPersona already surfaced the error into personaStore.error (7.17)
    }
    try {
        await interviewStore.clearInterview();
    } catch {
        // clearInterview already surfaced the error into interviewStore.error (7.17)
    }
}
