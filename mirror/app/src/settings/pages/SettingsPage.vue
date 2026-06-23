<script setup lang="ts">
// Settings page — the top rung of the settings feature. Binds the settings, persona,
// and logger surfaces read-only, delegates every side effect to a service or a thin
// store action (testConnection, persona import/export, factoryReset, clearSettings),
// and renders via the Lab Chassis→Band→Cell contract (CONVENTIONS 7.2–7.7). The view
// holds no LLM call, no file parsing, and no persistence — it only orchestrates the
// `onX` handlers and surfaces errors visibly (2.7, 7.17).
//
// Phase 2 additions:
//   - Three independent useActionStatus() holders for save / import / delete
//     (CONVENTIONS 4.6 — composable as reactive adapter; §2 one-way graph: view
//     holds status seeded from service/store outcomes; nothing reaches down).
//   - Each handler drives its holder to the genuine terminal reading (C7 claims
//     literally true): save reads settingsStore.error; delete reads
//     personaStore.error ?? interviewStore.error; import catches the real rejection.
//   - No double-surface: displayError no longer funnels settingsStore.error or
//     personaStore.error (those paths are now owned by the modal). onImportPersona
//     no longer sets pageError. Export-path pageError is retained.
//   - ActionStatusModal mounted once at page level (not inside a Band) so its
//     position:fixed contract is honored.

import { ref, computed } from "vue";
import { Band, Cell } from "@nc-750/lab-vue";
import { useSettingsStore } from "../stores";
import { usePersonaStore } from "../../persona/stores";
import { useInterviewStore } from "../../interview/stores";
import { setDebugEnabled } from "../../logger";
import { testConnection, getModels } from "../services";
import {
    importPersona,
    exportPersona,
    deletePersona,
    syncInterviewAfterImport,
} from "../../persona/services";
import { factoryReset } from "../../core/Wipe";
import type { LLMConfig } from "../../llm";
import { useActionStatus } from "../composables";
import LLMConfigCell from "../components/LLMConfigCell.vue";
import ConnectionMonitorCell from "../components/ConnectionMonitorCell.vue";
import DataManagementCell from "../components/DataManagementCell.vue";
import SystemControlCell from "../components/SystemControlCell.vue";
import ActionStatusModal from "../components/ActionStatusModal.vue";

const settingsStore = useSettingsStore();
const personaStore = usePersonaStore();
const interviewStore = useInterviewStore();

// Debug flag — toggled through the logger foundational module's `setDebugEnabled`
// (Rule 5.3: foundational state a UI only toggles). Default matches the module-level
// `debugEnabled` ref (false per CONVENTIONS example).
const debugEnabled = ref(false);

// Connection-test reading — an honest live readout rendered in the monitor cavity.
// Not touched by Phase 2 (Out of scope wall: linkStatus triple / onTest / ConnectionMonitorCell).
const linkStatus = ref<"idle" | "testing" | "ok" | "error">("idle");
const linkLatencyMs = ref<number | undefined>(undefined);
const linkMessage = ref<string | undefined>(undefined);

// Model list populated by fetch-models events from the config cell.
const modelList = ref<string[]>([]);

// Page-level error from a service throw — backs export failures (onExportPersona).
// After Phase 2: save/delete/import failures are owned by the modal and are NOT
// funnelled here. The banner cell remains for the export path.
const pageError = ref<string | null>(null);

// displayError now backs only export-path pageError. settingsStore.error and
// personaStore.error are dropped from this chain — their failures are now surfaced
// exclusively in the modal (no-double-surface invariant, Phase 2 brief §In-scope).
const displayError = computed(() => pageError.value ?? null);

// ── Per-action status holders (Phase 2) ──────────────────────────────────────
// Three independent reactive holders — one per data operation — seeded from the
// genuine outcome of each action (CONVENTIONS 4.6; ETHOS C7).

const saveStatus = useActionStatus();
const importStatus = useActionStatus();
const deleteStatus = useActionStatus();

// The active data-operation status: the first non-idle holder wins (at most one
// runs at a time in normal use). The page passes this to the modal and decides
// open/closed from its kind.
const activeDataOpStatus = computed(() => {
    if (saveStatus.status.kind !== "idle") return saveStatus.status;
    if (importStatus.status.kind !== "idle") return importStatus.status;
    if (deleteStatus.status.kind !== "idle") return deleteStatus.status;
    return null;
});

// The operation label for the active holder (drives the Acquire label and terminal
// heading in the modal).
const activeOperationLabel = computed(() => {
    if (saveStatus.status.kind !== "idle") return "SAVING CONFIG";
    if (importStatus.status.kind !== "idle") return "IMPORTING PERSONA";
    if (deleteStatus.status.kind !== "idle") return "DELETING PERSONA";
    return "";
});

// ── Event handlers (all named onX — CONVENTIONS 6.6) ────────────────────────

async function onSave(config: LLMConfig) {
    saveStatus.toRunning();
    // Snapshot the error ref BEFORE the await: saveSettings never clears error on
    // success (only persist() sets it on failure, never resets it). Without the
    // snapshot a stale error from a prior failed save would be misread as a new
    // failure on the next *successful* save — a literally-false terminal (ETHOS C7).
    // The save is a NEW failure only when settingsStore.error is non-null AND
    // different from the pre-await snapshot. The store stays the source of truth;
    // the view is not allowed to invent or clear a store field (§2 one-way graph).
    const errorBefore = settingsStore.error;
    await settingsStore.saveSettings(config);
    const errorAfter = settingsStore.error;
    if (errorAfter !== null && errorAfter !== errorBefore) {
        saveStatus.toError(errorAfter);
    } else {
        saveStatus.toSuccess();
    }
}

