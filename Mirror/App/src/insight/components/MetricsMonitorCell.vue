<script setup lang="ts">
import { MonitorCell, Coverage } from "@nc-750/lab-vue";
import type { PersonaMetrics } from "../../persona/models";
import { METRICS_FACETS } from "../reference";

defineProps<{
    metrics: PersonaMetrics;
}>();
</script>

<template>
    <MonitorCell title="METRICS" spec="INS // 0x01" :grow="1">
        <div class="flex flex-col gap-2">
            <div v-for="f in METRICS_FACETS" :key="f.key" class="mmc-row">
                <span class="nc-label mmc-label">{{ f.label }}</span>
                <Coverage class="mmc-meter" :value="metrics[f.key]" />
                <span class="nc-text-xs mmc-value">{{ metrics[f.key] }}</span>
            </div>
        </div>
    </MonitorCell>
</template>

<style scoped>
/* kept: no .nc-* class for this three-column facet row layout */
.mmc-row {
    display: grid;
    grid-template-columns: 80px 1fr 32px;
    align-items: center;
    gap: var(--nc-space-3);
}

/* kept: no .nc-* class for min-width constraint on the Coverage meter */
.mmc-meter {
    min-width: 0;
}

/* kept: no .nc-* class for mono + tabular-nums on the numeric readout */
.mmc-value {
    font-family: var(--nc-font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--nc-ink-3);
    text-align: right;
}
</style>
