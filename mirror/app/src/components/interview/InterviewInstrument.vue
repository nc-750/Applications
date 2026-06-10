<script setup lang="ts">
// The interview, rebuilt as an instrument (DESIGN_USE §10). A single nc-chassis:
// a live dark readout + a one-directional probe (working band) over a collapsing
// session log. The accumulating reading is the hero; the dialogue is demoted.
//
// Same markup for all form factors — desktop/tablet vs mobile differ by CSS
// (app.css media queries) only; the readout's `minimal` prop is the sole
// form-factor branch.
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { Loader2 } from "lucide-vue-next";
import { Band, Cell, MonitorCell } from "@nc-750/lab-vue";
import DataInputStep from "./DataInputStep.vue";
import CompletionBanner from "./CompletionBanner.vue";
import ReadoutPanel from "./ReadoutPanel.vue";
import ProbeCell from "./ProbeCell.vue";
import SessionLogCell from "./SessionLogCell.vue";
import ConcludeCell from "./ConcludeCell.vue";
import { createLLMClient, type LLMClient } from "@nc-750/llm-ts";
import { useMirrorStore } from "../../stores/mirror";
import { useInterview } from "../../composables/useInterview";
import { synthesizePersona } from "../../skills/synthesize";
import { synthesizeHowIWorkBest } from "../../skills/profileSynthesizer";
import { prepareInputBrief } from "../../skills/dataDigest";
import { logger } from "../../logger";
import type { PersonaJSON } from "../../types/persona";

const mirrorStore = useMirrorStore();
const router = useRouter();
const interviewApi = useInterview(mirrorStore);

const showDataInput = ref(false);
const isDigesting = ref(false);
const digestError = ref("");
// Set true when the user asks to keep going past conclusion (shows a probe
// again instead of the conclude state, until the next answer).
const keepGoing = ref(false);
const showRestartConfirm = ref(false);
let synthAbort: AbortController | null = null;

const isMobile = ref(false);
function onResize() {
  // Match Lab's nc-band stacking breakpoint (640px) so the readout condenses
  // exactly when the bands stack.
  isMobile.value = window.innerWidth <= 640;
}
onMounted(async () => {
  onResize();
  window.addEventListener("resize", onResize);
  // Load any existing interview from IndexedDB and decide what to show.
  await mirrorStore.loadInterview();
  if (!mirrorStore.record) {
    showDataInput.value = true;
  }
});
onUnmounted(() => window.removeEventListener("resize", onResize));

const interview = computed(() => mirrorStore.record);
const status = computed(() => interview.value?.status ?? "idle");
const showCompletion = computed(
  () => status.value === "synthesizing" || status.value === "completed" || status.value === "error",
);

// The active probe question: the last committed question (question text only).
const activeQuestion = computed(
  () => [...(interview.value?.messages ?? [])].reverse().find((m) => m.role === "assistant" && !m.isError)?.content ?? "",
);
const showConclude = computed(() => mirrorStore.concluded && !keepGoing.value);

function makeLLM(): LLMClient {
  const config = mirrorStore.llmConfig;
  if (!config) throw new Error("LLM not configured");
  const result = createLLMClient({
    provider: config.provider,
    model: config.model,
    keyProvider: async () => config.apiKey,
    baseUrl: config.endpoint,
  });
  if (!result.ok) throw new Error(`Failed to create LLM client: ${result.error.message}`);
  return result.value;
}

async function handleDataContinue(rawData: string, inputText: string, fileNames: string[]) {
  showDataInput.value = false;
  isDigesting.value = true;
  const llm = makeLLM();
  let brief: string;
  let wasDigested: boolean;
  try {
    ({ brief, wasDigested } = await prepareInputBrief(rawData, llm));
  } catch (e) {
    isDigesting.value = false;
    digestError.value = `Could not analyze your input: ${e instanceof Error ? e.message : "Failed to analyze input data"}`;
    showDataInput.value = true;
    return;
  }
  isDigesting.value = false;
  await interviewApi.beginInterview(brief, inputText, fileNames, wasDigested);
}

