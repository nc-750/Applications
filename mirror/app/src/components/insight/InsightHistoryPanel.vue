<script setup lang="ts">
defineProps<{
  history: { role: string; content: string; timestamp: string }[];
}>();
</script>

<template>
  <h3 class="nc-heading-4" style="margin-bottom: var(--nc-space-3);">Interview History</h3>

  <p
    v-if="!history.length"
    class="nc-text-sm nc-text-muted"
    style="line-height: var(--nc-leading-relaxed);"
  >
    No interview transcript available.
  </p>

  <div
    v-for="(msg, i) in history"
    :key="i"
    :style="{
      padding: 'var(--nc-space-2) 0',
      borderBottom: 'var(--nc-border-width) solid var(--nc-line-subtle)',
    }"
  >
    <span
      style="
        font-size: var(--nc-text-2xs);
        font-family: var(--nc-font-mono);
        color: var(--nc-ink-3);
        text-transform: uppercase;
      "
    >
      {{ msg.role }} &middot; {{ new Date(msg.timestamp).toLocaleTimeString() }}
    </span>
    <p
      class="nc-text-sm"
      style="
        white-space: pre-wrap;
        margin-top: var(--nc-space-1);
        color: var(--nc-ink);
      "
    >
      {{ msg.content }}
    </p>
  </div>
</template>
