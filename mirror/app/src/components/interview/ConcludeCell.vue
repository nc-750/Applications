<script setup lang="ts">
// Conclusion state — shown when the reading has converged (coverage saturated).
// The length is genuinely unknown, so this is an offer, not a wall: generate
// now, or keep feeding the instrument (append-only, no counter).
import { Facet } from "lab-vue";

defineProps<{
  /** Synthesis (Call C) running — disable actions and show progress text. */
  busy?: boolean;
  /** Transient synthesis phase label, if any. */
  phase?: string | null;
}>();

const emit = defineEmits<{ generate: []; continue: [] }>();
</script>

<template>
  <div class="mr-conclude">
    <Facet class="mr-conclude__tag">● SIGNAL SUFFICIENT · COVERAGE LOCKED</Facet>

    <h2 class="nc-heading-3 mr-conclude__q">The reading has converged.</h2>
    <p class="nc-text-sm mr-conclude__note">
      Coverage is sufficient across all facets. You can generate your profile now, or keep feeding
      the instrument — the reading will keep refining. There is no fixed number of probes.
    </p>

    <div class="mr-conclude__row">
      <button class="nc-btn nc-btn--accent" :disabled="busy" @click="emit('generate')">
        {{ busy ? "Generating…" : "Generate profile ▸" }}
      </button>
      <button class="nc-btn nc-btn--secondary" :disabled="busy" @click="emit('continue')">
        Continue — add more evidence
      </button>
    </div>

    <p v-if="busy && phase" class="nc-label mr-conclude__phase">{{ phase }}…</p>
  </div>
</template>
