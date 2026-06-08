<script setup lang="ts">
// Segmented control: options array + v-model selected index.
defineProps<{ options: string[] }>();
const model = defineModel<number>({ default: 0 });
</script>

<template>
  <div class="nc-segment">
    <button
      v-for="(opt, i) in options"
      :key="i"
      :class="{ 'is-active': model === i }"
      @click="model = i"
    >
      {{ opt }}
    </button>
  </div>
</template>
