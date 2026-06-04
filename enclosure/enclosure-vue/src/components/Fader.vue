<script setup lang="ts">
// Slotted-track fader: a range input inside .nc-fader plus a .nc-partno label.
const props = withDefaults(
  defineProps<{ min?: number; max?: number; label?: string }>(),
  { min: 0, max: 100 },
);
const model = defineModel<number>({ default: 0 });
</script>

<template>
  <div class="nc-fader">
    <input type="range" :min="props.min" :max="props.max" v-model.number="model" />
    <span v-if="label" class="nc-partno">{{ label }}</span>
  </div>
</template>
