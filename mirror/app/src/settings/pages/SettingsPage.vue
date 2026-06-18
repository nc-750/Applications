<script setup lang="ts">
// Settings page — the top rung of the settings feature. Binds the settings, persona,
// and logger surfaces read-only, delegates every side effect to a service or a thin
// store action (testConnection, persona import/export, factoryReset, clearSettings),
// and renders via the Lab Chassis→Band→Cell contract (CONVENTIONS 7.2–7.7). The view
// holds no LLM call, no file parsing, and no persistence — it only orchestrates the
// `onX` handlers and surfaces errors visibly (2.7, 7.17).

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
import LLMConfigCell from "../components/LLMConfigCell.vue";
import ConnectionMonitorCell from "../components/ConnectionMonitorCell.vue";
import DataManagementCell from "../components/DataManagementCell.vue";
import SystemControlCell from "../components/SystemControlCell.vue";

const settingsStore = useSettingsStore();
const personaStore = usePersonaStore();
const interviewStore = useInterviewStore();

// Debug flag — toggled through the logger foundational module's `setDebugEnabled`
// (Rule 5.3: foundational state a UI only toggles). Default matches the module-level
// `debugEnabled` ref (false per CONVENTIONS example).
const debugEnabled = ref(false);

// Connection-test reading — an honest live readout rendered in the monitor cavity.
const linkStatus = ref<"idle" | "testing" | "ok" | "error">("idle");
const linkLatencyMs = ref<number | undefined>(undefined);
const linkMessage = ref<string | undefined>(undefined);

// Model list populated by fetch-models events from the config cell.
const modelList = ref<string[]>([]);

// Page-level error from a service throw (import/export). Store persistence failures
// surface in each store's own `error` ref; the banner shows whichever is set (7.17).
const pageError = ref<string | null>(null);
const displayError = computed(
    () => pageError.value ?? settingsStore.error ?? personaStore.error ?? null,
);

// ── Event handlers (all named onX — CONVENTIONS 6.6) ────────────────────────

async function onSave(config: LLMConfig) {
    await settingsStore.saveSettings(config);
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
    pageError.value = null;
    try {
        await importPersona(file, personaStore);
        await syncInterviewAfterImport(personaStore.persona, interviewStore);
    } catch (e) {
        pageError.value = `Import failed: ${e instanceof Error ? e.message : String(e)}`;
    }
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
    await deletePersona(personaStore, interviewStore);
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
    settingsStore.setError(null);
    personaStore.setError(null);
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

    <!-- Service/persistence error banner — kept inside a Cell (no content outside, 7.2) -->
    <Band v-if="displayError">
        <Cell title="ERROR" spec="SYS // 0xEE">
            <div class="flex items-center gap-2" role="alert">
                <p class="nc-text-sm spg-error-text">{{ displayError }}</p>
                <button class="nc-btn nc-btn--ghost nc-btn--sm" @click="onDismissError">Dismiss</button>
            </div>
        </Cell>
    </Band>
</template>

<style scoped>
/* kept: no .nc-* class for error-banner text colour */
.spg-error-text {
    color: var(--nc-error);
    flex: 1;
}
</style>
