<script setup lang="ts">
import { computed } from "vue";

const model = defineModel<boolean>("open", { default: false });

defineProps<{
  /** Header label (default "THINKING"). */
  label?: string;
}>();

const classes = computed(() => [
  "nc-thinking",
  model.value && "nc-thinking--open",
]);

function toggle() {
  model.value = !model.value;
}
</script>

<template>
  <div :class="classes">
    <div
      class="nc-thinking__header"
      role="button"
      tabindex="0"
      :aria-expanded="model"
      @click="toggle"
      @keydown.enter="toggle"
      @keydown.space.prevent="toggle"
    >
      <span class="nc-thinking__label">{{ label ?? "THINKING" }}</span>
      <span class="nc-thinking__toggle" aria-hidden="true">&#9660;</span>
    </div>
    <div class="nc-thinking__body">
      <slot />
    </div>
  </div>
</template>
