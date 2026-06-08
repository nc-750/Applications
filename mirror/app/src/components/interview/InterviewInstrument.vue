<script setup lang="ts">
// The interview, rebuilt as an instrument (DESIGN_USE §10). A single nc-chassis:
// a live dark readout + a one-directional probe (working band) over a collapsing
// session log. The accumulating reading is the hero; the dialogue is demoted.
//
// Same markup for all form factors — desktop/tablet vs mobile differ by CSS
// (app.css media queries) only; the readout's `minimal` prop is the sole
// form-factor branch.
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Loader2 } from "lucide-vue-next";
import { Band, Cell, CellHead } from "lab-vue";
import DataInputStep from "./DataInputStep.vue";
import CompletionBanner from "./CompletionBanner.vue";
import ReadoutPanel from "./ReadoutPanel.vue";
import ProbeCell from "./ProbeCell.vue";
import SessionLogCell from "./SessionLogCell.vue";
import ConcludeCell from "./ConcludeCell.vue";
import { useSettingsStore } from "../../stores/settingsStore";
import { usePersonaStore } from "../../stores/personaStore";
import { useInterviewStore } from "../../stores/interviewStore";
import { useLicenseStore } from "../../stores/licenseStore";
import { createLLMProvider } from "../../llm";
import type { LLMProvider } from "../../llm/types";
import type { InterviewTier } from "../../skills/interviewPrompt";
import { synthesizePersona } from "../../skills/synthesize";
import { synthesizeHowIWorkBest } from "../../skills/profileSynthesizer";
import { prepareInputBrief } from "../../skills/dataDigest";
import { readFileAsText } from "../../lib/utils";
import { logger } from "../../logger";
import type { PersonaJSON } from "../../types/persona";

const emit = defineEmits<{ complete: [section: "insight" | "profile"]; openPrivacy: [] }>();

const settings = useSettingsStore();
const personaStore = usePersonaStore();
const interviewStore = useInterviewStore();
const licenseStore = useLicenseStore();

const showDataInput = ref(false);
const isDigesting = ref(false);
// Set true when the user asks to keep going past conclusion (shows a probe
// again instead of the conclude state, until the next answer).
const keepGoing = ref(false);
let synthAbort: AbortController | null = null;

const isMobile = ref(false);
function onResize() {
  // Match Lab's nc-band stacking breakpoint (640px) so the readout condenses
  // exactly when the bands stack.
  isMobile.value = window.innerWidth <= 640;
}
onMounted(() => {
  onResize();
  window.addEventListener("resize", onResize);
});
onUnmounted(() => window.removeEventListener("resize", onResize));

const interview = computed(() => interviewStore.record);
const status = computed(() => interview.value?.status ?? "idle");
const tier = computed<InterviewTier>(() => (licenseStore.isPro ? "pro" : "free"));
const showCompletion = computed(
  () => status.value === "synthesizing" || status.value === "completed" || status.value === "error",
);

// The active probe question: the live stream, or the last committed question.
const lastAssistant = computed(
  () => [...(interview.value?.messages ?? [])].reverse().find((m) => m.role === "assistant" && !m.isError)?.content ?? "",
);
const activeQuestion = computed(() => interviewStore.streamingContent || lastAssistant.value);
const questionStreaming = computed(() => interviewStore.isThinking || !!interviewStore.streamingContent);
const showConclude = computed(() => interviewStore.concluded && !keepGoing.value);

function makeLLM(): LLMProvider {
  return createLLMProvider({
    provider: settings.provider,
    model: settings.model,
    apiKey: settings.apiKey,
    endpoint: settings.endpoint || undefined,
  });
}

function handleStart() {
  if (!settings.isConfigured()) {
    alert("Please configure your AI provider in Settings before starting.");
    return;
  }
  showDataInput.value = true;
}

async function handleImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      await personaStore.importFromJSON(text);
      emit("complete", "insight");
    } catch (e) {
      alert(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  input.click();
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
    alert(`Could not analyze your input: ${e instanceof Error ? e.message : "Failed to analyze input data"}`);
    showDataInput.value = true;
    return;
  }
  isDigesting.value = false;
  await interviewStore.beginInterview(brief, inputText, fileNames, wasDigested);
}

async function handleSubmit(answer: string) {
  keepGoing.value = false;
  await interviewStore.submitAnswer(answer);
}

async function handleContinue() {
  keepGoing.value = true;
  await interviewStore.probeMore();
}

async function finalizePersona(persona: PersonaJSON, llm: LLMProvider, t: InterviewTier, signal?: AbortSignal) {
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
    const howIWorkBest = await synthesizeHowIWorkBest(withSource, llm, t, signal);
    await personaStore.save(withSource, howIWorkBest);
  } catch {
    if (signal?.aborted) return;
    await personaStore.save(withSource, []);
  }
  await interviewStore.setStatus("completed");
}

