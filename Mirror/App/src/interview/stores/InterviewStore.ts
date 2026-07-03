// The Interview feature's reactive store: a thin commit layer over the feature's
// db module (CONVENTIONS 3.2–3.5). It is a real `defineStore` setup store so Pinia
// owns the single shared instance the view binds to; it holds state only — every
// action just assigns reactive state and persists through `interview/db`. No LLM
// I/O, no orchestration, no coverage-merge or conclude logic lives here (that is the
// service layer's job, Phase 2.5). Leaf store: it imports only its own models and
// its db module — never another store, never a service.

import { defineStore } from "pinia";
import { reactive, ref, toRefs } from "vue";
import {
    createEmptyInterview,
    type Interview,
    type InterviewStatus,
    type CoverageMap,
    type FacetKey,
    type ProbeSignal,
    type TranscriptMessage,
} from "../models";
import {
    readInterview,
    writeInterview,
    deleteInterview,
} from "../db";

export const useInterviewStore = defineStore("interview", () => {
    // One reactive source of truth — the live interview record. The flat refs
    // below are `toRefs` views onto its properties, so the store exposes a flat
    // surface (`store.status`, `store.coverage`, …) while keeping a single object
    // to persist and replace. `createEmptyInterview()` is total (every key present),
    // which `toRefs` requires to mint a ref for each field. (3.4)
    const state = reactive<Interview>(createEmptyInterview());
    const {
        status,
        messages,
        coverage,
        currentFacet,
        probeSignal,
        initialData,
        inputText,
        uploadedFileNames,
        wasDigested,
        createdAt,
        updatedAt,
    } = toRefs(state);

    // Transient UI error state — never persisted; not part of the domain model.
    // The service throws and the view catches into this (error doctrine).
    const error = ref<string | null>(null);

    /** Stamp `updatedAt` and persist the whole record via the db module. `state`
     *  is deep-reactive, so hand the db layer a deep-plain copy — a JSON round-trip
     *  reliably strips any reactive proxy (e.g. one introduced by spreading the
     *  reactive `messages` array). Safe because an `Interview` is plain JSON:
     *  strings, numbers, booleans, and arrays of those — no Dates, Maps, or Sets.
     *
     *  A persistence failure is caught into reactive error state, not rethrown
     *  (CONVENTIONS rule 11: a store may surface an error into its own error field;
     *  rule 13: one strategy per function). The mutating actions that call this
     *  therefore never reject — the failure shows up as `error`. */
    async function persist(): Promise<void> {
        try {
            state.updatedAt = new Date().toISOString();
            await writeInterview(JSON.parse(JSON.stringify(state)) as Interview);
        } catch (e) {
            setError(`Failed to save the interview: ${describeError(e)}`);
        }
    }

    /** Bulk-replace the live record from a full `Interview`. Must mutate `state`
     *  in place (`Object.assign`) — the `toRefs` refs are bound to this object, so
     *  rebinding `state` would orphan them. The source is a total `Interview`, so
     *  every field — including cleared optionals — is overwritten. */
    function replaceState(next: Interview): void {
        Object.assign(state, next);
    }

    /** Commit a complete interview (e.g. a freshly seeded session) and persist. */
    async function saveInterview(interview: Interview): Promise<void> {
        replaceState(interview);
        await persist();
    }

    /** Append one transcript line and persist. */
    async function appendMessage(message: TranscriptMessage): Promise<void> {
        messages.value = [...messages.value, message];
        await persist();
    }

    /** Replace the coverage reading and persist. */
    async function setCoverage(next: CoverageMap): Promise<void> {
        coverage.value = next;
        await persist();
    }

    /** Move the lifecycle status and persist. */
    async function setStatus(next: InterviewStatus): Promise<void> {
        status.value = next;
        await persist();
    }

    /** Record which facet is being probed and how strong the last answer was. */
    async function setProbe(
        facet: FacetKey | undefined,
        signal: ProbeSignal | undefined,
    ): Promise<void> {
        currentFacet.value = facet;
        probeSignal.value = signal;
        await persist();
    }

    /** Rehydrate from persistence; leaves the empty seed when nothing is stored.
     *  A read failure is surfaced into `error`, not thrown (rules 11/13). */
    async function loadInterview(): Promise<void> {
        try {
            const interview = await readInterview();
            if (interview) replaceState(interview);
            setError(null);
        } catch (e) {
            setError(`Failed to load the interview: ${describeError(e)}`);
        }
    }

    /** Reset to a fresh empty session and drop the persisted record.
     *  A delete failure is surfaced into `error`, not thrown (rules 11/13). */
    async function clearInterview(): Promise<void> {
        try {
            replaceState(createEmptyInterview());
            await deleteInterview();
            setError(null);
        } catch (e) {
            setError(`Failed to clear the interview: ${describeError(e)}`);
        }
    }

    /** Surface (or clear) a transient error for the view to render. The view also
     *  calls this to push a service-thrown error into the store's error state. */
    function setError(message: string | null): void {
        error.value = message;
    }

    /** Reduce an unknown thrown value to a renderable message. */
    function describeError(e: unknown): string {
        return e instanceof Error ? e.message : String(e);
    }

    return {
        status,
        messages,
        coverage,
        currentFacet,
        probeSignal,
        initialData,
        inputText,
        uploadedFileNames,
        wasDigested,
        createdAt,
        updatedAt,
        error,
        saveInterview,
        appendMessage,
        setCoverage,
        setStatus,
        setProbe,
        loadInterview,
        clearInterview,
        setError,
    };
});
