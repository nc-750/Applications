<script setup lang="ts">
import { Cell } from "@nc-750/lab-vue";
import type { PersonaTrait } from "../../persona/models";

defineProps<{
    traits: PersonaTrait[];
}>();
</script>

<template>
    <Cell title="PERSONALITY" spec="INS // 0x07" :grow="1">
        <span v-if="traits.length === 0" class="nc-text-sm nc-text-muted">—</span>
        <div v-else class="flex flex-col gap-3">
            <div v-for="(trait, i) in traits" :key="i" class="flex flex-col gap-1">
                <!-- Dimension label + numeric position -->
                <div class="flex items-baseline justify-between gap-2">
                    <span class="nc-label">{{ trait.dimension }}</span>
                    <span class="nc-text-xs nc-text-muted dim-value">{{ trait.position }}</span>
                </div>
                <!-- Bipolar axis track with positioned marker -->
                <div class="dim-track">
                    <div class="dim-marker" :style="{ left: `${trait.position}%` }" />
                </div>
                <!-- Optional note -->
                <span v-if="trait.note" class="nc-text-xs nc-text-muted">{{ trait.note }}</span>
            </div>
        </div>
    </Cell>
</template>

<style scoped>
/* kept: no .nc-* class for tabular-nums on the numeric position readout */
.dim-value {
    font-family: var(--nc-font-mono);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
}

/* kept: no .nc-* class for the bipolar axis track */
.dim-track {
    position: relative;
    width: 100%;
    height: 12px;
    display: flex;
    align-items: center;
}

.dim-track::before {
    content: "";
    position: absolute;
    inset: 0;
    top: 50%;
    transform: translateY(-50%);
    height: var(--nc-border-width);
    background: var(--nc-line-strong);
    border-radius: var(--nc-radius-full);
}

/* kept: no .nc-* class for the axis marker pip */
.dim-marker {
    position: absolute;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    border-radius: var(--nc-radius-full);
    background: var(--nc-ink-1);
    border: var(--nc-border-width) solid var(--nc-line-strong);
    box-shadow: var(--nc-edge-raised);
}
</style>
