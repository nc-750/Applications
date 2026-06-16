<script setup lang="ts">
import { computed } from "vue";
import { Cell } from "@nc-750/lab-vue";
import type { PersonaCareer } from "../../persona/models";

const props = defineProps<{
    title: string;
    spec: string;
    entries: PersonaCareer[];
    tone?: "personal";
}>();

function formatDate(ts: number): string {
    return new Date(ts).toISOString().slice(0, 7);
}

const sortedEntries = computed(() =>
    [...props.entries].sort((a, b) => b.dateStart - a.dateStart)
);
</script>

<template>
    <Cell :title="title" :spec="spec" :grow="1">
        <span v-if="entries.length === 0" class="nc-text-sm nc-text-muted">—</span>
        <div v-else class="ctc-list" :class="{ 'ctc-personal': tone === 'personal' }">
            <div v-for="(entry, i) in sortedEntries" :key="i" class="ctc-row">
                <!-- Dates column: start on top, end below -->
                <div class="ctc-dates">
                    <div>{{ formatDate(entry.dateStart) }}</div>
                    <div>{{ formatDate(entry.dateEnd) }}</div>
                </div>
                <!-- Main column: role, org, highlights, realStory -->
                <div class="ctc-main">
                    <span class="nc-text-sm">{{ entry.role }}</span>
                    <span v-if="entry.organization" class="nc-text-xs nc-text-muted">{{ entry.organization }}</span>
                    <div v-if="entry.highlights.length > 0" class="ctc-highlights">
                        <div v-for="(h, j) in entry.highlights" :key="j" class="ctc-highlight nc-text-xs">
                            {{ h }}
                        </div>
                    </div>
                    <div v-if="entry.realStory" class="ctc-story nc-text-xs">
                        {{ entry.realStory }}
                    </div>
                </div>
            </div>
        </div>
    </Cell>
</template>

<style scoped>
.ctc-list {
    display: flex;
    flex-direction: column;
}

/* kept: no .nc-* class for the subtle personal-section tint block */
.ctc-personal {
    background: var(--nc-metal-base);
    border-radius: var(--nc-radius-sm);
    padding: var(--nc-space-2);
}

/* kept: no .nc-* class for the dates-left two-column entry row */
.ctc-row {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: var(--nc-space-3);
    padding: var(--nc-space-2) 0;
    border-bottom: 1px solid var(--nc-line-subtle);
}

.ctc-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

/* kept: no .nc-* class for the mono tabular date column */
.ctc-dates {
    font-family: var(--nc-font-mono);
    font-size: 10px;
    color: var(--nc-ink-4);
    line-height: 1.6;
    padding-top: 1px;
    flex-shrink: 0;
}

.ctc-main {
    display: flex;
    flex-direction: column;
    gap: var(--nc-space-1);
}

.ctc-highlights {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: var(--nc-space-1);
}

/* kept: no .nc-* class for the ▸-prefixed highlight row */
.ctc-highlight {
    position: relative;
    padding-left: 12px;
    color: var(--nc-ink-3);
}

.ctc-highlight::before {
    content: "▸";
    position: absolute;
    left: 0;
    color: var(--nc-ink-4);
}

/* kept: no .nc-* class for the realStory side-rule note */
.ctc-story {
    margin-top: var(--nc-space-1);
    border-left: 2px solid var(--nc-line-subtle);
    padding: 3px 8px;
    font-style: italic;
    color: var(--nc-ink-3);
    line-height: 1.5;
}
</style>