async function onTest(config: LLMConfig) {
    linkStatus.value = "testing";
    linkMessage.value = undefined;
    try {
        linkLatencyMs.value = await testConnection(config);
        linkStatus.value = "ok";
    } catch (e) {
        linkStatus.value = "error";
        linkMessage.value = e instanceof Error ? e.message : String(e);
    }
}

async function onFetchModels(config: LLMConfig) {
    try {
        modelList.value = await getModels(config);
    } catch {
        // Non-blocking — silently keep the previous list (or empty).
    }
}

async function onImportPersona(file: File) {
    importStatus.toRunning();
    // importPersona DOES throw on a bad file — real try/catch is the correct
    // failure path here (contrast with save/delete which never reject).
    try {
        await importPersona(file, personaStore);
        await syncInterviewAfterImport(personaStore.persona, interviewStore);
        importStatus.toSuccess();
    } catch (e) {
        importStatus.toError(e instanceof Error ? e.message : String(e));
    }
    // onImportPersona no longer sets pageError — the modal owns this failure.
}

function onExportPersona() {
    pageError.value = null;
    try {
        exportPersona(personaStore);
    } catch (e) {
        pageError.value = `Export failed: ${e instanceof Error ? e.message : String(e)}`;
    }
}

async function onDeletePersona() {
    deleteStatus.toRunning();
    // deletePersona returns void and NEVER rejects — each store clear catches into
    // its own store.error (PersonaLifecycle.ts:72–86; CONVENTIONS 7.17).
    // Read the combined store outcome for the honest terminal (ETHOS C7: success
    // is contingent on a clean store outcome, not the void return).
    await deletePersona(personaStore, interviewStore);
    const storeError = personaStore.error ?? interviewStore.error;
    if (storeError) {
        deleteStatus.toError(storeError);
    } else {
        deleteStatus.toSuccess();
    }
}

async function onClearConfig() {
    await settingsStore.clearSettings();
    linkStatus.value = "idle";
    linkLatencyMs.value = undefined;
    linkMessage.value = undefined;
}

function onToggleDebug() {
    debugEnabled.value = !debugEnabled.value;
    setDebugEnabled(debugEnabled.value);
}

function onFactoryReset() {
    factoryReset(personaStore, settingsStore);
}

function onDismissError() {
    pageError.value = null;
    // Note: settingsStore.setError and personaStore.setError are NOT called here
    // any more for save/delete path errors — those are dismissed via onDismissModal.
    // Export-path pageError still routes through the banner; its dismiss is this handler.
}

// Dismiss the active data-operation modal: reset whichever holder is active.
function onDismissModal() {
    if (saveStatus.status.kind !== "idle") saveStatus.reset();
    else if (importStatus.status.kind !== "idle") importStatus.reset();
    else if (deleteStatus.status.kind !== "idle") deleteStatus.reset();
}
</script>

<template>
    <!-- Config + live link readout: dense operable form paired with the dark cavity -->
    <Band :grow="1">
        <LLMConfigCell
            :provider="settingsStore.provider"
            :model="settingsStore.model"
            :api-key="settingsStore.apiKey"
            :endpoint="settingsStore.endpoint"
            :testing="linkStatus === 'testing'"
            :model-list="modelList"
            @save="onSave"
            @test="onTest"
            @fetch-models="onFetchModels"
        />
        <ConnectionMonitorCell
            :status="linkStatus"
            :latency-ms="linkLatencyMs"
            :message="linkMessage"
        />
    </Band>

    <!-- Data management + system controls -->
    <Band>
        <DataManagementCell
            @import="onImportPersona"
            @export="onExportPersona"
            @delete="onDeletePersona"
        />
        <SystemControlCell
            :debug-enabled="debugEnabled"
            @clear-config="onClearConfig"
            @factory-reset="onFactoryReset"
            @toggle-debug="onToggleDebug"
        />
    </Band>

    <!-- Service/persistence error banner — kept for export-path pageError only.
         save / delete / import failures are now owned by ActionStatusModal (no double-surface). -->
    <Band v-if="displayError">
        <Cell title="ERROR" spec="SYS // 0xEE">
            <div class="flex items-center gap-2" role="alert">
                <p class="nc-text-sm spg-error-text">{{ displayError }}</p>
                <button class="nc-btn nc-btn--ghost nc-btn--sm" @click="onDismissError">Dismiss</button>
            </div>
        </Cell>
    </Band>

    <!-- Data-operation status modal: viewport-fixed, mounted at page level (not inside
         a Band) so its position:fixed contract is honored and it is not subject to a
         Band's column collapse. Driven by the three action holders.
         v-if keeps the component absent from the DOM entirely when all holders are idle
         so findComponent().exists() === false at rest (the test's visibility contract). -->
    <ActionStatusModal
        v-if="activeDataOpStatus !== null"
        :status="activeDataOpStatus"
        :operation-label="activeOperationLabel"
        @dismiss="onDismissModal"
    />
</template>

<style scoped>
/* kept: no .nc-* class for error-banner text colour */
.spg-error-text {
    color: var(--nc-error);
    flex: 1;
}
</style>
