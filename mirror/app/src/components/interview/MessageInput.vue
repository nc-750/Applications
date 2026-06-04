<script setup lang="ts">
import { ref } from "vue";
import { Send, Square, Paperclip } from "lucide-vue-next";
import { extractText, ACCEPT_STRING } from "../../lib/fileExtractor";

const props = defineProps<{
  disabled?: boolean;
  streaming?: boolean;
}>();

const emit = defineEmits<{
  send: [text: string];
  abort: [];
}>();

const value = ref("");
const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

async function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const text = await extractText(file);
    emit("send", `[Attached: ${file.name}]\n\n${text}`);
  } catch {
    alert(`Could not read ${file.name}`);
  } finally {
    uploading.value = false;
    target.value = "";
  }
}

function handleSend() {
  const text = value.value.trim();
  if (!text || props.disabled) return;
  value.value = "";
  emit("send", text);
}

function handleKey(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}
</script>

<template>
  <div
    :style="{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 'var(--nc-space-2)',
      padding: 'var(--nc-space-3) var(--nc-space-4)',
      borderTop: 'var(--nc-border-width) solid var(--nc-line)',
      backgroundColor: 'var(--nc-bg)',
    }"
  >
    <input
      ref="fileInputRef"
      type="file"
      :accept="ACCEPT_STRING"
      :style="{ display: 'none' }"
      @change="handleFileChange"
    />

    <!-- Attach -->
    <button
      :disabled="disabled || streaming || uploading"
      title="Attach document"
      aria-label="Attach document"
      class="nc-btn nc-btn--icon nc-btn--ghost"
      :style="{ width: '36px', height: '36px' }"
      @click="fileInputRef?.click()"
    >
      <Paperclip :size="15" aria-hidden="true" />
    </button>

    <!-- Textarea -->
    <textarea
      v-model="value"
      :disabled="disabled || streaming"
      :rows="3"
      :placeholder="
        streaming
          ? 'Waiting for response…'
          : 'Type a message… (Enter to send, Shift+Enter for new line)'
      "
      class="nc-textarea"
      :style="{ flex: 1, minHeight: '72px', maxHeight: '16rem', overflowY: 'auto', resize: 'vertical' }"
      @keydown="handleKey"
    />

    <!-- Send / Stop -->
    <button
      v-if="streaming"
      title="Stop"
      aria-label="Stop response"
      class="nc-btn nc-btn--icon nc-btn--danger"
      :style="{ width: '36px', height: '36px' }"
      @click="emit('abort')"
    >
      <Square :size="15" aria-hidden="true" />
    </button>
    <button
      v-else
      :disabled="!value.trim() || disabled"
      title="Send"
      aria-label="Send message"
      class="nc-btn nc-btn--icon nc-btn--accent"
      :style="{ width: '36px', height: '36px' }"
      @click="handleSend"
    >
      <Send :size="15" aria-hidden="true" />
    </button>
  </div>
</template>
