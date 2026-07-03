<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

defineProps<{
  partno: string;
}>();

const clock = ref("00:00");
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  const t0 = Date.now();
  timer = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    clock.value =
      String(Math.floor(s / 60)).padStart(2, "0") +
      ":" +
      String(s % 60).padStart(2, "0");
  }, 1000);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <div class="nc-monitor flex items-center justify-between px-6 py-2.5">
    <div class="flex items-center gap-4">
      <span class="nc-lcd-sub">{{ partno }}</span>
      <slot name="leds" />
    </div>
    <span class="nc-lcd">0x00 · {{ clock }}</span>
  </div>
</template>
