<script setup lang="ts">
defineProps<{
  label?: string
}>();

const model = defineModel<string | number>();
</script>

<template>
  <span></span>
  <select class="nc-select" v-model="model"><slot /></select>
</template>
