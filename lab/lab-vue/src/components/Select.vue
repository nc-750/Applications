<script setup lang="ts">
const model = defineModel<string | number>();
</script>

<template>
  <select class="nc-select" v-model="model"><slot /></select>
</template>
