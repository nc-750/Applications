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

const coverageStatus = computed(() => {
  if (!props.value) {
    return "nc-coverage--small";
  }

  if (props.value < 30) {
    return "nc-coverage--small"
  }

  if (props.value >= 30 && props.value <= 60) {
    return "nc-coverage--medium";
  }

  return "nc-coverage--good";
});

const classes = computed(() => [
  "nc-coverage",
  props.locked && "nc-coverage--locked"
]);

const coverageFillClasses = computed(() => [
  "nc-coverage__fill",
  coverageStatus.value
]);
</script>

<template>
  <div :class="classes" role="meter" :aria-valuenow="value" aria-valuemin="0" aria-valuemax="100">
    <div :class="coverageFillClasses" :style="{ width: value + '%' }" />
  </div>
</template>