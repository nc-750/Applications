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
import { createLLMClient } from "@nc-750/llm-ts";
import type { ProviderKind } from "@nc-750/llm-ts";
import { useAppStore } from "../../AppStore";
import { LLMProvider } from "../models";
import { logger } from "../../logger";
import { factoryReset } from "../services/wipe";

const appStore = useAppStore();
const settingsStore = appStore.settings;
const logStore = appStore.logger;

const localConfig = reactive({
    provider: "" as LLMProvider | "",
    model: "",
    apiKey: "",
    endpoint: "",
});

// Sync store -> local when store loads or config changes
watch(() => settingsStore.llmConfig, (config) => {
    if (config) {
        localConfig.provider = config.provider;
        localConfig.model = config.model;
        localConfig.apiKey = config.apiKey;
        localConfig.endpoint = config.endpoint;
    } else {
        localConfig.provider = "";
        localConfig.model = "";
        localConfig.apiKey = "";
        localConfig.endpoint = "";
    }
}, { immediate: true });

const testMessage = ref("");
const testing = ref(false);
const isDebugOn = ref(false);

async function save() {
    if (!localConfig.provider || !localConfig.model || !localConfig.apiKey || !localConfig.endpoint) return;
    
    await settingsStore.saveSettings({
        provider: localConfig.provider,
        model: localConfig.model,
        apiKey: localConfig.apiKey,
        endpoint: localConfig.endpoint,
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
        

        let provider: ProviderKind = "openai-compatible";
         
        switch (Number(localConfig.provider)) {
            case LLMProvider.OpenAI: 
                provider = "openai";
                break;
            case LLMProvider.Anthropic: 
                provider = "anthropic";
                break;
            case LLMProvider.CompatibleOpenAI: 
                provider = "openai-compatible";
                break;
        }
        
        const clientResult = createLLMClient({
            provider: provider,
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

// async function importPersonaFromJSON(json: string) {
//     // parsePersonaJSON validates every field against the Zod schema and throws
//     // a single-line, field-pointing error on the first issue.
//     const parsed = parsePersonaJSON(JSON.parse(json));
//     persona.value = await writePersona(parsed, []);
//     logger.info("import", "Mirror imported successfully");
// }

async function handleImportPersona(e: Event) {
    logger.debug("app", "TODO: Implement import Persona from JSON");
    // const target = e.target as HTMLInputElement;
    // if (target.files?.length) {
    //     try {
    //         const text = await target.files[0].text();
            
    //         // let newPersona = await importPersonaFromJSON(text);

    //         // personaStore.savePersona(newPersona);
    //     } catch (err) {
    //         testMessage.value = `Import failed: ${err instanceof Error ? err.message : String(err)}`;
    //     }
    //     target.value = "";
    // }
}

function handleExportPersona() {
    logger.debug("app", "TODO: Implement exporting Persona data");
    // const p = personaStore.persona;
    // if (!p) return;
    // const json = JSON.stringify(p.data, null, 2);
    // const name = p.data.persona.identity.name.replace(/\s+/g, "-").toLowerCase() || "mirror";
    // downloadFile(json, `${name}-mirror.json`, "application/json");
}

async function handleDeletePersona() {
    logger.debug("app", "Implement deleting Persona data");
    // await mirrorStore.clearPersona();
}

async function handleClearLLMConfig() {
    await settingsStore.clearSettings();
    localConfig.provider = "";
    localConfig.model = "";
    localConfig.apiKey = "";
    localConfig.endpoint = "";
}

function toggleDebug() {
    isDebugOn.value = logStore.debugEnabled;

    if (isDebugOn.value) {
        logStore.setDebugEnabled(false);
    } else {
        logStore.setDebugEnabled(true);
    }

    isDebugOn.value = logStore.debugEnabled;
}
</script>

<template>
    <Band :grow="1">
        <Cell title="LLM CONFIG" spec="CFG // 0x01">
            <Form class="flex flex-col gap-4" @submit.prevent="save">
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
                <router-link to="/privacy" class="nc-btn nc-btn--ghost">Read the privacy details →</router-link>
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
            <div class="flex flex-wrap gap-2 mb-4">
                <Button variant="danger" class="flex-1" @click="handleDeletePersona">Delete persona</Button>
                <Button variant="danger" class="flex-1" @click="handleClearLLMConfig">Clear LLM Config</Button>
                <Button variant="danger" class="flex-2" @click="factoryReset">Factory reset</Button>
            </div>
            <h3 class="nc-label">Debug</h3>
            <div class="flex">
                <Button variant="secondary" @click="toggleDebug">Debug {{ isDebugOn ? "On" : "Off" }}</Button>
            </div>
        </Cell>
    </Band>
</template>
