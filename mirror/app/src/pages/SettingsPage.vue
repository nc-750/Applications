<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import {
    Band,
    Button,
    Cell,
    Form,
    FormField,
    TextField,
} from "@nc-750/lab-vue";
import { useMirrorStore } from "../stores/mirror";
import { createLLMClient } from "@nc-750/llm-ts";
import type { ProviderKind } from "@nc-750/llm-ts";
import { factoryReset } from "../lib/wipe";

const mirrorStore = useMirrorStore();

const localConfig = reactive({
    provider: "" as ProviderKind | "",
    model: "",
    apiKey: "",
    endpoint: "",
});

// Sync store -> local when store loads or config changes
watch(() => mirrorStore.llmConfig, (config) => {
    if (config) {
        localConfig.provider = config.provider;
        localConfig.model = config.model;
        localConfig.apiKey = config.apiKey;
        localConfig.endpoint = config.endpoint ?? "";
    } else {
        localConfig.provider = "";
        localConfig.model = "";
        localConfig.apiKey = "";
        localConfig.endpoint = "";
    }
}, { immediate: true });

const testMessage = ref("");
const testing = ref(false);

async function saveLLMConfig() {
    if (!localConfig.provider || !localConfig.model || !localConfig.apiKey) return;
    await mirrorStore.saveLLMConfig({
        provider: localConfig.provider as ProviderKind,
        model: localConfig.model,
        apiKey: localConfig.apiKey,
        endpoint: localConfig.endpoint || undefined,
    });
}

async function testConnectionHandler() {
    if (!localConfig.provider || !localConfig.model || !localConfig.apiKey) {
        testMessage.value = "Please fill in provider, model, and API key first.";
        return;
    }

    testing.value = true;
    testMessage.value = "";

    try {
        const keyProvider = async () => localConfig.apiKey;
        const clientResult = createLLMClient({
            provider: localConfig.provider as ProviderKind,
            model: localConfig.model,
            keyProvider,
            baseUrl: localConfig.endpoint || undefined,
        });

        if (!clientResult.ok) {
            testMessage.value = `Error: ${clientResult.error.message}`;
            testing.value = false;
            return;
        }

        const llm = clientResult.value;
        const start = Date.now();
        const msgResult = await llm.message("Reply with the single word: ok");
        const latency = Date.now() - start;

        if (msgResult.ok) {
            testMessage.value = `Connected! Latency: ${latency}ms`;
        } else {
            testMessage.value = `Error: ${msgResult.error.message}`;
        }
    } catch (e) {
        testMessage.value = `Error: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
        testing.value = false;
    }
}

function onAIProviderSelected() {
    localConfig.model = "";
    localConfig.apiKey = "";
    localConfig.endpoint = "";
}

// Import / Export persona
const fileInputRef = ref<HTMLInputElement | null>(null);

function handleImportPersona(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) {
        // TODO Phase 2: personaStore.importFromJSON
        target.value = "";
    }
}

function handleExportPersona() {
    // TODO Phase 2
}

function handleDeletePersona() {
    // TODO Phase 2
}

async function handleClearLLMConfig() {
    await mirrorStore.clearLLMConfig();
    localConfig.provider = "";
    localConfig.model = "";
    localConfig.apiKey = "";
    localConfig.endpoint = "";
}
</script>

<template>
    <Band :grow="1">
        <Cell title="LLM CONFIG" spec="CFG // 0x01">
            <Form class="flex flex-col gap-4" @submit.prevent="saveLLMConfig">
                <FormField label="AI Provider">
                    <select class="nc-select" v-model="localConfig.provider" @change="onAIProviderSelected">
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="openai-compatible">OpenAI-Compatible (Groq, Together, Ollama, LM Studio...)</option>
                    </select>
                </FormField>
                <FormField label="Model">
                    <input class="nc-input" type="text" placeholder="gpt-4o" v-model="localConfig.model"/>
                </FormField>
                <FormField label="Endpoint">
                    <input class="nc-input" type="url" placeholder="https://api.aiprovider.com" v-model="localConfig.endpoint" />
                </FormField>
                <FormField label="API Key">
                    <TextField type="password" placeholder="sk-XXXX-XXXX-XXXX" v-model="localConfig.apiKey"/>
                </FormField>
                <p v-if="testMessage" class="nc-text-sm" :class="testMessage.startsWith('Connected') ? 'text-green-600' : 'text-red-600'">{{ testMessage }}</p>
                <div class="flex gap-4 justify-between">
                    <Button variant="secondary" :disabled="testing" @click="testConnectionHandler">{{ testing ? 'Testing...' : 'Test Connection' }}</Button>
                    <Button variant="accent" submit :disabled="!localConfig.provider || !localConfig.model || !localConfig.apiKey">Save</Button>
                </div>
                <Button variant="ghost">Read the privacy details →</Button>
            </Form>
        </Cell>
        <Cell title="DATA" spec="CFG // 0x02">
            <div class="flex gap-4 justify-between mb-4">
                <Button @click="fileInputRef?.click()">Import persona</Button>
                <Button @click="handleExportPersona">Export persona</Button>
            </div>
            <input
                ref="fileInputRef"
                type="file"
                accept=".json"
                class="hidden"
                @change="handleImportPersona"
            />
            <h3 class="nc-label nc-label--danger">Danger Zone</h3>
            <div class="flex flex-wrap gap-2">
                <Button variant="danger" class="flex-1" @click="handleDeletePersona">Delete persona</Button>
                <Button variant="danger" class="flex-1" @click="handleClearLLMConfig">Clear LLM Config</Button>
                <Button variant="danger" class="flex-2" @click="factoryReset">Factory reset</Button>
            </div>
        </Cell>
    </Band>
</template>
