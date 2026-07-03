<script setup lang="ts">
// The session log — the demoted transcript. Append-only, collapsible,
// re-openable entries (the flight-recorder model). Each prior probe + answer
// collapses to a terse line (OBS 01 · STORY ▸ ANSWERED) you can re-open.
import { computed } from "vue";
import { SessionLog } from "@nc-750/lab-vue";
import type { TranscriptMessage } from "../models";

const props = defineProps<{
  messages: TranscriptMessage[];
}>();

// Pair each assistant question with the following user answer into one entry.
const entries = computed(() => {
  const out: { id: string; marker: string; summary: string; body: string }[] = [];
  const msgs = props.messages;
  let n = 0;
  for (let i = 0; i < msgs.length; i++) {
    if (msgs[i].role !== "assistant" || msgs[i].isError) continue;
    const question = msgs[i].content;
    const context = msgs[i].context?.trim();
    const answer = msgs[i + 1]?.role === "user" ? msgs[i + 1].content : "";
    if (!answer) continue; // only log answered probes
    n += 1;
    out.push({
      id: `obs-${i}`,
      marker: "▸",
      summary: `OBS ${String(n).padStart(2, "0")} · ANSWERED`,
      body: `${context ? `“${context}”\n\n` : ""}Q: ${question}\n\nA: ${answer}`,
    });
  }
  return out;
});
</script>

<template>
  <SessionLog v-if="entries.length" :entries="entries" />
  <p v-else class="nc-label mr-log-empty">— NO ENTRIES —</p>
</template>

<style scoped>
.mr-log-empty {
    color: var(--nc-ink-faint);
}
</style>
