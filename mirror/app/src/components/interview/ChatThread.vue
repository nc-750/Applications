<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { ChevronDown } from "lucide-vue-next";
import ChatBubble from "./ChatBubble.vue";
import type { InterviewMessage } from "../../db/schema";

const props = defineProps<{
  messages: InterviewMessage[];
  streamingContent: string;
  isThinking?: boolean;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const bottomRef = ref<HTMLDivElement | null>(null);
const isAtBottom = ref(true);
const showScrollBtn = ref(false);

function handleScroll() {
  const el = containerRef.value;
  if (!el) return;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  isAtBottom.value = atBottom;
  showScrollBtn.value = !atBottom;
}

function scrollToBottom() {
  bottomRef.value?.scrollIntoView({ behavior: "smooth" });
  isAtBottom.value = true;
  showScrollBtn.value = false;
}

watch(
  () => [props.messages, props.streamingContent, props.isThinking],
  async () => {
    await nextTick();
    if (isAtBottom.value) {
      bottomRef.value?.scrollIntoView({ behavior: "smooth" });
    }
  },
  { deep: true },
);
</script>

<template>
  <div class="nc-chat-thread">
    <div ref="containerRef" class="nc-chat-thread__scroll" @scroll="handleScroll">
      <ChatBubble
        v-for="(msg, i) in messages"
        :key="i"
        :role="msg.role"
        :content="msg.content"
        :is-error="msg.isError"
      />
      <ChatBubble v-if="streamingContent" role="assistant" :content="streamingContent" streaming />
      <ChatBubble v-if="isThinking && !streamingContent" role="assistant" content="" is-thinking />
      <div ref="bottomRef" />
    </div>

    <button
      v-if="showScrollBtn"
      class="nc-scroll-btn"
      title="Scroll to bottom"
      aria-label="Scroll to bottom"
      @click="scrollToBottom"
    >
      <ChevronDown :size="15" aria-hidden="true" />
    </button>
  </div>
</template>
