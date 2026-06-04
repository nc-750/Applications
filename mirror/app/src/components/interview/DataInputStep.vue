<script setup lang="ts">
import { ref, computed, type Component } from "vue";
import { ArrowRight, SkipForward, Paperclip, X, Loader2, FileText, FileCode, File } from "lucide-vue-next";
import { extractText, isSupportedFile, ACCEPT_STRING } from "../../lib/fileExtractor";
import { estimateTokens, DIGEST_THRESHOLD_CHARS, DIGEST_CHUNK_CHARS } from "../../skills/dataDigest";

interface AttachedFile {
  name: string;
  text: string;
}

const emit = defineEmits<{
  continue: [data: string, inputText: string, fileNames: string[]];
}>();

const text = ref("");
const attached = ref<AttachedFile[]>([]);
const extracting = ref(false);
const extractError = ref("");
const dragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

async function processFiles(files: FileList | File[]) {
  const list = Array.from(files).filter(isSupportedFile);
  if (!list.length) {
    extractError.value = "No supported files found. Accepted: PDF, HTML, Markdown, plain text.";
    return;
  }
  extracting.value = true;
  extractError.value = "";
  try {
    const results = await Promise.all(
      list.map(async (f) => ({ name: f.name, text: await extractText(f) })),
    );
    const names = new Set(attached.value.map((a) => a.name));
    attached.value = [...attached.value, ...results.filter((r) => !names.has(r.name))];
  } catch (e) {
    extractError.value = e instanceof Error ? e.message : "Failed to read file.";
  } finally {
    extracting.value = false;
  }
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files?.length) {
    processFiles(target.files);
    target.value = "";
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  dragging.value = true;
}

function handleDragLeave(e: DragEvent) {
  if (!(e.currentTarget as Node).contains(e.relatedTarget as Node)) dragging.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  dragging.value = false;
  if (e.dataTransfer?.files.length) processFiles(e.dataTransfer.files);
}

function removeAttachment(name: string) {
  attached.value = attached.value.filter((a) => a.name !== name);
}

const attachedBlock = computed(() => attached.value.map((a) => `--- ${a.name} ---\n${a.text}`).join("\n\n"));
const combined = computed(() => [text.value.trim(), attachedBlock.value].filter(Boolean).join("\n\n"));
const estimatedTokens = computed(() => estimateTokens(combined.value));
const isOverBudget = computed(() => combined.value.length > DIGEST_THRESHOLD_CHARS);
const chunkCount = computed(() => Math.ceil(combined.value.length / DIGEST_CHUNK_CHARS));
const hasContent = computed(() => !!text.value.trim() || attached.value.length > 0);

function handleContinue() {
  emit(
    "continue",
    combined.value,
    text.value.trim(),
    attached.value.map((a) => a.name),
  );
}

function fileIconFor(name: string): { icon: Component; color: string } {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return { icon: File, color: "var(--nc-error)" };
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return { icon: FileCode, color: "var(--nc-accent)" };
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return { icon: FileText, color: "var(--nc-ink-2)" };
  if (lower.endsWith(".json")) return { icon: FileCode, color: "var(--nc-ink-2)" };
  return { icon: FileText, color: "var(--nc-ink-3)" };
}
</script>

