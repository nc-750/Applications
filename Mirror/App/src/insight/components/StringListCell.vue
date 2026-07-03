<script setup lang="ts">
import { Cell } from "@nc-750/lab-vue";

defineProps<{
    title: string;
    spec: string;
    items: string[];
}>();
</script>

<template>
    <Cell :title="title" :spec="spec" :grow="1" surface="2">
        <div class="flex flex-col gap-1">
            <span v-if="items.length === 0" class="nc-text-sm nc-text-muted">—</span>
            <span v-for="(item, i) in items" :key="i" class="slc-entry">▸ {{ item }}</span>
        </div>
    </Cell>
</template>

<style scoped>
/* kept: no .nc-* class for line wrapping on monospace log entries */
.slc-entry {
    white-space: normal;
    line-height: 1.5;
}
</style>
