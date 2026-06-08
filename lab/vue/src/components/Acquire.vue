<script setup lang="ts">
// Acquisition — the working/analysing state.
// An animating waveform + label, used for foreground/blocking work.
defineProps<{
  label?: string;
}>();
</script>

<template>
  <div class="nc-acquire">
    <div class="nc-acquire__wave">
      <div class="nc-acquire__bar" />
      <div class="nc-acquire__bar" />
      <div class="nc-acquire__bar" />
      <div class="nc-acquire__bar" />
      <div class="nc-acquire__bar" />
    </div>
    <div class="nc-acquire__label">{{ label ?? "ANALYZING …" }}</div>
  </div>
</template>
