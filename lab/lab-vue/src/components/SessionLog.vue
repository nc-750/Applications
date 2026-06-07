<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  entries: { id: string; marker: string; summary: string; body: string }[];
}>();

const open = ref<string | null>(null);

function toggle(id: string) {
  open.value = open.value === id ? null : id;
}
</script>

<template>
  <div class="nc-log">
    <div
      v-for="entry in entries"
      :key="entry.id"
      class="nc-log__entry"
      :class="{ 'nc-log__entry--open': open === entry.id }"
    >
      <button class="nc-log__summary" @click="toggle(entry.id)">
        <span class="nc-log__marker">{{ entry.marker }}</span>
        <span>{{ entry.summary }}</span>
      </button>
      <div class="nc-log__body">{{ entry.body }}</div>
    </div>
  </div>
</template>
