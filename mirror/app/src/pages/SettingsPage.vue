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

const settingsStore = useSettingsStore();

function saveLLMConfig() {
    console.log('llmconfig saved');
}
</script>

<template>
    <Band :grow="1">
        <Cell title="LLM CONFIG" spec="CFG // 0x01">
            <Form class="flex flex-col gap-4" @submit.prevent="saveLLMConfig">
                <FormField label="AI Provider">
                    <select class="nc-select">
                        <option value="OpenAI">OpenAI</option>
                        <option value="Anthropic">Anthropic</option>
                        <option value="Mistral">Mistral</option>
                        <option value="DeepSeek">DeepSeek</option>
                        <option value="OpenAI-Compatible">OpenAI-Compatible (Groq, Together, Ollama, LM Studio...)</option>
                    </select>
                </FormField>
                <FormField label="Model">
                    <TextField type="text" placeholder="gpt-4o" />
                </FormField>
                <FormField label="Model">
                    <TextField type="url" placeholder="https://api.aiprovider.com" />
                </FormField>
                <FormField label="API Key">
                    <TextField type="password" placeholder="sk-XXXX-XXXX-XXXX" />
                </FormField>
                <div class="flex gap-4 justify-between">
                    <Button variant="secondary">Test Connection</Button>
                    <Button variant="accent">Save</Button>
                </div>
            </Form>
        </Cell>
    </Band>
</template>
