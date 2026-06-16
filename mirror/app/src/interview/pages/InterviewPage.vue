<script setup lang="ts">
// Interview page — the top rung of the interview feature. Binds to the interview
// store read-only, delegates all LLM work to the Phase 2.5 services, and renders
// via the Lab Chassis→Band→Cell/MonitorCell contract (CONVENTIONS 7.2–7.7).
//
// Five states, driven by InterviewStatus:
//   idle         → data input
//   active       → coverage readout + probe (or conclude if saturated)
//   synthesizing → coverage readout + completion spinner
//   completed    → coverage readout + completion success
//   error        → coverage readout + completion error

import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Band, Cell, MonitorCell } from "@nc-750/lab-vue";
import type { LLMClient } from "@nc-750/llm-ts";
import { logger } from "../../logger";
import { createClientFromConfig } from "../../llm/factory";
import { useInterviewStore } from "../stores/InterviewStore";
import { useSettingsStore } from "../../settings/stores";
import { usePersonaStore } from "../../persona/stores";
import {
    beginInterview,
    submitAnswer,
    probeMore,
    finishEarly,
    runSynthesis,
    abort,
    canConclude,
    needsDigestion,
} from "../services";
import DataInputForm from "../components/DataInputForm.vue";
import CoverageReadout from "../components/CoverageReadout.vue";
import ProbePanel from "../components/ProbePanel.vue";
import ConcludePanel from "../components/ConcludePanel.vue";
import TranscriptLog from "../components/TranscriptLog.vue";
import CompletionPanel from "../components/CompletionPanel.vue";

// ── Stores ──────────────────────────────────────────────────────────────────
const interviewStore = useInterviewStore();
const settingsStore = useSettingsStore();
const personaStore = usePersonaStore();
const router = useRouter();

// ── Local UI state ──────────────────────────────────────────────────────────
const pageError = ref<string | null>(null);
const isBusy = ref(false);

// ── Derived ─────────────────────────────────────────────────────────────────
const status = computed(() => interviewStore.status);
const isIdle = computed(() => status.value === "idle");
const isActive = computed(() => status.value === "active");
const isSynthesizing = computed(() => status.value === "synthesizing");
const isCompleted = computed(() => status.value === "completed");
const isError = computed(() => status.value === "error");
const showCompletion = computed(
    () => isSynthesizing.value || isCompleted.value || isError.value,
);
const hasConcluded = computed(() => canConclude(interviewStore.coverage));

/** The last non-error assistant message — the current question. */
const lastQuestion = computed(() => {
    const msgs = interviewStore.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant" && !msgs[i].isError) return msgs[i].content;
    }
    return "";
});

// ── LLM client ──────────────────────────────────────────────────────────────
const llmClient = ref<LLMClient | null>(null);

function buildClient(): void {
    if (!settingsStore.isLLMConfigured) {
        llmClient.value = null;
        return;
    }
    try {
        // The settings store exposes a flat surface; assemble the LLMConfig the
        // factory expects from those refs. `isLLMConfigured` guarantees provider
        // is set, so the non-null assertion is safe.
        llmClient.value = createClientFromConfig({
            provider: settingsStore.provider!,
            model: settingsStore.model,
            apiKey: settingsStore.apiKey,
            endpoint: settingsStore.endpoint,
        });
        pageError.value = null;
    } catch (e) {
        llmClient.value = null;
        pageError.value = e instanceof Error ? e.message : "Failed to create LLM client";
    }
}

watch(
    () => [settingsStore.provider, settingsStore.model, settingsStore.apiKey, settingsStore.endpoint],
    buildClient,
    { immediate: true },
);

// ── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
    try {
        await interviewStore.loadInterview();
    } catch {
        // loadInterview surfaces read failures into interviewStore.error
    }
});

// ── Event handlers (all named onX — CONVENTIONS 6.6) ────────────────────────

async function onDataContinue(data: string, inputText: string, fileNames: string[]) {
    const client = llmClient.value;
    if (!client) {
        pageError.value = "LLM not configured. Check your settings.";
        return;
    }

    isBusy.value = true;
    try {
        const model = settingsStore.model;
        const filesForDigestion = fileNames.map((n) => ({ name: n, text: "" }));
        const wasDigested = needsDigestion(filesForDigestion, inputText, model);
        // Note: actual digestion (LLM summarisation) is future work;
        // needsDigestion only reports whether it would be needed.
        await beginInterview(client, interviewStore, data, inputText, fileNames, wasDigested);
    } catch (e) {
        pageError.value = e instanceof Error ? e.message : "Failed to begin interview.";
        logger.error("app", "beginInterview failed", { error: e instanceof Error ? e : undefined });
    } finally {
        isBusy.value = false;
    }
}

async function onSubmitAnswer(answer: string) {
    const client = llmClient.value;
    if (!client) return;

    isBusy.value = true;
    try {
        await submitAnswer(client, interviewStore, answer);
    } catch (e) {
        pageError.value = e instanceof Error ? e.message : "Failed to process answer.";
        logger.error("app", "submitAnswer failed", { error: e instanceof Error ? e : undefined });
    } finally {
        isBusy.value = false;
    }
}

