<script setup lang="ts">
// .nc-checkbox is a <label> wrapper around a native checkbox + text.
const model = defineModel<boolean>({ default: false });
</script>

<template>
  <label class="nc-checkbox">
    <input type="checkbox" v-model="model" />
    <slot />
  </label>
</template>
