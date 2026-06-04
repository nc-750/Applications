<script setup lang="ts">
// Lever switch. v-model<boolean>; toggles the .is-on modifier on click.
const model = defineModel<boolean>({ default: false });
</script>

<template>
  <div class="nc-switch" :class="{ 'is-on': model }" @click="model = !model">
    <div class="nc-switch__lever"></div>
  </div>
</template>
