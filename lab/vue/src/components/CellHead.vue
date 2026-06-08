<script setup lang="ts">
// Cell-header anatomy: title left, spec-detail right. Renders .nc-cell-head
// with __title and __spec parts. Use the `title` slot for the heading and the
// default (or `spec`) slot for the right-aligned mono spec-detail.
</script>

<template>
  <div class="nc-cell-head">
    <div class="nc-cell-head__title"><slot name="title" /></div>
    <div class="nc-cell-head__spec"><slot name="spec"><slot /></slot></div>
  </div>
</template>