async function handleSubmit(answer: string) {
  logger.debug("app", "Handle Submit");
  keepGoing.value = false;
  await interviewApi.submitAnswer(answer);
}

async function handleContinue() {
  keepGoing.value = true;
  await interviewApi.probeMore();
}

async function finalizePersona(persona: PersonaJSON, llm: LLMClient, signal?: AbortSignal) {
  const rec = interview.value;
  const withSource: PersonaJSON = {
    ...persona,
    source: {
      input_text: rec?.inputText || undefined,
      uploaded_files: rec?.uploadedFileNames?.length ? rec.uploadedFileNames : undefined,
      interview: rec?.messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
    },
  };
  try {
    const howIWorkBest = await synthesizeHowIWorkBest(withSource, llm, signal);
    await mirrorStore.savePersona(withSource, howIWorkBest);
  } catch {
    if (signal?.aborted) return;
    await mirrorStore.savePersona(withSource, []);
  }
  await mirrorStore.setStatus("completed");
}

async function runSynthesis() {
  const rec = interview.value;
  if (!rec) return;
  await mirrorStore.setStatus("synthesizing");
  const llm = makeLLM();
  const controller = new AbortController();
  synthAbort = controller;
  try {
    const persona = await synthesizePersona({
      llm,
      initialData: rec.initialData,
      messages: rec.messages,
      signal: controller.signal,
      onPhase: (p) => mirrorStore.setSynthesisPhase(p),
    });
    await finalizePersona(persona, llm, controller.signal);
  } catch (e) {
    if (controller.signal.aborted) {
      await mirrorStore.failSynthesis("Synthesis was cancelled.");
      return;
    }
    logger.error("synthesis", "three-phase synthesis failed", { error: e instanceof Error ? e : undefined });
    await mirrorStore.failSynthesis(e instanceof Error ? e.message : "Unknown synthesis error");
  } finally {
    synthAbort = null;
    mirrorStore.setSynthesisPhase(null);
  }
}

function handleAbort() {
  interviewApi.abort();
  synthAbort?.abort();
}

function handleRestart() {
  showRestartConfirm.value = true;
}

async function confirmRestart() {
  showRestartConfirm.value = false;
  keepGoing.value = false;
  await mirrorStore.clearInterview();
}

function cancelRestart() {
  showRestartConfirm.value = false;
}
</script>

<template>
  <Band :grow="1">
    <MonitorCell title="DATA ANALYSIS" spec="IVW // 0x01">
      <ReadoutPanel
        :coverage="mirrorStore.coverage"
        :probe-signal="mirrorStore.probeSignal"
        :acquiring="mirrorStore.working"
        :context="mirrorStore.latestContext"
        :minimal="isMobile"
      />
    </MonitorCell>
    <Cell title="DATA INPUT" spec="IVW // 0x02">
      <!-- Pre-interview flows are full-width (no chassis) -->
      <div v-if="digestError" role="alert" class="mr-digest-error">
        <p class="nc-text-sm">{{ digestError }}</p>
        <button class="nc-btn nc-btn--ghost nc-btn--sm" @click="digestError = ''">Dismiss</button>
      </div>
      <DataInputStep v-if="showDataInput" @continue="handleDataContinue" />
      <div v-else-if="isDigesting" class="mr-digesting">
        <Loader2 :size="24" class="animate-spin mr-digesting__spinner" />
        <p class="nc-text-sm">Analyzing your background…</p>
      </div>

      <div v-else>
      <!-- Working band: readout + probe -->
      

        <!-- Synthesis / completion -->
        <div v-if="showCompletion">
          <CompletionBanner
            :status="(status as 'synthesizing' | 'completed' | 'error')"
            :persona-name="mirrorStore.persona?.data.persona.identity.name"
            :error-message="interview?.synthesisError"
            :synthesis-phase="mirrorStore.synthesisPhase"
            @go-insight="router.push('/insight')"
            @go-profile="router.push('/profile')"
            @retry="runSynthesis"
            @restart="handleRestart"
          />
        </div>
        <ConcludeCell
          v-if="showConclude"
          :busy="status === 'synthesizing'"
          :phase="mirrorStore.synthesisPhase"
          @generate="runSynthesis"
          @continue="handleContinue"
        />
        <ProbeCell
          v-else
          :facet="mirrorStore.currentFacet"
          :question="activeQuestion"
          :working="mirrorStore.working"
          @submit="handleSubmit"
        />
        <!-- Restart confirmation bar -->
        <div v-if="showRestartConfirm" class="mr-restart-confirm">
          <p class="nc-text-sm">Clear the interview and start over?</p>
          <div class="mr-restart-confirm__actions">
            <button class="nc-btn nc-btn--danger nc-btn--sm" @click="confirmRestart">Clear interview</button>
            <button class="nc-btn nc-btn--secondary nc-btn--sm" @click="cancelRestart">Cancel</button>
          </div>
        </div>
        <div v-if="mirrorStore.working" class="mr-interview__abort">
          <button class="nc-btn nc-btn--danger nc-btn--sm" @click="handleAbort">Stop</button>
        </div>
      </div>
    </Cell>
  </Band>
  <Band class="mr-band-log">
    <Cell title="SESSION LOG" spec="IVW // 0x03">
      <SessionLogCell :messages="interview?.messages ?? []" />
    </Cell>
  </Band>
