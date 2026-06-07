<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** Fill percentage (0–100). */
    value?: number;
    locked?: boolean;
  }>(),
  { value: 0, locked: false },
);

const classes = computed(() => [
  "nc-coverage",
  props.locked && "nc-coverage--locked",
]);
</script>

<template>
  <div :class="classes" role="meter" :aria-valuenow="value" aria-valuemin="0" aria-valuemax="100">
    <div class="nc-coverage__fill" :style="{ width: value + '%' }" />
  </div>
</template>
