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
import { Coverage } from "lab-vue";
import { FACETS, type CoverageMap, type ProbeSignal } from "../../types/interview";
import { SATURATION_LOCKED } from "../../skills/analysisPrompt";

const props = withDefaults(
  defineProps<{
    coverage: CoverageMap;
    probeSignal?: ProbeSignal | null;
    /** Analysis (Call B) in flight — drives the acquisition status LED. */
    acquiring?: boolean;
    /** Condensed layout for mobile. */
    minimal?: boolean;
  }>(),
  { probeSignal: null, acquiring: false, minimal: false },
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
  <div class="nc-monitor mr-readout">
    <div class="mr-readout__signal">
      <span class="nc-led" :class="signal.cls">{{ signal.text }}</span>
    </div>

    <div v-if="!minimal" class="nc-label mr-readout__heading">COVERAGE / SATURATION</div>

    <div class="mr-readout__rows">
      <div v-for="f in FACETS" :key="f.key" class="mr-cov-row" :title="f.blurb">
        <span class="nc-label mr-cov-row__key">{{ f.label }}</span>
        <Coverage class="mr-cov-row__meter" :value="pct(f.key)" :locked="locked(f.key)" />
        <span v-if="!minimal" class="mr-cov-row__pct">{{ pct(f.key) }}%</span>
      </div>
    </div>
  </div>
</template>
