<script setup lang="ts">
// The live readout — the hero of the instrument. A dark nc-monitor cavity
// showing two HONEST readings produced by the per-turn analysis call (Call B):
//   - coverage / saturation across the five facets
//   - the probe-signal LED (thin → probing deeper, strong → advancing)
// No fabricated metrics (VISUAL_IDENTITY P5 / DESIGN_USE Rule I1).
//
// `minimal` is the ONLY form-factor branch in the instrument: the desktop
// readout shows per-facet rows with percentages; mobile condenses to compact
// meters. Same component, one v-if — not a second component.
import { computed } from "vue";
import { Coverage } from "@nc-750/lab-vue";
import type { CoverageMap, ProbeSignal } from "../models";
import { FACETS, SATURATION_LOCKED } from "../reference";

const props = withDefaults(
  defineProps<{
    coverage: CoverageMap;
    probeSignal?: ProbeSignal | null;
    /** Analysis (Call B) in flight — drives the acquisition status LED. */
    acquiring?: boolean;
    /** The instrument's read-only acknowledgement of the user's last answer. */
    context?: string;
    /** Condensed layout for mobile. */
    minimal?: boolean;
  }>(),
  { probeSignal: null, acquiring: false, context: "", minimal: false },
);

const pct = (k: keyof CoverageMap) => Math.round((props.coverage[k] ?? 0) * 100);
const locked = (k: keyof CoverageMap) => (props.coverage[k] ?? 0) >= SATURATION_LOCKED;

const signal = computed(() => {
  if (props.acquiring) return { cls: "nc-led--rec", text: "ANALYZING · READING SIGNAL" };
  if (props.probeSignal === "thin") return { cls: "nc-led--warn", text: "SIGNAL · THIN — PROBING DEEPER" };
  if (props.probeSignal === "strong") return { cls: "nc-led--on", text: "SIGNAL · STRONG — ADVANCING" };
  return { cls: "", text: "AWAITING SIGNAL" };
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="context" class="flex flex-col gap-1 pb-3 cov-note">
      <span class="nc-label cov-note-key">▸ INSTRUMENT NOTE</span>
      <p class="nc-text-sm cov-note-text">{{ context }}</p>
    </div>

    <div>
      <span class="nc-led" :class="signal.cls">{{ signal.text }}</span>
    </div>

    <div v-if="!minimal" class="nc-label mb-1">COVERAGE / SATURATION</div>

    <div class="flex flex-col gap-2">
      <div v-for="f in FACETS" :key="f.key" class="cov-row" :title="f.blurb">
        <span class="nc-label cov-row-key">{{ f.label }}</span>
        <Coverage class="cov-row-meter" :value="pct(f.key)" :locked="locked(f.key)" />
        <span v-if="!minimal" class="nc-text-xs text-right cov-row-pct">{{ pct(f.key) }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* kept: no .nc-* class for bottom-border seam */
.cov-note {
    border-bottom: var(--nc-border-width) solid var(--nc-line);
}

/* kept: no .nc-* class for this ink tone */
.cov-note-key {
    color: var(--nc-ink-3);
}

/* kept: no .nc-* class for ink-2 text colour */
.cov-note-text {
    margin: 0;
    color: var(--nc-ink-2);
    line-height: 1.4;
}

/* kept: Tailwind grid-cols arbitrary value for this specific facet row layout */
.cov-row {
    display: grid;
    grid-template-columns: 84px 1fr 40px;
    align-items: center;
    gap: var(--nc-space-3);
}

/* kept: no .nc-* class for min-width constraint on Coverage meter */
.cov-row-meter {
    min-width: 0;
}

/* kept: no .nc-* class for mono font + tabular-nums on percentage readout */
.cov-row-pct {
    font-family: var(--nc-font-mono);
    color: var(--nc-ink-3);
    font-variant-numeric: tabular-nums;
}
</style>