<template>
  <div
    class="relative flex flex-col h-full"
    :style="{ padding: 'var(--nc-space-8) var(--nc-space-6)', maxWidth: '42rem', margin: '0 auto', width: '100%' }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <h2 class="nc-heading-4" :style="{ marginBottom: 'var(--nc-space-2)' }">Share your background (optional)</h2>
    <p
      class="nc-text-sm nc-text-secondary"
      :style="{ marginBottom: 'var(--nc-space-5)', lineHeight: 'var(--nc-leading-relaxed)' }"
    >
      Paste text or upload files — CV, LinkedIn export, portfolio, anything that describes you. The more context you
      share, the more targeted the interview questions will be.
    </p>

    <!-- Drag-over overlay -->
    <div v-if="dragging" class="absolute inset-0 z-10 flex items-center justify-center" style="background: rgba(0,0,0,0.05); border: 2px dashed var(--nc-accent); border-radius: var(--nc-radius-md);">
      <p class="nc-text-md nc-font-medium" :style="{ color: 'var(--nc-accent)' }">Drop files here</p>
    </div>

    <!-- Textarea -->
    <textarea
      v-model="text"
      placeholder="Paste your CV, LinkedIn About, or a short description here…"
      class="nc-textarea"
      :style="{ minHeight: '160px', resize: 'none' }"
    />

    <!-- Attached files -->
    <ul v-if="attached.length > 0" class="flex flex-col" :style="{ marginTop: 'var(--nc-space-3)', gap: 'var(--nc-space-2)' }">
      <li
        v-for="a in attached"
        :key="a.name"
        class="flex items-center"
        :style="{
          gap: 'var(--nc-space-3)',
          padding: 'var(--nc-space-2) var(--nc-space-3)',
          backgroundColor: 'var(--nc-panel-2)',
          border: 'var(--nc-border-width) solid var(--nc-line)',
          borderRadius: 'var(--nc-radius-md)',
          fontSize: 'var(--nc-text-sm)',
        }"
      >
        <component
          :is="fileIconFor(a.name).icon"
          :size="14"
          class="shrink-0"
          :style="{ color: fileIconFor(a.name).color }"
          aria-hidden="true"
        />
        <span class="flex-1 truncate" :style="{ color: 'var(--nc-ink)' }">{{ a.name }}</span>
        <span class="nc-text-xs nc-text-muted shrink-0">{{ Math.round(a.text.length / 100) / 10 }} KB text</span>
        <button
          title="Remove"
          :aria-label="`Remove ${a.name}`"
          :style="{ color: 'var(--nc-ink-3)', marginLeft: 'var(--nc-space-1)' }"
          class="nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm"
          @click="removeAttachment(a.name)"
        >
          <X :size="14" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <p v-if="combined.length > 0" class="nc-text-xs nc-text-muted" :style="{ marginTop: 'var(--nc-space-2)' }">
      ~{{ estimatedTokens.toLocaleString() }} estimated tokens
      <span v-if="isOverBudget" :style="{ color: 'var(--nc-warning)', marginLeft: 'var(--nc-space-1)' }"
        >(will be condensed)</span
      >
    </p>

    <!-- Error -->
    <p v-if="extractError" class="nc-text-xs" :style="{ color: 'var(--nc-error)', marginTop: 'var(--nc-space-2)' }">
      {{ extractError }}
    </p>

    <!-- Attach link -->
    <button
      v-if="!attached.length && !extracting"
      class="nc-text-sm"
      style="display: flex; align-items: center; gap: var(--nc-space-2); margin-top: var(--nc-space-3); align-self: flex-start; color: var(--nc-accent-ink); background: none; border: none; cursor: pointer;"
      @click="fileInputRef?.click()"
    >
      <Paperclip :size="14" aria-hidden="true" />
      Attach a file (PDF, HTML, Markdown, text, JSON)
    </button>

    <!-- Extracting -->
    <div
      v-if="extracting"
      class="flex items-center"
      :style="{ gap: 'var(--nc-space-2)', marginTop: 'var(--nc-space-3)', fontSize: 'var(--nc-text-sm)', color: 'var(--nc-ink-2)' }"
    >
      <Loader2 :size="14" class="animate-spin" aria-hidden="true" />
      Extracting text…
    </div>

    <!-- Add more -->
    <button
      v-if="attached.length > 0 && !extracting"
      class="nc-text-sm"
      style="display: flex; align-items: center; gap: var(--nc-space-2); margin-top: var(--nc-space-3); align-self: flex-start; color: var(--nc-accent-ink); background: none; border: none; cursor: pointer;"
      @click="fileInputRef?.click()"
    >
      <Paperclip :size="14" aria-hidden="true" />
      Add another file
    </button>

    <input
      ref="fileInputRef"
      type="file"
      :accept="ACCEPT_STRING"
      multiple
      :style="{ display: 'none' }"
      @change="handleFileInput"
    />

    <div
      v-if="isOverBudget"
      class="nc-alert nc-alert--warning"
      :style="{ marginTop: 'var(--nc-space-4)', fontSize: 'var(--nc-text-xs)' }"
    >
      <span :style="{ fontWeight: 'var(--nc-font-medium)', color: 'var(--nc-warning)' }">Large input detected.</span>
      Your data ({{ Math.round(combined.length / 1024) }} KB) exceeds the direct-context budget. The app will run a
      <span :style="{ fontWeight: 'var(--nc-font-medium)' }">{{ chunkCount }}-pass analysis</span> using your configured
      model before the interview starts. This preserves full detail but makes {{ chunkCount }} extra API call{{
        chunkCount !== 1 ? "s" : ""
      }}. You can trim or remove files to skip this step.
    </div>

    <!-- Actions -->
    <div class="flex" style="gap: var(--nc-space-3); margin-top: var(--nc-space-6);">
      <button
        :disabled="!hasContent || extracting"
        class="nc-btn nc-btn--accent"
        :style="{ gap: 'var(--nc-space-2)' }"
        @click="handleContinue"
      >
        <ArrowRight :size="15" aria-hidden="true" />
        Start interview
      </button>
      <button
        class="nc-btn nc-btn--secondary"
        :style="{ gap: 'var(--nc-space-2)' }"
        @click="emit('continue', '', '', [])"
      >
        <SkipForward :size="15" aria-hidden="true" />
        Skip
      </button>
    </div>
  </div>
</template>
