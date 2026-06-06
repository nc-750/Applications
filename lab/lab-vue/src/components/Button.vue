<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(
  defineProps<{
    variant?: "default" | "primary" | "accent" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    icon?: boolean;
  }>(),
  { variant: "default", size: "md", icon: false },
);
const classes = computed(() => [
  "nc-btn",
  props.variant !== "default" && `nc-btn--${props.variant}`,
  props.size !== "md" && `nc-btn--${props.size}`,
  props.icon && "nc-btn--icon",
]);
</script>

<template>
  <button :class="classes"><slot /></button>
</template>
