// The Persona feature's reactive store: a thin commit layer over the feature's
// db module (CONVENTIONS 3.2–3.5). It is a real `defineStore` setup store so Pinia
// owns the single shared instance every consumer binds to — the fix for the old
// factory-stub bug where each `usePersonaStore()` call returned its own unshared
// copy (the interview synthesis screen and the insight/profile screens could not
// see the same persona). It holds state only: every action assigns reactive state
// and persists through `persona/db`. No LLM I/O, no import/export orchestration
// lives here (that is the service layer's job). Leaf store: it imports only its own
// model and its db module — never another store, never a service or client.
//
// Surface decision (deviates from the Settings/Interview `toRefs` flat surface):
// a persona is consumed *as a whole document* by its renderers (insight/profile)
// and by the synthesis flow — never field-by-field — so the store exposes the one
// reactive aggregate as `persona` rather than spreading its 12 nested fields. This
// is the single-domain-aggregate allowance in rule 3.4 ("when the store's truth is
// one object, hold it as `reactive<Feature>`"); the mutation mechanics are identical
// to the sibling stores (in-place `Object.assign`, never rebind; JSON-clone persist).

import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { createEmptyPersona, type Persona } from "../models";
import {
    readPersona,
    writePersona,
    clearPersona as clearPersonaDb,
} from "../db";

export const usePersonaStore = defineStore("persona", () => {
    // One reactive source of truth — the live, total persona record. It is exposed
    // whole as `persona` (the aggregate consumers render). `createEmptyPersona()` is
    // total, so the record is never null: the empty state is the zeroed model, not
    // `null`. Whole-record swaps mutate it in place (`Object.assign`) so the exposed
    // reference is never orphaned by a rebind. (3.4)
    const state = reactive<Persona>(createEmptyPersona());

    // Transient UI error state — never persisted; not part of the domain model.
    // A persistence failure surfaces here for the view to render (error doctrine).
    const error = ref<string | null>(null);

    /** Persist the whole record via the db module. `state` is deep-reactive, so hand
     *  the db layer a deep-plain copy — a JSON round-trip reliably strips any reactive
     *  proxy. Safe because a `Persona` is plain JSON (strings, numbers, enums-as-ints,
     *  arrays). A failure is caught into reactive error state, not rethrown (CONVENTIONS
     *  7.17: a leaf store surfaces into its own error field; 7.18: one strategy). */
    async function persist(): Promise<void> {
        try {
            await writePersona(JSON.parse(JSON.stringify(state)) as Persona);
        } catch (e) {
            error.value = `Failed to save the persona: ${describeError(e)}`;
        }
    }

    /** Commit a complete persona record and persist. Must mutate `state` in place
     *  (`Object.assign`) — the exposed `persona` reference is bound to this object,
     *  so rebinding `state` would orphan it. The source is a total `Persona`, so every
     *  field is overwritten. Does not clear `error` on success: a background commit
     *  (e.g. synthesis) must not wipe an unrelated pushed error (7.17). */
    async function savePersona(next: Persona): Promise<void> {
        Object.assign(state, next);
        await persist();
    }

    /** Rehydrate from persistence; leaves the empty seed when nothing is stored.
     *  User-triggered lifecycle action → clears `error` on success (7.17). */
    async function loadPersona(): Promise<void> {
        try {
            const persona = await readPersona();
            if (persona) Object.assign(state, persona);
            error.value = null;
        } catch (e) {
            error.value = `Failed to load the persona: ${describeError(e)}`;
        }
    }

    /** Reset to a fresh empty record and drop the persisted entry.
     *  User-triggered lifecycle action → clears `error` on success (7.17). */
    async function clearPersona(): Promise<void> {
        try {
            Object.assign(state, createEmptyPersona());
            await clearPersonaDb();
            error.value = null;
        } catch (e) {
            error.value = `Failed to clear the persona: ${describeError(e)}`;
        }
    }

    /** Surface (or clear) a transient error for the view to render. The view also
     *  calls this to push a service-thrown error (e.g. a failed import) into state. */
    function setError(message: string | null): void {
        error.value = message;
    }

    /** Reduce an unknown thrown value to a renderable message. */
    function describeError(e: unknown): string {
        return e instanceof Error ? e.message : String(e);
    }

    return {
        persona: state,
        error,
        savePersona,
        loadPersona,
        clearPersona,
        setError,
    };
});
