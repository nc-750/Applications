<script setup lang="ts">
// Exploded view — stack of isometric plates on a dashed assembly axis.
// Parts are slotted in; the axis is a visual spine. Hand-built per subject.
</script>

<template>
  <div class="nc-exploded">
    <div class="nc-exploded__axis" />
    <slot />
  </div>
</template>
