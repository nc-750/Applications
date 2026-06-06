<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(
  defineProps<{
    variant?: "default" | "accent" | "success" | "warning" | "error" | "info";
  }>(),
  { variant: "default" },
);
const classes = computed(() => [
  "nc-badge",
  props.variant !== "default" && `nc-badge--${props.variant}`,
]);
</script>

<template>
  <span :class="classes"><slot /></span>
</template>
