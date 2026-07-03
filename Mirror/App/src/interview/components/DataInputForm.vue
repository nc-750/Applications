<script setup lang="ts">
import { ref, computed, type Component } from "vue";
import { ArrowRight, Paperclip, X, Loader2, FileText, FileCode, File } from "lucide-vue-next";
import { extractText, isSupportedFile, ACCEPT_STRING } from "../../fileManager/services/fileExtractor";
import { estimateTokens, DIGEST_THRESHOLD_CHARS, DIGEST_CHUNK_CHARS } from "../services";

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

function fileIconColorClass(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "dif-icon--pdf";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "dif-icon--html";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "dif-icon--md";
  if (lower.endsWith(".json")) return "dif-icon--json";
  return "dif-icon--default";
}
</script>

<template>
  <div
    class="relative flex flex-col h-full max-w-2xl mx-auto w-full py-8 px-6"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <h2 class="nc-heading-4 dif-title">Share your background (optional)</h2>
    <p class="nc-text-sm nc-text-secondary dif-desc">
      Paste text or upload files — CV, LinkedIn export, portfolio, anything that describes you. The more context you
      share, the more targeted the interview questions will be.
    </p>

    <!-- Drag-over overlay -->
    <div
      v-if="dragging"
      class="dif-overlay absolute inset-0 z-10 flex items-center justify-center bg-black/5"
    >
      <p class="dif-overlay-text nc-text-md font-medium">Drop files here</p>
    </div>

    <!-- Textarea -->
    <textarea
      v-model="text"
      placeholder="Paste your CV, LinkedIn About, or a short description here…"
      class="nc-textarea resize-none dif-textarea"
    />

    <!-- Attached files -->
    <ul v-if="attached.length > 0" class="flex flex-col mt-3 gap-2">
      <li
        v-for="a in attached"
        :key="a.name"
        class="dif-file-item flex items-center gap-3"
      >
        <component
          :is="fileIconFor(a.name).icon"
          :size="14"
          class="shrink-0"
          :class="fileIconColorClass(a.name)"
          aria-hidden="true"
        />
        <span class="dif-file-name flex-1 truncate">{{ a.name }}</span>
        <span class="nc-text-xs nc-text-muted shrink-0">{{ Math.round(a.text.length / 100) / 10 }} KB text</span>
        <button
          :title="`Remove ${a.name}`"
          :aria-label="`Remove ${a.name}`"
          class="nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm dif-file-remove"
          @click="removeAttachment(a.name)"
        >
          <X :size="14" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <p v-if="combined.length > 0" class="nc-text-xs nc-text-muted dif-token-info">
      ~{{ estimatedTokens.toLocaleString() }} estimated tokens
      <span v-if="isOverBudget" class="dif-token-warning">(will be condensed)</span>
    </p>

    <!-- Error -->
    <p v-if="extractError" class="nc-text-xs dif-error">
      {{ extractError }}
    </p>

    <!-- Attach link -->
    <button
      v-if="!attached.length && !extracting"
      class="nc-text-sm flex items-center gap-2 self-start cursor-pointer bg-transparent border-0 dif-attach-btn"
      @click="fileInputRef?.click()"
    >
      <Paperclip :size="14" aria-hidden="true" />
      Attach a file (PDF, HTML, Markdown, text, JSON)
    </button>

    <!-- Extracting -->
    <div
      v-if="extracting"
      class="flex items-center gap-2 dif-extracting"
    >
      <Loader2 :size="14" class="animate-spin" aria-hidden="true" />
      Extracting text…
    </div>

    <!-- Add more -->
    <button
      v-if="attached.length > 0 && !extracting"
      class="nc-text-sm flex items-center gap-2 self-start cursor-pointer bg-transparent border-0 dif-attach-btn"
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
      class="nc-alert nc-alert--warning dif-alert"
    >
      <span class="dif-alert-title font-medium">Large input detected.</span>
      Your data ({{ Math.round(combined.length / 1024) }} KB) exceeds the direct-context budget. The app will run a
      <span class="font-medium">{{ chunkCount }}-pass analysis</span> using your configured
      model before the interview starts. This preserves full detail but makes {{ chunkCount }} extra API call{{
        chunkCount !== 1 ? "s" : ""
      }}. You can trim or remove files to skip this step.
    </div>

    <!-- Actions -->
    <div class="flex gap-3 mt-6">
      <button
        :disabled="!hasContent || extracting"
        class="nc-btn nc-btn--accent dif-action-btn"
        @click="handleContinue"
      >
        <ArrowRight :size="15" aria-hidden="true" />
        Start interview
      </button>
    </div>
  </div>
