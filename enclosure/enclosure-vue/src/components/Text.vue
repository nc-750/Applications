<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(
  defineProps<{
    size?: "2xs" | "xs" | "sm" | "base" | "md" | "lg" | "xl";
    tone?: "default" | "secondary" | "muted" | "accent";
    as?: string;
  }>(),
  { size: "base", tone: "default", as: "p" },
);
const classes = computed(() => [
  `nc-text-${props.size}`,
  props.tone !== "default" && `nc-text-${props.tone}`,
]);
</script>

<template>
  <component :is="as" :class="classes"><slot /></component>
</template>
