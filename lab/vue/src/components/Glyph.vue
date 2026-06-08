<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    symbol: "node" | "relay" | "null" | "active" | "enclose" | "local" | "signal" | "verify" | "registration";
    variant?: "default" | "active" | "verified" | "null";
  }>(),
  { variant: "default" },
);

const classes = computed(() => [
  "nc-glyph",
  props.variant !== "default" && `nc-glyph--${props.variant}`,
]);
</script>

<template>
  <span :class="classes" aria-hidden="true">
    <!-- node — circle -->
    <svg v-if="symbol === 'node'" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="12" />
    </svg>
    <!-- relay — two overlapping circles with arrow -->
    <svg v-else-if="symbol === 'relay'" viewBox="0 0 34 34">
      <circle cx="13" cy="17" r="10" />
      <circle cx="23" cy="17" r="6" />
      <path d="M19 14 l5 3 -5 3" />
    </svg>
    <!-- null — circle with diagonal slash -->
    <svg v-else-if="symbol === 'null'" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="12" />
      <line x1="9" y1="9" x2="25" y2="25" />
    </svg>
    <!-- active — filled circle with pulse ring -->
    <svg v-else-if="symbol === 'active'" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="8" fill="currentColor" />
      <circle cx="17" cy="17" r="14" stroke-width="1" />
    </svg>
    <!-- enclose — square outline -->
    <svg v-else-if="symbol === 'enclose'" viewBox="0 0 34 34">
      <rect x="6" y="6" width="22" height="22" rx="2" />
    </svg>
    <!-- local — small circle inside larger -->
    <svg v-else-if="symbol === 'local'" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="12" />
      <circle cx="17" cy="17" r="5" />
    </svg>
    <!-- signal — amplitude bars -->
    <svg v-else-if="symbol === 'signal'" viewBox="0 0 34 34">
      <rect x="4" y="18" width="4" height="10" rx="1" />
      <rect x="10" y="12" width="4" height="16" rx="1" />
      <rect x="16" y="6" width="4" height="22" rx="1" />
      <rect x="22" y="14" width="4" height="14" rx="1" />
    </svg>
    <!-- verify — checkmark -->
    <svg v-else-if="symbol === 'verify'" viewBox="0 0 34 34">
      <polyline points="8,18 15,24 26,10" />
    </svg>
    <!-- registration — crosshair with circle rim -->
    <svg v-else-if="symbol === 'registration'" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="12" />
      <line x1="17" y1="5" x2="17" y2="12" />
      <line x1="17" y1="22" x2="17" y2="29" />
      <line x1="5" y1="17" x2="12" y2="17" />
      <line x1="22" y1="17" x2="29" y2="17" />
    </svg>
  </span>
</template>