async function runSynthesis() {
  const rec = interview.value;
  if (!rec) return;
  await interviewStore.setStatus("synthesizing");
  const llm = makeLLM();
  const controller = new AbortController();
  synthAbort = controller;
  try {
    const persona = await synthesizePersona({
      llm,
      tier: tier.value,
      initialData: rec.initialData,
      messages: rec.messages,
      signal: controller.signal,
      onPhase: (p) => interviewStore.setSynthesisPhase(p),
    });
    await finalizePersona(persona, llm, tier.value, controller.signal);
  } catch (e) {
    if (controller.signal.aborted) {
      await interviewStore.failSynthesis("Synthesis was cancelled.");
      return;
    }
    logger.error("synthesis", "three-phase synthesis failed", { error: e instanceof Error ? e : undefined });
    await interviewStore.failSynthesis(e instanceof Error ? e.message : "Unknown synthesis error");
  } finally {
    synthAbort = null;
    interviewStore.setSynthesisPhase(null);
  }
}

function handleAbort() {
  interviewStore.abort();
  synthAbort?.abort();
}

async function handleRestart() {
  if (confirm("Clear the interview and start over?")) {
    keepGoing.value = false;
    await interviewStore.clear();
  }
}
</script>

<template>
  <Band>
    <!-- Pre-interview flows are full-width (no chassis) -->
  <DataInputStep v-if="showDataInput" @continue="handleDataContinue" />

  <div
    v-else-if="isDigesting"
    class="flex flex-col items-center justify-center"
    style="gap: var(--nc-space-3); color: var(--nc-ink-2); padding: var(--nc-space-12) var(--nc-space-6);"
  >
    <Loader2 :size="24" class="animate-spin" style="color: var(--nc-accent);" />
    <p class="nc-text-sm">Analyzing your background…</p>
  </div>

  <!-- The instrument (bands fill the shell's content area) -->
  <div v-else class="mr-interview">
    <!-- Working band: readout + probe -->
    <div class="nc-band mr-band-work">
      <section class="nc-cell mr-cell-readout">
        <CellHead>
          <template #title><span class="nc-label">Subject reading</span></template>
          <template #spec>// 0x00 · LIVE</template>
        </CellHead>
        <ReadoutPanel
          :coverage="interviewStore.coverage"
          :probe-signal="interviewStore.probeSignal"
          :acquiring="interviewStore.acquiring"
          :minimal="isMobile"
        />
      </section>

      <section class="nc-cell nc-cell--grow-2 mr-cell-probe">
        <!-- Synthesis / completion -->
        <template v-if="showCompletion">
          <CellHead>
            <template #title><span class="nc-label">Profile</span></template>
            <template #spec>// SYNTHESIS</template>
          </CellHead>
          <CompletionBanner
            :status="(status as 'synthesizing' | 'completed' | 'error')"
            :persona-name="personaStore.persona?.data.persona.identity.name"
            :error-message="interview?.synthesisError"
            :synthesis-phase="interviewStore.synthesisPhase"
            @go-insight="emit('complete', 'insight')"
            @go-profile="emit('complete', 'profile')"
            @retry="runSynthesis"
            @restart="handleRestart"
          />
        </template>

        <!-- Active probe or conclude -->
        <template v-else>
          <CellHead>
            <template #title>
              <span class="nc-label">{{ showConclude ? "Converged" : "Active probe" }}</span>
            </template>
            <template #spec>// {{ interviewStore.currentFacet.toUpperCase() }}</template>
          </CellHead>

          <ConcludeCell
            v-if="showConclude"
            :busy="status === 'synthesizing'"
            :phase="interviewStore.synthesisPhase"
            @generate="runSynthesis"
            @continue="handleContinue"
          />
          <ProbeCell
            v-else
            :facet="interviewStore.currentFacet"
            :question="activeQuestion"
            :streaming="questionStreaming"
            :acquiring="interviewStore.acquiring"
            @submit="handleSubmit"
          />
        </template>
      </section>
    </div>

    <!-- Log band -->
    <div class="nc-band mr-band-log">
      <section class="nc-cell">
        <CellHead>
          <template #title><span class="nc-label">Session log</span></template>
          <template #spec>APPEND-ONLY · 0x00</template>
        </CellHead>
        <SessionLogCell :messages="interview?.messages ?? []" />
      </section>
    </div>

    <!-- Stop control while a probe streams -->
    <div v-if="questionStreaming" class="mr-interview__abort">
      <button class="nc-btn nc-btn--danger nc-btn--sm" @click="handleAbort">Stop</button>
    </div>
  </div>
  </Band>
</template>
