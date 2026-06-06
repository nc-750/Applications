<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(
  defineProps<{
    variant?: "default" | "raised" | "inset";
    interactive?: boolean;
  }>(),
  { variant: "default", interactive: false },
);
const classes = computed(() => [
  "nc-panel",
  props.variant !== "default" && `nc-panel--${props.variant}`,
  props.interactive && "nc-panel--interactive",
]);
</script>

<template>
  <div :class="classes"><slot /></div>
</template>
