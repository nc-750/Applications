<script setup lang="ts">
import { Cell } from "@nc-750/lab-vue";
import { PersonaStrength, PersonaWeakness } from "../../persona/models";

defineProps<{
    title: string;
    spec: string;
    surface: string;
    items: PersonaStrength[] | PersonaWeakness[];
}>();
</script>

<template>
    <Cell :title="title" :spec="spec" :grow="1">
        <div class="flex flex-col gap-1">
            <span v-if="items.length === 0" class="nc-text-sm nc-text-muted">—</span>
            <span v-for="(item, i) in items" :key="i" class="slc-entry">▸ {{ item.title }}</span>
            <span v-for="(item, i) in items" :key="i" class="slc-entry">▸ {{ item.description }}</span>
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
