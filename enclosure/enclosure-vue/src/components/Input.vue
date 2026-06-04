<script setup lang="ts">
// Text-like input. The .nc-input class lives on the element itself;
// consumer class/style/attrs (type, placeholder, id, ...) fall through.
const model = defineModel<string | number>();
</script>

<template>
  <input class="nc-input" v-model="model" />
</template>