</template>

<style scoped>
.mr-interview {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: var(--nc-seam-width);
    background: var(--nc-seam-fill);
}
.mr-band-work {
    flex: 1 1 auto;
    min-height: 0;
}
.mr-band-log {
    flex: 0 0 auto;
    max-height: 32vh;
    min-height: 0;
}
.mr-band-log :deep(.nc-cell) {
    max-height: 32vh;
    min-height: 0;
    display: flex;
    flex-direction: column;
}
/* Scroll the entries, keep the cell header pinned. */
.mr-band-log :deep(.nc-cell-content) {
    overflow-y: auto;
    min-height: 0;
}
.mr-cell-readout,
.mr-cell-probe {
    display: flex;
    flex-direction: column;
    gap: var(--nc-space-4);
    min-height: 0;
    overflow: hidden;
}
.mr-cell-probe > .mr-probe,
.mr-cell-readout > .mr-readout {
    flex: 1 1 auto;
    min-height: 0;
}
.mr-interview__abort {
    position: absolute;
    right: var(--nc-space-4);
    bottom: var(--nc-space-4);
    z-index: 5;
}
.mr-digesting {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--nc-space-3);
    color: var(--nc-ink-2);
    padding: var(--nc-space-12) var(--nc-space-6);
}
.mr-digesting__spinner {
    color: var(--nc-accent);
}

/* Digest error alert */
.mr-digest-error {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--nc-space-3);
    padding: var(--nc-space-3) var(--nc-space-4);
    margin: var(--nc-space-4) var(--nc-space-4) 0;
    background: var(--nc-panel-1);
    border: var(--nc-border-width) solid var(--nc-error);
    border-radius: var(--nc-radius-md);
    color: var(--nc-error);
}

/* Restart confirmation bar */
.mr-restart-confirm {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--nc-space-4);
    padding: var(--nc-space-3) var(--nc-space-4);
    background: var(--nc-panel-1);
    border: var(--nc-border-width) solid var(--nc-line-strong);
    border-radius: var(--nc-radius-md);
    color: var(--nc-ink);
}
.mr-restart-confirm__actions {
    display: flex;
    gap: var(--nc-space-2);
    flex-shrink: 0;
}

/* Mobile responsive rules */
@media (max-width: 640px) {
    .mr-band-work > .mr-cell-readout {
        flex: 0 0 auto;
    }
    .mr-band-work > .mr-cell-probe {
        flex: 1 1 auto;
    }
    .mr-band-log,
    .mr-band-log :deep(.nc-cell) {
        max-height: 40vh;
    }
    .mr-restart-confirm {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
