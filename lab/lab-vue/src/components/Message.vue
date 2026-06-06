<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** Which side / role the message represents. */
    variant?: "user" | "assistant" | "system" | "error";
  }>(),
  { variant: "assistant" },
);

const classes = computed(() => [
  "nc-message",
  `nc-message--${props.variant}`,
]);
</script>

<template>
  <div :class="classes"><slot /></div>
</template>
