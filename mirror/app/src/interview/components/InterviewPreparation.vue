<script setup lang="ts">
import { ref } from 'vue';
import { Band, Cell } from '@nc-750/lab-vue';
import { AttachedFile, ACCEPT_STRING, extractText, isSupportedFile } from '../../lib/fileExtractor';

const emit = defineEmits<{
    startInterview: [userInput: string, attachedFiles: AttachedFile[]];
}>();

const attachedFiles = ref<AttachedFile[]>([]);
const estimatedTokens = ref(0);
const isOverBudget = ref(false);
const isExtracting = ref(false);
const extractionError = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const chunkCount = ref(0);
const userTextInput = ref("");
const isDragging = ref(false);

function removeAttachment(name: string) {
    attachedFiles.value = attachedFiles.value.filter((file) => file.name !== name);
}

function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;

    if (target.files?.length) {
        processFiles(target.files);
        target.value = "";
    }
}

async function processFiles(files: FileList | File[]) {
    const validFiles = Array.from(files).filter(isSupportedFile);

    if (!validFiles.length) {
        extractionError.value = "No supported files found. Accepted: PDF, HTML, Markdown, Plain Text.";
        return;
    }

    isExtracting.value = true;
    extractionError.value = "";

    try {
        const results: AttachedFile[] = await Promise.all(validFiles.map(
            async (file) => ({
                name: file.name,
                text: await extractText(file)
            })
        ));

        attachedFiles.value = [...attachedFiles.value, ...results];
    } catch (e) {
        extractionError.value = e instanceof Error ? e.message : "Failed to read file.";
    } finally {
        isExtracting.value = false;
    }
} 

function startInterview() {
    emit(
        "startInterview",
        userTextInput.value,
        attachedFiles.value
    );
}

function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging.value = true;
}

function handleDragLeave(e: DragEvent) {
    if (!(e.currentTarget as Node).contains(e.relatedTarget as Node)) {
        isDragging.value = false;
    }
}

function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging.value = false;

    if (e.dataTransfer?.files.length) {
        processFiles(e.dataTransfer.files);
    }
}
</script>

<template>
    <Band :grow="1">
        <Cell 
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
        >
            <div class="flex flex-col h-full items-center">
                <div class="mb-4">
                    <h2 class="nc-heading-2">Share your background</h2>
                    <p class="nc-text-secondary">
                        Anything that describes you. The more context you share, the more targeted the interview questions will be.
                    </p>
                </div>

                <!-- User initial description text -->
                <textarea
                    v-model="userTextInput"
                    class="nc-textarea flex-auto mb-4"
                    placeholder="Paste your CV, LinkedIn About, or a short description here…"
                />

                <!-- Attached files -->
                <ul v-if="attachedFiles.length > 0" class="flex w-full mb-4 gap-2">
                    <li
                        v-for="a in attachedFiles"
                        :key="a.name"
                        class="flex items-center border rounded-sm p-1"
                    >
                        <!-- <component
                            :is="fileIconFor(a.name).icon"
                            :size="14"
                            class="shrink-0"
                            :class="fileIconColorClass(a.name)"
                            aria-hidden="true"
                        /> -->
                        <span class="flex-1 truncate mr-2">{{ a.name }}</span>
                        <span class="nc-text-xs nc-text-muted shrink-0 mr-1">{{ Math.round(a.text.length / 100) / 10 }} KB</span>
                        <button
                            :title="`Remove ${a.name}`"
                            :aria-label="`Remove ${a.name}`"
                            class="nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm"
                            @click="removeAttachment(a.name)"
                        >
                        X
                        </button>
                    </li>
                </ul>

                <!-- Error -->
                <p v-if="extractionError" class="nc-text-xs">
                    {{ extractionError }}
                </p>

                <div
                    v-if="isExtracting"
                    class="flex items-center"
                >
                    Extracting text…
                </div>

                <div class="flex w-full justify-between">
                    <button
                    :disabled="isExtracting"
                    class="nc-btn nc-btn--ghost nc-text-sm flex items-center self-start cursor-pointer"
                    @click="fileInputRef?.click()"
                    >
                        Attach a file (PDF, HTML, Markdown, text, JSON)
                    </button>
                    <button
                        :disabled="!(userTextInput.length <= 0) || isExtracting"
                        class="nc-btn nc-btn--accent"
                        @click="startInterview"
                    >
                        Start interview
                    </button>
                </div>
                
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
                    class="nc-alert nc-alert--warning"
                >
                    <span class="font-medium">Large input detected.</span>
                    Your data ({{ Math.round(estimatedTokens / 1024) }} KB) exceeds the direct-context budget. The app will run a
                    <span class="font-medium">{{ chunkCount }}-pass analysis</span> using your configured
                    model before the interview starts. This preserves full detail but makes {{ chunkCount }} extra API call{{
                        chunkCount !== 1 ? "s" : ""
                    }}. You can trim or remove files to skip this step.
                </div>
            </div>
        </Cell>
    </Band>
</template>