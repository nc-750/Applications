<script setup lang="ts">
defineProps<{
  partno: string;
}>();
</script>

<template>
  <div class="nc-monitor flex items-center justify-between px-6 py-2.5">
    <span class="nc-lcd-sub">{{ partno }}</span>
    <slot />
  </div>
</template>
