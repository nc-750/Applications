<script setup lang="ts">
import { RotateCcw } from "lucide-vue-next";
import type { InterviewRecord } from "../../db/schema";

defineProps<{
  interview: InterviewRecord | null;
  status: string;
  showCompletion: boolean;
}>();

const emit = defineEmits<{
  import: [];
  restart: [];
}>();
</script>

<template>
  <!-- Stage -->
  <div class="flex flex-col" style="gap: var(--nc-space-2)">
    <span class="nc-label">Session</span>
    <div style="height: 1px; background: var(--nc-line-subtle);" />
    <div class="flex justify-between items-center" style="font-size: var(--nc-text-sm);">
      <span style="color: var(--nc-ink-3);">Stage</span>
      <span
        style="font-weight: var(--nc-font-medium);"
        :style="{
          color: showCompletion
            ? status === 'completed' ? 'var(--nc-success)' : status === 'error' ? 'var(--nc-error)' : 'var(--nc-accent-ink)'
            : 'var(--nc-accent-ink)'
        }"
      >
        {{ status === 'synthesizing' ? 'Analyzing' : status === 'completed' ? 'Complete' : status === 'error' ? 'Error' : 'Interviewing' }}
      </span>
    </div>
    <div class="flex justify-between items-center" style="font-size: var(--nc-text-sm);">
      <span style="color: var(--nc-ink-3);">Responses</span>
      <span style="color: var(--nc-ink); font-weight: var(--nc-font-medium);">
        {{ interview?.messages.filter(m => m.role === 'user').length ?? 0 }}
      </span>
    </div>
    <!-- Progress bar -->
    <div
      style="
        height: 3px;
        background: var(--nc-inset);
        border-radius: var(--nc-radius-full);
        overflow: hidden;
        box-shadow: var(--nc-edge-inset);
        margin-top: var(--nc-space-1);
      "
    >
      <div
        style="
          height: 100%;
          background: var(--nc-accent);
          border-radius: var(--nc-radius-full);
          transition: width 0.4s ease;
        "
        :style="{
          width: status === 'completed' ? '100%'
            : `${Math.min(100, ((interview?.messages.filter(m => m.role === 'user').length ?? 0) / 10) * 100)}%`
        }"
      />
    </div>
  </div>

  <!-- Data / import -->
  <div class="flex flex-col" style="gap: var(--nc-space-2)">
    <span class="nc-label">Data</span>
    <div style="height: 1px; background: var(--nc-line-subtle);" />
    <div
      v-if="interview?.uploadedFileNames?.length"
      class="flex flex-col"
      style="gap: var(--nc-space-1);"
    >
      <span style="font-size: var(--nc-text-xs); color: var(--nc-ink-3);">Uploaded files</span>
      <span
        v-for="name in interview.uploadedFileNames"
        :key="name"
        style="font-size: var(--nc-text-xs); color: var(--nc-ink-2); font-family: var(--nc-font-mono);"
      >{{ name }}</span>
    </div>
    <button
      class="nc-btn nc-btn--sm"
      style="width: 100%; justify-content: center;"
      @click="emit('import')"
    >
      Import CV / JSON
    </button>
  </div>

  <!-- Actions -->
  <div v-if="!showCompletion" class="flex flex-col" style="gap: var(--nc-space-2)">
    <span class="nc-label">Actions</span>
    <div style="height: 1px; background: var(--nc-line-subtle);" />
    <button
      class="nc-btn nc-btn--ghost nc-btn--sm"
      style="width: 100%; justify-content: center;"
      @click="emit('restart')"
    >
      <RotateCcw :size="13" />
      Restart interview
    </button>
  </div>

  <!-- Privacy note -->
  <div class="mt-auto flex items-center" style="gap: var(--nc-space-2); padding-top: var(--nc-space-3);">
    <div
      style="
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--nc-success);
        box-shadow: 0 0 4px var(--nc-success);
        flex-shrink: 0;
      "
    />
    <span style="font-size: var(--nc-text-xs); color: var(--nc-ink-3);">Local only · no data leaves your device</span>
  </div>
</template>
