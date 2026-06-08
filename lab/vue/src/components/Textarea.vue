<script setup lang="ts">
const model = defineModel<string>();
</script>

<template>
  <textarea class="nc-textarea" v-model="model"></textarea>
</template>
