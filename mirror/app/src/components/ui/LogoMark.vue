<script setup lang="ts">
/**
 * Mirror geometric mark — a signet-style nested-square motif.
 * Outer rounded square + inner rotated square (diamond).
 * Inherits `currentColor`; wrap in a container that sets text-ember / text-ink etc.
 */
withDefaults(defineProps<{ size?: number }>(), { size: 18 });
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="3.5" stroke="currentColor" stroke-width="1.5" />
    <rect
      x="9"
      y="9"
      width="6"
      height="6"
      rx="0.75"
      stroke="currentColor"
      stroke-width="1.5"
      transform="rotate(45 12 12)"
    />
  </svg>
</template>
