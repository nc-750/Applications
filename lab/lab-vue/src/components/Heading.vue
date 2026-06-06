<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(
  defineProps<{
    level?: 1 | 2 | 3 | 4;
    // Optional override of the rendered tag; defaults to h{level}.
    as?: string;
  }>(),
  { level: 2 },
);
const tag = computed(() => props.as ?? `h${props.level}`);
const classes = computed(() => [`nc-heading-${props.level}`]);
</script>

<template>
  <component :is="tag" :class="classes"><slot /></component>
</template>
