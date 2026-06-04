<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(
  defineProps<{ subtle?: boolean }>(),
  { subtle: false },
);
const classes = computed(() => [
  "nc-divider",
  props.subtle && "nc-divider--subtle",
]);
</script>

<template>
  <hr :class="classes" />
</template>
