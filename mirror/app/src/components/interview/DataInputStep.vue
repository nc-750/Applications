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

/** Maps a file name to a scoped CSS class for its icon colour. */
function fileIconColorClass(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "data-input__file-icon--pdf";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "data-input__file-icon--html";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "data-input__file-icon--md";
  if (lower.endsWith(".json")) return "data-input__file-icon--json";
  return "data-input__file-icon--default";
}
</script>

<template>
  <div
    class="data-input__container relative flex flex-col h-full max-w-2xl mx-auto w-full"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <h2 class="data-input__title nc-heading-4">Share your background (optional)</h2>
    <p class="data-input__description nc-text-sm nc-text-secondary">
      Paste text or upload files — CV, LinkedIn export, portfolio, anything that describes you. The more context you
      share, the more targeted the interview questions will be.
    </p>

    <!-- Drag-over overlay -->
    <div
      v-if="dragging"
      class="data-input__overlay absolute inset-0 z-10 flex items-center justify-center bg-black/5"
    >
      <p class="data-input__overlay-text nc-text-md font-medium">Drop files here</p>
    </div>

    <!-- Textarea -->
    <textarea
      v-model="text"
      placeholder="Paste your CV, LinkedIn About, or a short description here…"
      class="data-input__textarea nc-textarea resize-none"
    />

    <!-- Attached files -->
    <ul v-if="attached.length > 0" class="data-input__file-list flex flex-col">
      <li
        v-for="a in attached"
        :key="a.name"
        class="data-input__file-item flex items-center"
      >
        <component
          :is="fileIconFor(a.name).icon"
          :size="14"
          class="shrink-0"
          :class="fileIconColorClass(a.name)"
          aria-hidden="true"
        />
        <span class="data-input__file-name flex-1 truncate">{{ a.name }}</span>
        <span class="nc-text-xs nc-text-muted shrink-0">{{ Math.round(a.text.length / 100) / 10 }} KB text</span>
        <button
          :title="`Remove ${a.name}`"
          :aria-label="`Remove ${a.name}`"
          class="data-input__file-remove nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm"
          @click="removeAttachment(a.name)"
        >
          <X :size="14" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <p v-if="combined.length > 0" class="data-input__token-info nc-text-xs nc-text-muted">
      ~{{ estimatedTokens.toLocaleString() }} estimated tokens
      <span v-if="isOverBudget" class="data-input__token-warning">(will be condensed)</span>
    </p>

    <!-- Error -->
    <p v-if="extractError" class="data-input__error nc-text-xs">
      {{ extractError }}
    </p>

    <!-- Attach link -->
    <button
      v-if="!attached.length && !extracting"
      class="data-input__attach-btn nc-text-sm flex items-center self-start cursor-pointer bg-transparent border-0"
      @click="fileInputRef?.click()"
    >
      <Paperclip :size="14" aria-hidden="true" />
      Attach a file (PDF, HTML, Markdown, text, JSON)
    </button>

    <!-- Extracting -->
    <div
      v-if="extracting"
      class="data-input__extracting flex items-center"
    >
      <Loader2 :size="14" class="animate-spin" aria-hidden="true" />
      Extracting text…
    </div>

    <!-- Add more -->
    <button
      v-if="attached.length > 0 && !extracting"
      class="data-input__attach-btn nc-text-sm flex items-center self-start cursor-pointer bg-transparent border-0"
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
      class="hidden"
      @change="handleFileInput"
    />

    <div
      v-if="isOverBudget"
      class="data-input__alert nc-alert nc-alert--warning"
    >
      <span class="data-input__alert-title font-medium">Large input detected.</span>
      Your data ({{ Math.round(combined.length / 1024) }} KB) exceeds the direct-context budget. The app will run a
      <span class="font-medium">{{ chunkCount }}-pass analysis</span> using your configured
      model before the interview starts. This preserves full detail but makes {{ chunkCount }} extra API call{{
        chunkCount !== 1 ? "s" : ""
      }}. You can trim or remove files to skip this step.
    </div>

    <!-- Actions -->
    <div class="data-input__actions flex">
      <button
        :disabled="!hasContent || extracting"
        class="data-input__action-btn nc-btn nc-btn--accent"
        @click="handleContinue"
      >
        <ArrowRight :size="15" aria-hidden="true" />
        Start interview
      </button>
      <button
        class="data-input__action-btn nc-btn nc-btn--secondary"
        @click="emit('continue', '', '', [])"
      >
        <SkipForward :size="15" aria-hidden="true" />
        Skip
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ── Container ── */
.data-input__container {
  padding: var(--nc-space-8) var(--nc-space-6);
}

/* ── Title ── */
.data-input__title {
  margin-bottom: var(--nc-space-2);
}

/* ── Description ── */
.data-input__description {
  margin-bottom: var(--nc-space-5);
  line-height: var(--nc-leading-relaxed);
}

/* ── Drag overlay ── */
.data-input__overlay {
  border: 2px dashed var(--nc-accent);
  border-radius: var(--nc-radius-md);
}

.data-input__overlay-text {
  color: var(--nc-accent);
}

/* ── Textarea ── */
.data-input__textarea {
  min-height: 160px;
}

/* ── File list ── */
.data-input__file-list {
  margin-top: var(--nc-space-3);
  gap: var(--nc-space-2);
}

.data-input__file-item {
  gap: var(--nc-space-3);
  padding: var(--nc-space-2) var(--nc-space-3);
  background-color: var(--nc-panel-2);
  border: var(--nc-border-width) solid var(--nc-line);
  border-radius: var(--nc-radius-md);
  font-size: var(--nc-text-sm);
}

/* Icon colours per file type */
.data-input__file-icon--pdf {
  color: var(--nc-error);
}

.data-input__file-icon--html {
  color: var(--nc-accent);
}

.data-input__file-icon--md {
  color: var(--nc-ink-2);
}

.data-input__file-icon--json {
  color: var(--nc-ink-2);
}

.data-input__file-icon--default {
  color: var(--nc-ink-3);
}

.data-input__file-name {
  color: var(--nc-ink);
}

.data-input__file-remove {
  color: var(--nc-ink-3);
  margin-left: var(--nc-space-1);
}

/* ── Token info ── */
.data-input__token-info {
  margin-top: var(--nc-space-2);
}

.data-input__token-warning {
  color: var(--nc-warning);
  margin-left: var(--nc-space-1);
}

/* ── Error ── */
.data-input__error {
  color: var(--nc-error);
  margin-top: var(--nc-space-2);
}

/* ── Attach / Add-more button ── */
.data-input__attach-btn {
  gap: var(--nc-space-2);
  margin-top: var(--nc-space-3);
  color: var(--nc-accent-ink);
}

/* ── Extracting indicator ── */
.data-input__extracting {
  gap: var(--nc-space-2);
  margin-top: var(--nc-space-3);
  font-size: var(--nc-text-sm);
  color: var(--nc-ink-2);
}

/* ── Alert ── */
.data-input__alert {
  margin-top: var(--nc-space-4);
  font-size: var(--nc-text-xs);
}

.data-input__alert-title {
  color: var(--nc-warning);
}

/* ── Actions ── */
.data-input__actions {
  gap: var(--nc-space-3);
  margin-top: var(--nc-space-6);
}

.data-input__action-btn {
  gap: var(--nc-space-2);
}
</style>
