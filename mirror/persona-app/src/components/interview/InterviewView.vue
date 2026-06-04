<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Loader2, Menu, X } from "lucide-vue-next";
import { Transcript, Message as ChatMessage, MessageHeader, MessageBody, Composer, TypingIndicator } from "enclosure-vue";
import WelcomeScreen from "./WelcomeScreen.vue";
import DataInputStep from "./DataInputStep.vue";
import CompletionBanner from "./CompletionBanner.vue";
import InterviewStatusPanel from "./InterviewStatusPanel.vue";
import { useSettingsStore } from "../../stores/settingsStore";
import { usePersonaStore } from "../../stores/personaStore";
import { useInterviewStore } from "../../stores/interviewStore";
import { useLicenseStore } from "../../stores/licenseStore";
import { createLLMProvider } from "../../llm";
import {
  buildSystemPrompt,
  INTERVIEW_COMPLETE_SENTINEL,
  type InterviewTier,
} from "../../skills/interviewPrompt";
import {
  buildExtractSystemPrompt,
  buildExtractUserPrompt,
  buildAnalyzeSystemPrompt,
  buildAnalyzeUserPrompt,
  buildPolishSystemPrompt,
  buildPolishUserPrompt,
  FALLBACK_FORMAT_SUFFIX,
} from "../../skills/synthesisPrompts";
import { extractPersonaJSON, extractFencedJSON } from "../../skills/interviewExtractor";
import { synthesizeHowIWorkBest } from "../../skills/profileSynthesizer";
import { readFileAsText } from "../../lib/utils";
import { prepareInputBrief } from "../../skills/dataDigest";
import { logger } from "../../logger";
import { stripNulls, type PersonaJSON } from "../../types/persona";
import {
  EXTRACT_JSON_SCHEMA,
  EXTRACT_SCHEMA_NAME,
  ANALYZE_JSON_SCHEMA,
  ANALYZE_SCHEMA_NAME,
  POLISH_JSON_SCHEMA,
  POLISH_SCHEMA_NAME,
  ExtractDataSchema,
  AnalyzeDataSchema,
  PolishDataSchema,
  mergeSynthesisFragments,
} from "../../skills/personaSchemas";
import type { InterviewMessage } from "../../db/schema";
import type { Message, LLMProvider } from "../../llm/types";

const emit = defineEmits<{
  complete: [section: "insight" | "profile"];
  openPrivacy: [];
}>();

const settings = useSettingsStore();
const personaStore = usePersonaStore();
const interviewStore = useInterviewStore();
const licenseStore = useLicenseStore();

let abortRef: AbortController | null = null;
let synthesisAbortRef: AbortController | null = null;

const showDataInput = ref(false);
const isDigesting = ref(false);
const composerValue = ref("");

// Mobile responsive
const isMobile = ref(false);
const showRightPanel = ref(false);

function onResize() {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) showRightPanel.value = false;
}
onMounted(() => {
  onResize();
  window.addEventListener("resize", onResize);
});
onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});

const interview = computed(() => interviewStore.record);
const streaming = computed(() => !!interviewStore.streamingContent || interviewStore.isThinking);
const isThinking = computed(() => interviewStore.isThinking);
const tier = computed<InterviewTier>(() => (licenseStore.isPro ? "pro" : "free"));

const status = computed(() => interview.value?.status ?? "idle");
const showCompletion = computed(
  () => status.value === "synthesizing" || status.value === "completed" || status.value === "error",
);

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
    const errMsg = e instanceof Error ? e.message : "Failed to analyze input data";
    alert(`Could not analyze your input: ${errMsg}`);
    showDataInput.value = true;
    return;
  }
  isDigesting.value = false;
  await interviewStore.start(brief, inputText, fileNames, wasDigested);
  await sendToLLM([], brief);
}

async function handleUserMessage(text: string) {
  const rec = interviewStore.record;
  if (!rec) return;
  const userMsg: InterviewMessage = {
    role: "user",
    content: text,
    timestamp: new Date().toISOString(),
  };
  await interviewStore.addMessage(userMsg);
  await sendToLLM([...rec.messages, userMsg], rec.initialData);
}

function makeLLM(): LLMProvider {
  return createLLMProvider({
    provider: settings.provider,
    model: settings.model,
    apiKey: settings.apiKey,
    endpoint: settings.endpoint || undefined,
  });
}

