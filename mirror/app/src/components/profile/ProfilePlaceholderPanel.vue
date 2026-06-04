<script setup lang="ts">
import { Globe } from "lucide-vue-next";
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full" style="gap: var(--nc-space-3); color: var(--nc-ink-3);">
    <Globe :size="28" />
    <p class="nc-text-sm" style="text-align: center; max-width: 16rem; line-height: var(--nc-leading-relaxed);">
      Live editor and advanced feature planned
    </p>
  </div>
</template>
