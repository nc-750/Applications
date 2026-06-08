<script setup lang="ts">
import { ref, computed } from "vue";

export interface ExpandAction {
  label: string;
  action: () => void;
}

const props = withDefaults(
  defineProps<{
    label: string;
    actions: ExpandAction[];
    variant?: "default" | "primary" | "accent" | "secondary" | "ghost" | "danger";
  }>(),
  { variant: "default" },
);

const open = ref(false);
const container = ref<HTMLElement | null>(null);

const triggerClasses = computed(() => [
  "nc-btn",
  "nc-btn--sm",
  "nc-btn-expand__trigger",
  props.variant !== "default" && `nc-btn--${props.variant}`,
]);

function toggle() {
  open.value = !open.value;
}

function close() {
  open.value = false;
}

function onAction(action: ExpandAction) {
  close();
  action.action();
}

// Close when focus leaves the entire expand container.
function onBlur(e: FocusEvent) {
  const el = container.value;
  if (!el) return;
  // If the newly focused element is still inside this component, keep open.
  if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
  open.value = false;
}
</script>

<template>
  <div
    ref="container"
    class="nc-btn-expand"
    :class="{ 'nc-btn-expand--open': open }"
    @focusout="onBlur"
  >
    <button
      :class="triggerClasses"
      @click="toggle"
      @keydown.escape="close"
    >
      {{ label }}
    </button>
    <div class="nc-btn-expand__menu">
      <button
        v-for="a in actions"
        :key="a.label"
        class="nc-btn-expand__item"
        @click="onAction(a)"
      >
        {{ a.label }}
      </button>
    </div>
  </div>
</template>
