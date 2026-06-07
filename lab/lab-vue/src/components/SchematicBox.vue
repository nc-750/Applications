<script setup lang="ts">
// Schematic box — a labelled node in a diagram.
// Carries a mono part-number label and a name.
</script>

<template>
  <div class="nc-schematic-box">
    <div class="nc-schematic-box__label"><slot name="label" /></div>
    <div class="nc-schematic-box__name"><slot name="name"><slot /></slot></div>
  </div>
</template>
