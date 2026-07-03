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

import { ref, computed, onMounted } from "vue";
import { Band, Cell, MonitorCell } from "@nc-750/lab-vue";
import { logger } from "../../logger";
import { useInterviewStore } from "../stores/InterviewStore";
import { useSettingsStore } from "../../settings/stores";
import { usePersonaStore } from "../../persona/stores";
import { useLLMClient } from "../../llm";
import {
    beginInterview,
    submitAnswer,
    probeMore,
    finishEarly,
    runSynthesis,
    abort,
    canConclude,
    countQuestionsAsked,
    needsDigestion,
} from "../services";
import { MAX_QUESTIONS } from "../reference";
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

// ── LLM client ──────────────────────────────────────────────────────────────
// The settings→client wiring lives in a reactive adapter composable (4.6); the
// view stays a thin consumer (2.7).
const { client: llmClient, clientError } = useLLMClient();

// ── Local UI state ──────────────────────────────────────────────────────────
const pageError = ref<string | null>(null);
const isBusy = ref(false);

// Banner shows whichever error is set: a handler failure (pageError) or a
// client-construction failure surfaced by the composable (clientError).
const displayError = computed(() => pageError.value ?? clientError.value);

// ── Derived ─────────────────────────────────────────────────────────────────
const status = computed(() => interviewStore.status);
const isActive = computed(() => status.value === "active");
const isSynthesizing = computed(() => status.value === "synthesizing");
const isCompleted = computed(() => status.value === "completed");
const isError = computed(() => status.value === "error");
const showCompletion = computed(
    () => isSynthesizing.value || isCompleted.value || isError.value,
);
const hasConcluded = computed(() => canConclude(interviewStore.coverage));
// Hard backstop: once the soft question cap is reached, offer the conclude state
// even if coverage is still short of target (matches the service-side cap).
const reachedCap = computed(
    () => countQuestionsAsked(interviewStore.messages) >= MAX_QUESTIONS,
);
// True only when the cap — not full coverage — triggered the conclude offer, so
// the panel can tell the truth rather than claim "coverage locked".
const cappedShort = computed(() => reachedCap.value && !hasConcluded.value);

/** The last non-error assistant message — the current question. */
const lastQuestion = computed(() => {
    const msgs = interviewStore.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant" && !msgs[i].isError) return msgs[i].content;
    }
    return "";
});

// ── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
    window.addEventListener("beforeunload", onBeforeUnload);

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
        logger.debug("app", "beginInterview has finished");
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
    logger.debug("app", "Restarting interview");
    pageError.value = null;
    try {
        await interviewStore.clearInterview();
    } catch (e) {
        pageError.value = e instanceof Error ? e.message : "Failed to clear interview.";
    }
}

async function onBeforeUnload() {
    if (status.value === "synthesizing") {
        interviewStore.setStatus("active");
    }
}
</script>

<template>
    <!-- Working band: coverage readout + interaction -->
    <Band :grow="1">
        <!-- Live coverage readout — MonitorCell = read-only, rule 7.6 -->
        <MonitorCell title="COVERAGE" spec="IVW // 0x01">
            <CoverageReadout
                :coverage="interviewStore.coverage"
                :probe-signal="interviewStore.probeSignal"
                :acquiring="isBusy"
            />
        </MonitorCell>


    <!-- <Cell v-show="isActive" title="DATA INPUT" spec="IVW // 0x02">
        
    </Cell> -->
    
        <!-- Interaction cell — the active surface for input/actions -->
        <Cell title="INTERVIEW" spec="IVW // 0x03" :grow="3" class="relative">
            <!-- Page-level error banner -->
            <div
                v-if="displayError"
                class="flex items-center gap-2 p-3 mb-4 ivw-error"
                role="alert"
            >
                <p class="nc-text-sm ivw-error-text">{{ displayError }}</p>
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
                @retry="onGenerate"
                @restart="onRestart"
            />

            <!-- Concluded: coverage saturated (or question cap hit) — offer generate or continue -->
            <ConcludePanel
                v-else-if="(hasConcluded || reachedCap) && isActive"
                :busy="isBusy"
                :capped="cappedShort"
                @generate="onGenerate"
                @continue="onContinue"
            />

            <DataInputForm v-if="!isActive && !showCompletion" :disabled="isBusy" @continue="onDataContinue" />

            <!-- Active probe: question + answer input -->
            <ProbePanel
                v-else-if="isActive"
                :facet="interviewStore.currentFacet ?? 'story'"
                :question="lastQuestion"
                :is-working="isBusy"
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
                    v-if="isBusy"
                    class="nc-btn nc-btn--danger nc-btn--sm"
                    @click="onAbort"
                >
                    Cancel
                </button>
                <button
                    v-else
                    class="nc-btn nc-btn--danger nc-btn--sm"
                    @click="onRestart"
                >
                    Restart Interview
                </button>
            </div>


            <div v-if="isBusy && !showCompletion" class="ivw-overlay">
                <div class="nc-acquire flex justify-center h-full">
                    <div class="nc-acquire__wave">
                        <div class="nc-acquire__bar" />
                        <div class="nc-acquire__bar" />
                        <div class="nc-acquire__bar" />
                        <div class="nc-acquire__bar" />
                        <div class="nc-acquire__bar" />
                    </div>
                    <div class="nc-acquire__label">ANALYZING · READING SIGNAL</div>
                </div>
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

<style scoped>
.ivw-overlay {
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    border: none;
    background-color: rgba(236, 228, 228, 0.726);
    width: 100%;
    height: 100%;
    margin: auto;
}

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
