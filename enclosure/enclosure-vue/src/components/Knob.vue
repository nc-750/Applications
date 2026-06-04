<script setup lang="ts">
import { computed, onUnmounted, useTemplateRef } from "vue";
const props = withDefaults(
  defineProps<{ modelValue?: number; min?: number; max?: number }>(),
  { modelValue: 0, min: -150, max: 150 },
);
const emit = defineEmits<{ "update:modelValue": [number] }>();
const el = useTemplateRef<HTMLElement>("el");
const angle = computed(() => `${props.modelValue}deg`);

function onDrag(e: MouseEvent) {
  const n = el.value;
  if (!n) return;
  const r = n.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  // atan2 gives 0deg at 3 o'clock; CSS rotate 0deg is 12 o'clock -> add 90.
  let a = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
  a = Math.max(props.min, Math.min(props.max, Math.round(a)));
  emit("update:modelValue", a);
}
function stop() {
  removeEventListener("mousemove", onDrag);
  removeEventListener("mouseup", stop);
}
function start(e: MouseEvent) {
  e.preventDefault();
  addEventListener("mousemove", onDrag);
  addEventListener("mouseup", stop);
}
onUnmounted(stop);
</script>

<template>
  <div
    ref="el"
    class="nc-knob"
    :style="{ '--nc-knob-angle': angle }"
    @mousedown="start"
  ></div>
</template>