</template>

<style scoped>
/* kept: no .nc-* class for title bottom margin */
.dif-title {
    margin-bottom: var(--nc-space-2);
}

/* kept: no .nc-* class for description bottom margin + line-height */
.dif-desc {
    margin-bottom: var(--nc-space-5);
    line-height: var(--nc-leading-relaxed);
}

/* kept: no .nc-* class for dashed overlay border + radius */
.dif-overlay {
    border: 2px dashed var(--nc-accent);
    border-radius: var(--nc-radius-md);
}

/* kept: no .nc-* class for accent-coloured overlay text */
.dif-overlay-text {
    color: var(--nc-accent);
}

/* kept: no .nc-* class for textarea min-height */
.dif-textarea {
    min-height: 160px;
}

/* kept: no .nc-* class for file-item surface (background + border + radius) */
.dif-file-item {
    padding: var(--nc-space-2) var(--nc-space-3);
    background-color: var(--nc-panel-2);
    border: var(--nc-border-width) solid var(--nc-line);
    border-radius: var(--nc-radius-md);
    font-size: var(--nc-text-sm);
}

/* File icon colours — no .nc-* classes for per-type icon colour */
.dif-icon--pdf  { color: var(--nc-error); }
.dif-icon--html { color: var(--nc-accent); }
.dif-icon--md   { color: var(--nc-ink-2); }
.dif-icon--json { color: var(--nc-ink-2); }
.dif-icon--default { color: var(--nc-ink-3); }

/* kept: no .nc-* class for ink file-name colour */
.dif-file-name {
    color: var(--nc-ink);
}

/* kept: no .nc-* class for ink-3 remove-button colour + left margin */
.dif-file-remove {
    color: var(--nc-ink-3);
    margin-left: var(--nc-space-1);
}

/* kept: no .nc-* class for token-info top margin */
.dif-token-info {
    margin-top: var(--nc-space-2);
}

/* kept: no .nc-* class for warning-coloured token span */
.dif-token-warning {
    color: var(--nc-warning);
    margin-left: var(--nc-space-1);
}

/* kept: no .nc-* class for error-text colour + top margin */
.dif-error {
    color: var(--nc-error);
    margin-top: var(--nc-space-2);
}

/* kept: no .nc-* class for accent-ink attach button + focus ring */
.dif-attach-btn {
    margin-top: var(--nc-space-3);
    color: var(--nc-accent-ink);
}

.dif-attach-btn:focus-visible {
    outline: 2px solid var(--nc-accent);
    outline-offset: 2px;
}

/* kept: no .nc-* class for extracting-indicator colour + top margin */
.dif-extracting {
    margin-top: var(--nc-space-3);
    color: var(--nc-ink-2);
}

/* kept: no .nc-* class for alert top margin + small font */
.dif-alert {
    margin-top: var(--nc-space-4);
    font-size: var(--nc-text-xs);
}

/* kept: no .nc-* class for warning-coloured alert title */
.dif-alert-title {
    color: var(--nc-warning);
}

/* kept: no .nc-* class for action-button internal gap */
.dif-action-btn {
    gap: var(--nc-space-2);
}
</style>
