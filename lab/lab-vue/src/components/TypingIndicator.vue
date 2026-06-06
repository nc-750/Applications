<script setup lang="ts">
defineProps<{
  /** Label shown next to the dots (e.g. "ASSISTANT TYPING"). */
  label?: string;
}>();
</script>

<template>
  <div class="nc-typing">
    <div class="nc-typing__dots">
      <span class="nc-typing__dot" />
      <span class="nc-typing__dot" />
      <span class="nc-typing__dot" />
    </div>
    <span v-if="label" class="nc-typing__label">{{ label }}</span>
  </div>
</template>
