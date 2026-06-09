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
    class="flex flex-col items-center justify-center text-center banner__error"
  >
    <AlertTriangle :size="32" class="banner__icon" aria-hidden="true" />
    <div>
      <p class="nc-text-md nc-font-semibold banner__title">Couldn't build your profile</p>
      <p class="nc-text-sm nc-text-secondary max-w-sm banner__subtitle">
        {{ errorMessage ? `Synthesis failed — ${errorMessage}` : "Something went wrong while building your profile." }}
        Your interview answers are saved, so you can try again.
      </p>
    </div>
    <div class="flex flex-col banner__actions">
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
    class="flex flex-col items-center justify-center text-center banner__synthesizing"
  >
    <Loader2 :size="32" class="animate-spin banner__icon" aria-hidden="true" />
    <div>
      <p class="nc-text-md nc-font-semibold banner__title">{{ phaseLabel }}</p>
      <p class="nc-text-sm nc-text-secondary banner__detail">{{ phaseDetail }}</p>
    </div>
  </div>

  <!-- Completed -->
  <div
    v-else
    class="flex flex-col items-center justify-center text-center banner__completed"
  >
    <CheckCircle :size="36" class="banner__icon" aria-hidden="true" />

    <div>
      <p class="nc-text-lg nc-font-semibold banner__title">
        {{ personaName ? `${personaName}'s mirror is ready` : "Mirror ready" }}
      </p>
      <p class="nc-text-sm nc-text-secondary max-w-sm banner__subtitle">
        Your interview is complete. View your private insight document or your public profile.
      </p>
    </div>

    <div class="flex flex-col banner__actions">
      <button class="nc-btn nc-btn--accent justify-center" @click="emit('goInsight')">
        <User :size="15" aria-hidden="true" />
        View Insight
      </button>
      <button class="nc-btn nc-btn--secondary justify-center" @click="emit('goProfile')">
        <Globe :size="15" aria-hidden="true" />
        View Profile
      </button>
    </div>

    <button class="banner__restart" @click="emit('restart')">
      <RotateCcw :size="12" aria-hidden="true" />
      Start new interview
    </button>
  </div>
</template>

<style scoped>
.banner__error {
  gap: var(--nc-space-5);
  padding: var(--nc-space-12) 0;
  padding-left: var(--nc-space-6);
  padding-right: var(--nc-space-6);
}

.banner__synthesizing {
  gap: var(--nc-space-4);
  padding: var(--nc-space-12) 0;
}

.banner__completed {
  gap: var(--nc-space-6);
  padding: var(--nc-space-12) 0;
  padding-left: var(--nc-space-6);
  padding-right: var(--nc-space-6);
}

.banner__icon {
  color: var(--nc-accent);
}

.banner__title {
  color: var(--nc-ink);
}

.banner__subtitle {
  margin-top: var(--nc-space-2);
  line-height: var(--nc-leading-relaxed);
}

.banner__detail {
  margin-top: var(--nc-space-1);
}

.banner__actions {
  gap: var(--nc-space-3);
}

.banner__restart {
  display: flex;
  align-items: center;
  gap: var(--nc-space-1);
  font-size: var(--nc-text-xs);
  margin-top: var(--nc-space-1);
  color: var(--nc-accent-ink);
  background: none;
  border: none;
  cursor: pointer;
}
</style>
