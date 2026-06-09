<script setup lang="ts">
import { 
    Band, 
    Button, 
    Cell,
    Form,
    FormField,
    TextField,
} from "@nc-750/lab-vue";

import { useSettingsStore } from "../stores/settingsStore";
import { LLMConfig, Provider, testConnection } from "../llm";


const settingsStore = useSettingsStore();

const llmConfigFormModel: LLMConfig = {
    provider: "" as Provider,
    model: "",
    apiKey: "",
    endpoint: ""
}

function saveLLMConfig() {
    console.log('llmconfig saved');
}

function onAIProviderSelected(_event: Event) {
    llmConfigFormModel.model = "";
    llmConfigFormModel.apiKey = "";
    llmConfigFormModel.endpoint = "";
}

</script>

<template>
    <Band :grow="1">
        <Cell title="LLM CONFIG" spec="CFG // 0x01">
            <Form class="flex flex-col gap-4" @submit.prevent="saveLLMConfig">
                <FormField label="AI Provider">
                    <select class="nc-select" v-model="llmConfigFormModel.provider" @change="onAIProviderSelected">
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="mistral">Mistral</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="openai-compatible">OpenAI-Compatible (Groq, Together, Ollama, LM Studio...)</option>
                    </select>
                </FormField>
                <FormField label="Model">
                    <input class="nc-input" type="text" placeholder="gpt-4o" v-model="llmConfigFormModel.model"/>
                </FormField>
                <FormField label="Endpoint">
                    <input class="nc-input" type="url" placeholder="https://api.aiprovider.com" v-model="llmConfigFormModel.endpoint" />
                </FormField>
                <FormField label="API Key">
                    <TextField type="password" placeholder="sk-XXXX-XXXX-XXXX" v-model="llmConfigFormModel.apiKey"/>
                </FormField>
                <div class="flex gap-4 justify-between">
                    <Button variant="secondary" @click="testConnection(llmConfigFormModel)">Test Connection</Button>
                    <Button variant="accent" submit>Save</Button>
                </div>
                <Button variant="ghost">Read the privacy details →</Button>
            </Form>
        </Cell>
        <Cell title="DATA" spec="CFG // 0x02">
            <div class="flex gap-4 justify-between mb-4">
                <Button>Import persona</Button>
                <Button>Export persona</Button>
            </div>
            <h3 class="nc-label nc-label--danger">Danger Zone</h3>
            <div class="flex flex-wrap gap-2">
                <Button variant="danger" class="flex-1">Delete persona</Button>
                <Button variant="danger" class="flex-1">Clear LLM Config</Button>
                <Button variant="danger" class="flex-2">Factory reset</Button>
            </div>
        </Cell>
    </Band>
</template>
