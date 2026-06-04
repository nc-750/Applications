<script setup lang="ts">
import { computed } from "vue";
import LogoMark from "../ui/LogoMark.vue";

const props = defineProps<{
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  isThinking?: boolean;
  isError?: boolean;
}>();

const isUser = computed(() => props.role === "user");
</script>

<template>
  <!-- Thinking indicator -->
  <div v-if="isThinking" class="nc-msg-row nc-msg-row--assistant">
    <div class="nc-avatar-mark nc-avatar-mark--assistant" aria-hidden="true">
      <LogoMark :size="14" />
    </div>
    <div class="nc-bubble--thinking">
      <span
        v-for="delay in [0, 150, 300]"
        :key="delay"
        class="nc-dot"
        :style="{ animationDelay: `${delay}ms` }"
      />
    </div>
  </div>

  <!-- Message bubble -->
  <div v-else class="nc-msg-row" :class="isUser ? 'nc-msg-row--user' : 'nc-msg-row--assistant'">
    <div
      v-if="!isUser"
      class="nc-avatar-mark"
      :class="isError ? 'nc-avatar-mark--error' : 'nc-avatar-mark--assistant'"
      aria-hidden="true"
    >
      <span
        v-if="isError"
        :style="{ fontSize: 'var(--nc-text-xs)', fontWeight: 'var(--nc-font-semibold)', lineHeight: 1 }"
        >!</span
      >
      <LogoMark v-else :size="14" />
    </div>

    <div
      class="nc-bubble"
      :class="isError ? 'nc-bubble--error' : isUser ? 'nc-bubble--user' : 'nc-bubble--assistant'"
    >
      <p class="nc-pre-wrap">{{ content }}</p>
      <span v-if="streaming" class="nc-bubble__cursor" aria-hidden="true" />
    </div>
  </div>
</template>
