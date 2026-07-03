<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    vertical?: boolean;
  }>(),
  { vertical: false },
);

const classes = computed(() => [
  "nc-path",
  props.vertical && "nc-path--v",
]);
</script>

<template>
  <div :class="classes" />
</template>
