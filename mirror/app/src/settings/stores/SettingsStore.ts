// The Settings feature's reactive store: a thin commit layer over the feature's
// db module (CONVENTIONS 3.2–3.5). It is a real `defineStore` setup store so Pinia
// owns the single shared instance every consumer binds to — the fix for the old
// factory-stub bug where each `useSettingsStore()` call returned its own unshared
// copy and the interview screen could never see settings saved on the Settings
// screen. It holds state only: every action assigns reactive state and persists
// through `settings/db`. No LLM I/O, no test-connection, no orchestration lives
// here (that is the service layer's job, Phase 4). Leaf store: it imports only its
// own model and its db module — never another store, never a service or client.

import { defineStore } from "pinia";
import { reactive, ref, computed, toRefs } from "vue";
import { createEmptySettings, type Settings } from "../models";
import {
    readSettings,
    writeSettings,
    clearSettings as clearSettingsDb,
} from "../db";

export const useSettingsStore = defineStore("settings", () => {
    // One reactive source of truth — the live, total settings record. The flat
    // refs below are `toRefs` views onto its properties, so the store exposes a
    // flat surface (`store.provider`, `store.model`, …) while keeping a single
    // object to persist and replace. `createEmptySettings()` is total (every key
    // present), which `toRefs` requires to mint a ref for each field. The record
    // is never null: the unconfigured state is the zeroed model, not `null`. (3.4)
    const state = reactive<Settings>(createEmptySettings());
    const { provider, model, apiKey, endpoint } = toRefs(state);

    // Transient UI error state — never persisted; not part of the domain model.
    // A persistence failure surfaces here for the view to render (error doctrine).
    const error = ref<string | null>(null);

    // Configured? is derived from field-completeness, not a nullable flag: a
    // provider must be chosen and a model + key supplied. `endpoint` is optional
    // (OpenAI/Anthropic don't need one), so it is not part of the check.
    const isLLMConfigured = computed(
        () =>
            state.provider !== undefined &&
            state.model !== "" &&
            state.apiKey !== "",
    );

    /** Persist the whole record via the db module. `state` is deep-reactive, so
     *  hand the db layer a deep-plain copy — a JSON round-trip reliably strips any
     *  reactive proxy. Safe because `Settings` is plain JSON (strings + an enum).
     *  A failure is caught into reactive error state, not rethrown (CONVENTIONS
     *  7.17: a leaf store surfaces into its own error field; 7.18: one strategy). */
    async function persist(): Promise<void> {
        try {
            await writeSettings(JSON.parse(JSON.stringify(state)) as Settings);
        } catch (e) {
            error.value = `Failed to save settings: ${describeError(e)}`;
        }
    }

    /** Commit a complete settings record and persist. Must mutate `state` in place
     *  (`Object.assign`) — the `toRefs` refs are bound to this object, so rebinding
     *  `state` would orphan them. The source is a total `Settings`, so every field
     *  — including cleared optionals — is overwritten. */
    async function saveSettings(next: Settings): Promise<void> {
        Object.assign(state, next);
        await persist();
    }

    /** Rehydrate from persistence; leaves the empty seed when nothing is stored.
     *  A read failure is surfaced into `error`, not thrown (rules 7.17/7.18). */
    async function loadSettings(): Promise<void> {
        try {
            const settings = await readSettings();
            if (settings) Object.assign(state, settings);
            error.value = null;
        } catch (e) {
            error.value = `Failed to load settings: ${describeError(e)}`;
        }
    }

    /** Reset to a fresh empty record and drop the persisted entry (and the keyring
     *  entry on Tauri — the db module owns that split). Failure surfaces, no throw. */
    async function clearSettings(): Promise<void> {
        try {
            Object.assign(state, createEmptySettings());
            await clearSettingsDb();
            error.value = null;
        } catch (e) {
            error.value = `Failed to clear settings: ${describeError(e)}`;
        }
    }

    /** Surface (or clear) a transient error for the view to render. */
    function setError(message: string | null): void {
        error.value = message;
    }

    /** Reduce an unknown thrown value to a renderable message. */
    function describeError(e: unknown): string {
        return e instanceof Error ? e.message : String(e);
    }

    return {
        provider,
        model,
        apiKey,
        endpoint,
        error,
        isLLMConfigured,
        loadSettings,
        saveSettings,
        clearSettings,
        setError,
    };
});
