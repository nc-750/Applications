<script setup lang="ts">
// The LLM-config operable Cell — the one input surface of the settings screen
// (Rule 7.6: input lives on a light Cell, never in the monitor cavity). The view
// binds the settings store read-only, so this form mutates a *local draft* seeded
// from the live store values and emits a complete config on save/test. It owns no
// store, no LLM call, and no persistence — those are the page's/service's job.
import { reactive, computed, watch } from "vue";
import { Cell, Form, FormField, Button, TextField } from "@nc-750/lab-vue";
import { LLMProvider, type LLMConfig } from "../../llm";
import { PROVIDER_OPTIONS } from "../reference";

const props = defineProps<{
    /** Live store values — the form draft is seeded from these (read-only). */
    provider: LLMProvider | undefined;
    model: string;
    apiKey: string;
    endpoint: string;
    /** A connection test is in flight — lock the Test button. */
    testing: boolean;
    /** Model suggestions populated after a successful fetch. */
    modelList?: string[];
}>();

const emit = defineEmits<{
    save: [config: LLMConfig];
    test: [config: LLMConfig];
    "fetch-models": [config: LLMConfig];
}>();

// Local editable draft. `provider` may be unselected (`""`); the placeholder
// `<option>` carries that sentinel. Numeric `LLMProvider` values (OpenAI === 0)
// are valid — completeness is checked with an explicit `!== ""`, never a falsy
// test, so provider 0 is not mistaken for "unset".
const draft = reactive({
    provider: props.provider ?? ("" as LLMProvider | ""),
    model: props.model,
    apiKey: props.apiKey,
    endpoint: props.endpoint,
});

// Re-seed the draft whenever the store's settings change (load, clear, external save).
watch(
    () => [props.provider, props.model, props.apiKey, props.endpoint],
    () => {
        draft.provider = props.provider ?? "";
        draft.model = props.model;
        draft.apiKey = props.apiKey;
        draft.endpoint = props.endpoint;
    },
);

const canSubmit = computed(
    () => draft.provider !== "" && draft.model !== "" && draft.apiKey !== "",
);

const canFetchModels = computed(() => {
    return (
        draft.provider === "" ||
        draft.apiKey === "" ||
        draft.endpoint === ""
    );
});

function assembled(): LLMConfig {
    return {
        provider: draft.provider as LLMProvider,
        model: draft.model,
        apiKey: draft.apiKey,
        endpoint: draft.endpoint,
    };
}

// Switching provider invalidates the model and auto-fills the default endpoint.
// The API key is preserved — the user enters it after picking a provider.
function onProviderChange() {
    draft.model = "";
    draft.endpoint = PROVIDER_OPTIONS.find((x) => x.value === draft.provider)?.endpoint || "";
}

function onSave() {
    if (!canSubmit.value) return;
    emit("save", assembled());
}

function onTest() {
    if (!canSubmit.value) return;
    emit("test", assembled());
}

// Debounced auto-fetch when the config is complete enough.
let fetchTimer: ReturnType<typeof setTimeout> | undefined;
watch(canFetchModels, (ready) => {
    clearTimeout(fetchTimer);
    if (ready) {
        fetchTimer = setTimeout(() => emit("fetch-models", assembled()), 300);
    }
});

function onRefreshModels() {
    if (!canFetchModels.value) return;
    emit("fetch-models", assembled());
}
</script>

<template>
    <Cell title="LLM CONFIG" spec="CFG // 0x01" :grow="2">
        <Form class="flex flex-col gap-4" @submit.prevent="onSave">
            <FormField label="AI Provider" class="flex flex-col gap-2">
                <select class="nc-select" v-model="draft.provider" @change="onProviderChange">
                    <option value="" disabled>Select a provider…</option>
                    <option v-for="opt in PROVIDER_OPTIONS" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
                <p v-if="draft.provider === LLMProvider.CustomLocalOpenAI" class="nc-alert nc-alert--warning">Local models yields poor results or are straight up broken. We are working to fixing those issues.</p>
            </FormField>
            <FormField label="API Key" class="flex flex-col gap-2">
                <TextField type="password" placeholder="sk-XXXX-XXXX-XXXX" v-model="draft.apiKey" />
                <p v-if="draft.provider === LLMProvider.CustomLocalOpenAI" class="nc-alert nc-alert--info">Use the value "dummy" if your local provider does not require an API key.</p>
            </FormField>
            <FormField label="Endpoint">
                <input
                    class="nc-input"
                    type="url"
                    placeholder="https://api.aiprovider.com"
                    v-model="draft.endpoint"
                />
            </FormField>
            <FormField label="Model">
                <div class="flex gap-2">
                    <input
                        class="nc-input flex-1"
                        type="text"
                        placeholder="gpt-4o"
                        v-model="draft.model"
                        list="llm-models"
                        autocomplete="off"
                    />
                    <datalist id="llm-models">
                        <option v-for="id in modelList" :key="id" :value="id" />
                    </datalist>
                    <Button
                        variant="ghost"
                        :disabled="!canFetchModels"
                        @click="onRefreshModels"
                        title="Fetch available models"
                    >
                        ↻
                    </Button>
                </div>
            </FormField>
            <div class="flex gap-4 justify-between">
                <Button variant="secondary" :disabled="testing || !canSubmit" @click="onTest">
                    {{ testing ? "Testing…" : "Test Connection" }}
                </Button>
                <Button variant="accent" submit :disabled="!canSubmit">Save</Button>
            </div>
            <router-link to="/privacy" class="nc-btn nc-btn--ghost">Read the privacy details →</router-link>
        </Form>
    </Cell>
</template>
