<script setup lang="ts">
// The active probe — one facet-tagged question + a generous input. One-
// directional: the instrument asks, the user supplies evidence (not a chat
// box). While the analysis runs (acquiring), an nc-acquire overlay takes the
// cell — the wait shown as the signal being read, not a spinner (Rule I1).
import { ref, computed } from "vue";
import { Acquire } from "@nc-750/lab-vue";
import type { FacetKey } from "../models";
import { FACETS } from "../reference";
import { logger } from "../../logger";

const props = withDefaults(
  defineProps<{
    facet: FacetKey;
    /** The active question — the committed last probe (question text only). */
    question: string;
    /** A turn (analysis + probe) is in flight — show the overlay and lock input. */
    working?: boolean;
    disabled?: boolean;
  }>(),
  { working: false, disabled: false },
);

const emit = defineEmits<{
  submit: [answer: string]
}>();

const answer = ref("");
const facetLabel = computed(() => FACETS.find((f) => f.key === props.facet)?.label ?? props.facet);
const canSubmit = computed(() => !props.disabled && !props.working && answer.value.trim().length > 0);

function submit() {
  logger.debug("app", "ProbeCell submit");
  if (!canSubmit.value) return;
  emit("submit", answer.value.trim());
  answer.value = "";
}
</script>

<template>
  <div class="nc-plate flex flex-col gap-4">
    <span class="nc-facet">PROBING · {{ facetLabel }}</span>

    <!-- Fixed-height question box: long questions scroll inside it so the
         textarea + footer below never shift as the question changes. -->
    <div class="nc-plate p-2 h-50 overflow-y-auto">
      <h4 class="nc-heading-4">{{ question || "…" }}</h4>
    </div>

    <textarea
      v-model="answer"
      class="nc-textarea"
      :disabled="working"
      placeholder="Enter evidence — a paragraph is welcome. The instrument is not in a hurry."
      @keydown.enter.exact.prevent="submit"
    />

    <button class="nc-btn nc-btn--accent" :disabled="!canSubmit" @click="submit">Submit ▸</button>
  </div>
</template>

<style scoped>
.overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--nc-panel) 92%, transparent);
}


</style>
