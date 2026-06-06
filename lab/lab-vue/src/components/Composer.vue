<script setup lang="ts">
const model = defineModel<string>({ default: "" });

defineProps<{
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  /** Fires when the user submits a message (Enter without Shift). */
  send: [value: string];
}>();

function onSend() {
  const trimmed = model.value.trim();
  if (trimmed) {
    emit("send", trimmed);
    model.value = "";
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
}
</script>

<template>
  <div class="nc-composer">
    <textarea
      class="nc-composer__input"
      v-model="model"
      :placeholder="placeholder ?? 'Type a message...'"
      :disabled="disabled"
      :rows="1"
      @keydown="onKeydown"
    />
    <div class="nc-composer__actions">
      <slot name="actions" />
      <button
        class="nc-btn nc-btn--accent nc-btn--sm nc-composer__send"
        :disabled="disabled || !model.trim()"
        @click="onSend"
      >
        <slot name="send-label">Send</slot>
      </button>
    </div>
  </div>
</template>
