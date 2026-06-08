<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(
  defineProps<{ accent?: boolean }>(),
  { accent: false },
);
const classes = computed(() => ["nc-key", props.accent && "nc-key--accent"]);
</script>

<template>
  <span :class="classes"><slot /></span>
</template>
