<script setup lang="ts">
// label + control slot + optional help text, using .nc-field structure.
defineProps<{ label?: string; help?: string; for?: string }>();
</script>

<template>
  <div class="nc-field">
    <label v-if="label" class="nc-field__label" :for="$props.for">{{ label }}</label>
    <slot />
    <span v-if="help" class="nc-field__help">{{ help }}</span>
  </div>
</template>
