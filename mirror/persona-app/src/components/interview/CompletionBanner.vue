<script setup lang="ts">
import { computed } from "vue";
import { CheckCircle, Loader2, User, Globe, RotateCcw, AlertTriangle } from "lucide-vue-next";

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
    class="flex flex-col items-center justify-center"
    :style="{ gap: 'var(--nc-space-5)', padding: 'var(--nc-space-12) 0', textAlign: 'center', paddingLeft: 'var(--nc-space-6)', paddingRight: 'var(--nc-space-6)' }"
  >
    <AlertTriangle :size="32" :style="{ color: 'var(--nc-accent)' }" aria-hidden="true" />
    <div>
      <p class="nc-text-md nc-font-semibold" :style="{ color: 'var(--nc-ink)' }">Couldn't build your profile</p>
      <p
        class="nc-text-sm nc-text-secondary"
        :style="{ marginTop: 'var(--nc-space-2)', maxWidth: '24rem', lineHeight: 'var(--nc-leading-relaxed)' }"
      >
        {{ errorMessage ? `Synthesis failed — ${errorMessage}` : "Something went wrong while building your profile." }}
        Your interview answers are saved, so you can try again.
      </p>
    </div>
    <div class="flex flex-col" :style="{ gap: 'var(--nc-space-3)' }">
      <button class="nc-btn nc-btn--accent" :style="{ justifyContent: 'center' }" @click="emit('retry')">
        <RotateCcw :size="15" aria-hidden="true" />
        Try again
      </button>
      <button class="nc-btn nc-btn--secondary" :style="{ justifyContent: 'center' }" @click="emit('restart')">
        Start over
      </button>
    </div>
  </div>

  <!-- Synthesizing -->
  <div
    v-else-if="status === 'synthesizing'"
    class="flex flex-col items-center justify-center"
    :style="{ gap: 'var(--nc-space-4)', padding: 'var(--nc-space-12) 0', textAlign: 'center' }"
  >
    <Loader2 :size="32" class="animate-spin" :style="{ color: 'var(--nc-accent)' }" aria-hidden="true" />
    <div>
      <p class="nc-text-md nc-font-semibold" :style="{ color: 'var(--nc-ink)' }">{{ phaseLabel }}</p>
      <p class="nc-text-sm nc-text-secondary" :style="{ marginTop: 'var(--nc-space-1)' }">{{ phaseDetail }}</p>
    </div>
  </div>

  <!-- Completed -->
  <div
    v-else
    class="flex flex-col items-center justify-center"
    :style="{ gap: 'var(--nc-space-6)', padding: 'var(--nc-space-12) 0', textAlign: 'center', paddingLeft: 'var(--nc-space-6)', paddingRight: 'var(--nc-space-6)' }"
  >
    <CheckCircle :size="36" :style="{ color: 'var(--nc-accent)' }" aria-hidden="true" />

    <div>
      <p class="nc-text-lg nc-font-semibold" :style="{ color: 'var(--nc-ink)' }">
        {{ personaName ? `${personaName}'s persona is ready` : "Persona ready" }}
      </p>
      <p
        class="nc-text-sm nc-text-secondary"
        :style="{ marginTop: 'var(--nc-space-2)', maxWidth: '24rem', lineHeight: 'var(--nc-leading-relaxed)' }"
      >
        Your interview is complete. View your private insight document or your public profile.
      </p>
    </div>

    <div class="flex flex-col" :style="{ gap: 'var(--nc-space-3)' }">
      <button class="nc-btn nc-btn--accent" :style="{ justifyContent: 'center' }" @click="emit('goInsight')">
        <User :size="15" aria-hidden="true" />
        View Insight
      </button>
      <button class="nc-btn nc-btn--secondary" :style="{ justifyContent: 'center' }" @click="emit('goProfile')">
        <Globe :size="15" aria-hidden="true" />
        View Profile
      </button>
    </div>

    <button
      style="display: flex; align-items: center; gap: var(--nc-space-1); font-size: var(--nc-text-xs); margin-top: var(--nc-space-1); color: var(--nc-accent-ink); background: none; border: none; cursor: pointer;"
      @click="emit('restart')"
    >
      <RotateCcw :size="12" aria-hidden="true" />
      Start new interview
    </button>
  </div>
</template>