async function onContinue() {
    const client = llmClient.value;
    if (!client) return;

    isBusy.value = true;
    try {
        await probeMore(client, interviewStore);
    } catch (e) {
        pageError.value = e instanceof Error ? e.message : "Failed to generate next probe.";
        logger.error("app", "probeMore failed", { error: e instanceof Error ? e : undefined });
    } finally {
        isBusy.value = false;
    }
}

async function onFinishEarly() {
    try {
        await finishEarly(interviewStore);
    } catch (e) {
        pageError.value = e instanceof Error ? e.message : "Failed to finish early.";
        return;
    }
    await onGenerate();
}

async function onGenerate() {
    const client = llmClient.value;
    if (!client) return;

    isBusy.value = true;
    try {
        await runSynthesis(client, interviewStore, personaStore);
        // runSynthesis sets status to "completed" and commits the persona;
        // on failure it sets status to "error" and calls interviewStore.setError().
    } catch (e) {
        // Synthesis already surfaced the error into interviewStore.error.
        // Log only unexpected re-throws from infrastructure.
        logger.error("app", "Synthesis failed", { error: e instanceof Error ? e : undefined });
    } finally {
        isBusy.value = false;
    }
}

function onAbort() {
    abort();
    isBusy.value = false;
}

async function onRestart() {
    pageError.value = null;
    try {
        await interviewStore.clearInterview();
    } catch (e) {
        pageError.value = e instanceof Error ? e.message : "Failed to clear interview.";
    }
}
</script>

<template>
    <!-- IDLE — Data input -->
    <Band v-if="isIdle" :grow="1">
        <Cell title="DATA INPUT" spec="IVW // 0x01" :grow="1">
            <DataInputForm :disabled="isBusy" @continue="onDataContinue" />
        </Cell>
    </Band>

    <!-- ACTIVE / SYNTHESIZING / COMPLETED / ERROR -->
    <template v-else>
        <!-- Working band: coverage readout + interaction -->
        <Band :grow="1">
            <!-- Live coverage readout — MonitorCell = read-only, rule 7.6 -->
            <MonitorCell title="COVERAGE" spec="IVW // 0x02">
                <CoverageReadout
                    :coverage="interviewStore.coverage"
                    :probe-signal="interviewStore.probeSignal"
                    :acquiring="isBusy"
                />
            </MonitorCell>

            <!-- Interaction cell — the active surface for input/actions -->
            <Cell title="INTERVIEW" spec="IVW // 0x03" :grow="3">
                <!-- Page-level error banner -->
                <div
                    v-if="pageError"
                    class="flex items-center gap-2 p-3 mb-4 ivw-error"
                    role="alert"
                >
                    <p class="nc-text-sm ivw-error-text">{{ pageError }}</p>
                    <button
                        class="nc-btn nc-btn--ghost nc-btn--sm"
                        @click="pageError = null"
                    >
                        Dismiss
                    </button>
                </div>

                <!-- Synthesizing / Completed / Error -->
                <CompletionPanel
                    v-if="showCompletion"
                    :status="(status as 'synthesizing' | 'completed' | 'error')"
                    :error-message="interviewStore.error ?? undefined"
                    @go-insight="router.push('/insight')"
                    @go-profile="router.push('/profile')"
                    @retry="onGenerate"
                    @restart="onRestart"
                />

                <!-- Concluded: coverage saturated — offer generate or continue -->
                <ConcludePanel
                    v-else-if="hasConcluded && isActive"
                    :busy="isBusy"
                    @generate="onGenerate"
                    @continue="onContinue"
                />

                <!-- Active probe: question + answer input -->
                <ProbePanel
                    v-else-if="isActive"
                    :facet="interviewStore.currentFacet ?? 'story'"
                    :question="lastQuestion"
                    :disabled="isBusy"
                    @submit="onSubmitAnswer"
                />

                <!-- Action bar (visible during active interview) -->
                <div v-if="isActive" class="flex justify-between mt-4">
                    <button
                        class="nc-btn nc-btn--ghost nc-btn--sm"
                        @click="onFinishEarly"
                    >
                        Finish early &amp; generate
                    </button>
                    <button
                        class="nc-btn nc-btn--danger nc-btn--sm"
                        @click="onAbort"
                    >
                        Cancel
                    </button>
                </div>
            </Cell>
        </Band>

        <!-- Session log band -->
        <Band>
            <Cell title="SESSION LOG" spec="IVW // 0x04">
                <TranscriptLog :messages="interviewStore.messages" />
            </Cell>
        </Band>
    </template>
</template>

<style scoped>
/* kept: no .nc-* class for error-banner background or error-text colour */
.ivw-error {
    background: color-mix(in srgb, var(--nc-error) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--nc-error) 20%, transparent);
    border-radius: var(--nc-radius-md);
}

.ivw-error-text {
    color: var(--nc-error);
    flex: 1;
}
</style>
