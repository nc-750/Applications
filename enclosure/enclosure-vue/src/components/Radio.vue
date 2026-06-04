<script setup lang="ts">
// .nc-radio is a <label> wrapper around a native radio + text.
// v-model binds the selected value across a group sharing the same model.
const props = defineProps<{ value: string | number; name?: string }>();
const model = defineModel<string | number>();
</script>

<template>
  <label class="nc-radio">
    <input type="radio" :name="name" :value="props.value" v-model="model" />
    <slot />
  </label>
</template>
