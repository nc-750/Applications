<script setup lang="ts">
import { computed } from "vue";
import { Loader2, RotateCcw, AlertTriangle } from "lucide-vue-next";
import CompletedPanel from "./CompletedPanel.vue";

const props = defineProps<{
  status: "synthesizing" | "completed" | "error";
  personaName?: string;
  errorMessage?: string;
  synthesisPhase?: string | null;
}>();

const emit = defineEmits<{
  goInsight: [];
  goProfile: [];
  retry: [];
  restart: [];
}>();

const phaseLabels: Record<string, string> = {
  extracting: "Extracting facts from your interview…",
  analyzing: "Analyzing patterns and strengths…",
  polishing: "Writing your professional profile…",
  finalizing: "Finalizing your persona…",
};

const phaseDetails: Record<string, string> = {
  extracting: "Identifying key facts from your conversation.",
  analyzing: "Surfacing hidden strengths and growth areas.",
  polishing: "Crafting CV, LinkedIn, and interview content.",
  finalizing: "Putting everything together.",
};

const phaseLabel = computed(() => phaseLabels[props.synthesisPhase ?? ""] ?? "Building your profile…");
const phaseDetail = computed(
  () => phaseDetails[props.synthesisPhase ?? ""] ?? "Synthesising your data, one moment.",
);
</script>

<template>
  <!-- Error -->
  <div
    v-if="status === 'error'"
    class="flex flex-col items-center justify-center text-center py-12 px-6 comp-error"
    role="alert"
  >
    <AlertTriangle :size="32" class="comp-icon" aria-hidden="true" />
    <div>
      <p class="nc-text-md nc-font-semibold comp-title">Couldn't build your profile</p>
      <p class="nc-text-sm nc-text-secondary max-w-sm comp-sub">
        {{ errorMessage ? `Synthesis failed — ${errorMessage}` : "Something went wrong while building your profile." }}
        Your interview answers are saved, so you can try again.
      </p>
    </div>
    <div class="flex flex-col gap-3">
      <button class="nc-btn nc-btn--accent justify-center" @click="emit('retry')">
        <RotateCcw :size="15" aria-hidden="true" />
        Try again
      </button>
      <button class="nc-btn nc-btn--secondary justify-center" @click="emit('restart')">
        Start over
      </button>
    </div>
  </div>

  <!-- Synthesizing -->
  <div
    v-else-if="status === 'synthesizing'"
    class="flex flex-col items-center justify-center text-center gap-4 py-12 h-full"
  >
    <Loader2 :size="32" class="animate-spin nc-text--accent" aria-hidden="true" />
    <div aria-live="polite" aria-atomic="true">
      <p class="nc-text-md nc-font-semibold comp-title">{{ phaseLabel }}</p>
      <p class="nc-text-sm nc-text-secondary comp-detail">{{ phaseDetail }}</p>
    </div>
  </div>

  <!-- Completed -->
  <CompletedPanel 
    v-if="status === 'completed'"
    :personaName="personaName"
    @restart="emit('restart')"
  />
</template>

<style scoped>
/* kept: no .nc-* class for subtitle top-margin + line-height */
.comp-sub {
    margin-top: var(--nc-space-2);
    line-height: var(--nc-leading-relaxed);
}

/* kept: no .nc-* class for detail top-margin */
.comp-detail {
    margin-top: var(--nc-space-1);
}

/* kept: no .nc-* class for error-section gap */
.comp-error {
    gap: var(--nc-space-5);
}

.comp-restart:focus-visible {
    outline: 2px solid var(--nc-accent);
    outline-offset: 2px;
}
</style>
