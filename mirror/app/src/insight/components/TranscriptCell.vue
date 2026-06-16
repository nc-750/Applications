<script setup lang="ts">
// Interview transcript — the stored conversation log rendered as a collapsible
// Q&A log via SessionLog. Pairs each assistant question with the following user
// answer. Transcript lines are domain `TranscriptMessage`s (plain string content).
import { computed } from "vue";
import { Cell, SessionLog } from "@nc-750/lab-vue";
import type { TranscriptMessage } from "../../core/Transcript";

const props = defineProps<{
    messages: TranscriptMessage[];
}>();

// Pair each non-system assistant message with the following user answer into
// a collapsible SessionLog entry. Matches the interview TranscriptLog.vue Q&A
// pairing pattern: skip system/error messages, number exchanges, summarise the
// first ~60 chars of the question.
const entries = computed(() => {
    const out: { id: string; marker: string; summary: string; body: string }[] = [];
    const msgs = props.messages;
    let n = 0;
    for (let i = 0; i < msgs.length; i++) {
        if (msgs[i].role !== "assistant") continue;
        const question = msgs[i].content;
        const userMsg = msgs[i + 1];
        const answer = userMsg?.role === "user" ? userMsg.content : "";
        if (!answer) continue;
        n += 1;
        const shortQ = question.length > 60 ? question.slice(0, 60).trimEnd() + "…" : question;
        out.push({
            id: `tlog-${i}`,
            marker: "▸",
            summary: `EXCHANGE ${String(n).padStart(2, "0")} · ${shortQ}`,
            body: `Q: ${question}\n\nA: ${answer}`,
        });
    }
    return out;
});
</script>

<template>
    <Cell title="TRANSCRIPT" spec="INS // 0x0E" :grow="1">
        <SessionLog v-if="entries.length" :entries="entries" />
        <span v-else class="nc-text-sm nc-text-muted">—</span>
    </Cell>
</template>