async function finalizePersona(persona: PersonaJSON, llm: LLMProvider, t: InterviewTier, signal?: AbortSignal) {
  const rec = interviewStore.record;
  const withSource: PersonaJSON = {
    ...persona,
    source: {
      input_text: rec?.inputText || undefined,
      uploaded_files: rec?.uploadedFileNames?.length ? rec.uploadedFileNames : undefined,
      interview: rec?.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
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

function unwrapCallOutput(raw: unknown, requiredField: string): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;
  if (requiredField in o) return o;
  for (const [, val] of Object.entries(o)) {
    if (val && typeof val === "object" && requiredField in (val as Record<string, unknown>)) {
      return val;
    }
  }
  return o;
}

async function synthesisCall(
  llm: LLMProvider,
  systemPrompt: string,
  userPrompt: string,
  schema: Record<string, unknown>,
  schemaName: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const raw = await llm.structuredComplete(messages, schema, schemaName, signal);
    if (raw != null && typeof raw === "object") return stripNulls(raw);
  } catch (e) {
    if (signal?.aborted) throw e;
    logger.warn("synthesis", `structured output failed (${schemaName}), falling back to plain completion`, { error: e instanceof Error ? e : undefined });
  }

  const text = await llm.complete(
    [
      ...messages.slice(0, -1),
      {
        role: "user" as const,
        content: userPrompt + FALLBACK_FORMAT_SUFFIX,
      },
    ],
    signal,
  );
  const raw = extractFencedJSON(text);
  if (raw != null && typeof raw === "object") return stripNulls(raw);

  throw new Error(
    `${schemaName}: both structured-output and plain-text fallback failed. Raw response: ${text.slice(0, 300)}`,
  );
}

async function synthesisCallWithRetry(
  llm: LLMProvider,
  systemPrompt: string,
  userPrompt: string,
  schema: Record<string, unknown>,
  schemaName: string,
  signal?: AbortSignal,
): Promise<unknown> {
  try {
    return await synthesisCall(llm, systemPrompt, userPrompt, schema, schemaName, signal);
  } catch (e) {
    if (signal?.aborted) throw e;
    logger.warn("synthesis", `${schemaName} first attempt failed; retrying`);
  }
  return synthesisCall(
    llm,
    systemPrompt,
    userPrompt + FALLBACK_FORMAT_SUFFIX,
    schema,
    schemaName,
    signal,
  );
}

async function runSynthesis(messages: InterviewMessage[], initialData: string, llm: LLMProvider, t: InterviewTier) {
  await interviewStore.setStatus("synthesizing");

  const transcript = messages
    .filter((m) => !m.isError)
    .map((m) => `${m.role === "user" ? "User" : "Interviewer"}: ${m.content}`)
    .join("\n\n");

  const controller = new AbortController();
  synthesisAbortRef = controller;
  const signal = controller.signal;

  try {
    interviewStore.setSynthesisPhase("extracting");
    const extractRaw = unwrapCallOutput(
      await synthesisCallWithRetry(
        llm,
        buildExtractSystemPrompt(t),
        buildExtractUserPrompt(initialData, transcript),
        EXTRACT_JSON_SCHEMA,
        EXTRACT_SCHEMA_NAME,
        signal,
      ),
      "identity",
    );
    const extractResult = ExtractDataSchema.safeParse(extractRaw);
    if (!extractResult.success) {
      const first = extractResult.error.issues[0];
      throw new Error(
        `Extract phase — ${first.path.length ? first.path.join(".") : "(root)"}: ${first.message}`,
      );
    }

    interviewStore.setSynthesisPhase("analyzing");
    const analyzeRaw = unwrapCallOutput(
      await synthesisCallWithRetry(
        llm,
        buildAnalyzeSystemPrompt(t),
        buildAnalyzeUserPrompt(
          initialData,
          transcript,
          extractResult.data as Record<string, unknown>,
        ),
        ANALYZE_JSON_SCHEMA,
        ANALYZE_SCHEMA_NAME,
        signal,
      ),
      "strengths",
    );
    const analyzeResult = AnalyzeDataSchema.safeParse(analyzeRaw);
    if (!analyzeResult.success) {
      const first = analyzeResult.error.issues[0];
      throw new Error(
        `Analyze phase — ${first.path.length ? first.path.join(".") : "(root)"}: ${first.message}`,
      );
    }

    interviewStore.setSynthesisPhase("polishing");
    const polishRaw = unwrapCallOutput(
      await synthesisCallWithRetry(
        llm,
        buildPolishSystemPrompt(t),
        buildPolishUserPrompt(
          initialData,
          transcript,
          extractResult.data as Record<string, unknown>,
          analyzeResult.data as Record<string, unknown>,
        ),
        POLISH_JSON_SCHEMA,
        POLISH_SCHEMA_NAME,
        signal,
      ),
      "use_cases",
    );
    const polishResult = PolishDataSchema.safeParse(polishRaw);
    if (!polishResult.success) {
      const first = polishResult.error.issues[0];
      throw new Error(
        `Polish phase — ${first.path.length ? first.path.join(".") : "(root)"}: ${first.message}`,
      );
    }

    interviewStore.setSynthesisPhase("finalizing");
    const persona = mergeSynthesisFragments(
      extractResult.data,
      analyzeResult.data,
      polishResult.data,
    );
    await finalizePersona(persona, llm, t, signal);
  } catch (e) {
    if (signal.aborted) {
      await interviewStore.failSynthesis("Synthesis was cancelled.");
      return;
    }
    const msg = e instanceof Error ? e.message : "Unknown synthesis error";
    logger.error("synthesis", "three-phase synthesis failed", { error: e instanceof Error ? e : undefined });
    await interviewStore.failSynthesis(msg);
  } finally {
    synthesisAbortRef = null;
    interviewStore.setSynthesisPhase(null);
  }
}

async function sendToLLM(messages: InterviewMessage[], initialData: string) {
  const llm = makeLLM();
  const systemMsg: Message = {
    role: "system",
    content: buildSystemPrompt(initialData, tier.value),
  };
  const history: Message[] = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const controller = new AbortController();
  abortRef = controller;

  interviewStore.setThinking(true);
  let accumulated = "";
  try {
    for await (const chunk of llm.streamChat([systemMsg, ...history], controller.signal)) {
      accumulated += chunk;
      interviewStore.setStreaming(accumulated);
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") {
      const errMsg = e instanceof Error ? e.message : "LLM error";
      interviewStore.setStreaming("");
      await interviewStore.addMessage({
        role: "assistant",
        content: errMsg,
        timestamp: new Date().toISOString(),
        isError: true,
      });
      return;
    }
  } finally {
    abortRef = null;
    interviewStore.setThinking(false);
  }

  if (!accumulated) return;

  const hasSentinel = accumulated.includes(INTERVIEW_COMPLETE_SENTINEL);
  const display = hasSentinel
    ? accumulated.split(INTERVIEW_COMPLETE_SENTINEL).join("").trim()
    : accumulated;

  const assistantMsg: InterviewMessage = {
    role: "assistant",
    content: display || "That's everything I needed — building your profile now.",
    timestamp: new Date().toISOString(),
  };
  await interviewStore.addMessage(assistantMsg);

  if (hasSentinel) {
    const rec = interviewStore.record;
    await runSynthesis(rec?.messages ?? messages, initialData, llm, tier.value);
    return;
  }

  const inline = extractPersonaJSON(accumulated);
  if (inline) {
    await interviewStore.setStatus("synthesizing");
    await finalizePersona(inline, llm, tier.value);
  }
}

function handleAbort() {
  abortRef?.abort();
  synthesisAbortRef?.abort();
}

async function handleRestart() {
  await interviewStore.clear();
}

async function handleRetrySynthesis() {
  const rec = interviewStore.record;
  if (!rec) return;
  await runSynthesis(rec.messages, rec.initialData, makeLLM(), tier.value);
}

function confirmRestart() {
  if (confirm("Clear the interview and start over?")) handleRestart();
}
</script>

<template>
  <!-- Data input step (full width) -->
  <DataInputStep v-if="showDataInput" @continue="handleDataContinue" />

  <!-- Digesting (full width) -->
  <div
    v-else-if="isDigesting"
    class="flex flex-col items-center justify-center"
    style="gap: var(--nc-space-3); color: var(--nc-ink-2); padding: var(--nc-space-12) var(--nc-space-6);"
  >
    <Loader2 :size="24" class="animate-spin" style="color: var(--nc-accent);" />
    <p class="nc-text-sm">Analyzing your background…</p>
  </div>

  <!-- Welcome / idle (full width) -->
  <WelcomeScreen
    v-else-if="status === 'idle' || !interview"
    @start="handleStart"
    @import="handleImport"
    @open-privacy="emit('openPrivacy')"
  />

  <!-- Active interview / completion — two-cell layout -->
  <div
    v-else
    class="grid h-full overflow-hidden"
    :style="{
      gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 2fr) minmax(0, 1fr)',
      gap: 'var(--nc-seam-width)',
      background: 'var(--nc-seam-fill)',
    }"
  >
    <!-- Left cell: chat / completion -->
    <div
      class="flex flex-col overflow-hidden min-h-0"
      style="
        background: var(--nc-panel);
        padding: var(--nc-space-3);
        gap: var(--nc-space-3);
        box-shadow: inset 1px 1px 0 var(--nc-seam-highlight), inset -1px -1px 0 var(--nc-seam-shadow);
      "
    >
      <div v-if="showCompletion" class="flex flex-col flex-1 min-h-0 overflow-y-auto">
        <Transcript>
          <ChatMessage
            v-for="(msg, i) in interview?.messages ?? []"
            :key="i"
            :variant="msg.role === 'user' ? 'user' : msg.isError ? 'error' : 'assistant'"
          >
            <MessageHeader>
              <template #default>{{ msg.role === 'user' ? 'You' : 'Persona' }}</template>
            </MessageHeader>
            <MessageBody>{{ msg.content }}</MessageBody>
          </ChatMessage>
          <ChatMessage v-if="interviewStore.streamingContent" variant="assistant">
            <MessageHeader><template #default>Persona</template></MessageHeader>
            <MessageBody>{{ interviewStore.streamingContent }}</MessageBody>
          </ChatMessage>
          <TypingIndicator v-if="isThinking && !interviewStore.streamingContent" label="PERSONA TYPING" />
        </Transcript>
        <div style="padding: var(--nc-space-6) var(--nc-space-4) var(--nc-space-8);">
          <CompletionBanner
            :status="(status as 'synthesizing' | 'completed' | 'error')"
            :persona-name="personaStore.persona?.data.persona.identity.name"
            :error-message="interview?.synthesisError"
            :synthesis-phase="interviewStore.synthesisPhase"
            @go-insight="emit('complete', 'insight')"
            @go-profile="emit('complete', 'profile')"
            @retry="handleRetrySynthesis"
            @restart="handleRestart"
          />
        </div>
      </div>

      <!-- Chat fills the cell; composer is pinned to the bottom -->
      <template v-else>
        <Transcript class="flex-1 min-h-0">
          <ChatMessage
            v-for="(msg, i) in interview?.messages ?? []"
            :key="i"
            :variant="msg.role === 'user' ? 'user' : msg.isError ? 'error' : 'assistant'"
          >
            <MessageHeader>
              <template #default>{{ msg.role === 'user' ? 'You' : 'Persona' }}</template>
            </MessageHeader>
            <MessageBody>{{ msg.content }}</MessageBody>
          </ChatMessage>
          <ChatMessage v-if="interviewStore.streamingContent" variant="assistant">
            <MessageHeader><template #default>Persona</template></MessageHeader>
            <MessageBody>{{ interviewStore.streamingContent }}</MessageBody>
          </ChatMessage>
          <TypingIndicator v-if="isThinking && !interviewStore.streamingContent" label="PERSONA TYPING" />
        </Transcript>

        <div class="shrink-0 flex items-end" style="gap: var(--nc-space-2);">
          <button
            v-if="isMobile"
            class="nc-btn nc-btn--ghost nc-btn--sm"
            style="flex-shrink: 0;"
            @click="showRightPanel = true"
          >
            <Menu :size="16" />
          </button>
          <Composer
            v-model="composerValue"
            :placeholder="streaming ? 'Waiting for response…' : 'Type a message… (Enter to send, Shift+Enter for new line)'"
            :disabled="status !== 'active'"
            class="flex-1"
            @send="handleUserMessage"
          >
            <template #send-label>Send</template>
          </Composer>
          <button
            v-if="streaming"
            class="nc-btn nc-btn--danger nc-btn--sm"
            style="flex-shrink: 0;"
            @click="handleAbort"
          >
            Stop
          </button>
        </div>
      </template>
    </div>

    <!-- Right cell: status panel (desktop) -->
    <div
      v-if="!isMobile"
      class="flex flex-col overflow-y-auto"
      style="
        background: var(--nc-panel);
        padding: var(--nc-space-5);
        gap: var(--nc-space-5);
        box-shadow: inset 1px 1px 0 var(--nc-seam-highlight), inset -1px -1px 0 var(--nc-seam-shadow);
      "
    >
      <InterviewStatusPanel
        :interview="interview"
        :status="status"
        :show-completion="showCompletion"
        @import="handleImport"
        @restart="confirmRestart"
      />
    </div>

    <!-- Mobile overlay: right panel -->
    <template v-if="isMobile && showRightPanel">
      <div
        class="fixed inset-0 z-30"
        style="background: rgba(0,0,0,0.35);"
        @click="showRightPanel = false"
      />
      <div
        class="fixed top-0 right-0 bottom-0 z-40 w-72 overflow-y-auto"
        style="
          background: var(--nc-panel);
          padding: var(--nc-space-5);
          box-shadow: -4px 0 24px rgba(0,0,0,0.3);
        "
      >
        <button
          class="nc-btn nc-btn--ghost nc-btn--sm"
          style="margin-bottom: var(--nc-space-4);"
          @click="showRightPanel = false"
        >
          <X :size="14" />
          Close
        </button>
        <InterviewStatusPanel
          :interview="interview"
          :status="status"
          :show-completion="showCompletion"
          @import="handleImport"
          @restart="confirmRestart"
        />
      </div>
    </template>
  </div>
</template>
