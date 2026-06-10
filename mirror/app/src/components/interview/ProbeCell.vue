<script setup lang="ts">
// The active probe — one facet-tagged question + a generous input. One-
// directional: the instrument asks, the user supplies evidence (not a chat
// box). While the analysis runs (acquiring), an nc-acquire overlay takes the
// cell — the wait shown as the signal being read, not a spinner (Rule I1).
import { ref, computed } from "vue";
import { Facet, Acquire } from "@nc-750/lab-vue";
import { FACETS, type FacetKey } from "../../types/interview";
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

const emit = defineEmits<{ submit: [answer: string] }>();

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
  <div class="mr-probe">
    <Facet>PROBING · {{ facetLabel }}</Facet>

    <!-- Fixed-height question box: long questions scroll inside it so the
         textarea + footer below never shift as the question changes. -->
    <div class="mr-probe__qbox">
      <h2 class="nc-heading-3 mr-probe__q">{{ question || "…" }}</h2>
    </div>

    <textarea
      v-model="answer"
      class="nc-textarea mr-probe__input"
      :disabled="disabled || working"
      placeholder="Enter evidence — a paragraph is welcome. The instrument is not in a hurry."
      @keydown.enter.exact.prevent="submit"
    />

    <div class="mr-probe__foot">
      <span class="nc-label">▸ INSTRUMENT ASKS · YOU SUPPLY EVIDENCE</span>
      <button class="nc-btn nc-btn--accent" :disabled="!canSubmit" @click="submit">Submit ▸</button>
    </div>

    <div v-if="working" class="mr-probe__overlay">
      <Acquire label="ANALYZING RESPONSE · READING SIGNAL" />
    </div>
  </div>
</template>

<style scoped>
.mr-probe {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--nc-space-4);
    height: 100%;
    min-height: 0;
}
.mr-probe__qbox {
    /* Fixed height (~5 lines of nc-heading-3) so the question never reflows the
       controls below it. Longer questions scroll within this box. */
    flex: 0 0 auto;
    height: 7.5rem;
    overflow-y: auto;
}
.mr-probe__q {
    margin: 0;
}
.mr-probe__input {
    flex: 1 1 auto;
    min-height: 120px;
    resize: none;
}
.mr-probe__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--nc-space-3);
}
.mr-probe__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--nc-panel) 92%, transparent);
}
</style>
