<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
    X,
    Check,
    CheckCircle,
    AlertCircle,
    Loader2,
    Shield,
    ExternalLink,
    RefreshCw,
    KeyRound,
    Crown,
    ChevronDown,
    ChevronRight,
    Bug,
    Sun,
    Moon,
    Monitor,
} from "lucide-vue-next";
import { useSettingsStore } from "../../stores/settingsStore.ts.old";
import { usePersonaStore } from "../../stores/personaStore";
import { useLicenseStore } from "../../stores/licenseStore";
import { useLogStore } from "../../stores/logStore";
import { testConnection, listModels } from "../../llm";
import { downloadFile, openExternal } from "../../lib/utils";
import { wipePersonaData, wipeAiProvider, factoryReset } from "../../lib/wipe";
import LicenseModal from "../license/LicenseModal.vue";
import LogViewer from "../../logger/LogViewer.vue";
import { exportDebugLog, logger } from "../../logger";
import type { Provider } from "../../llm/types";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; openPrivacy: [] }>();

const PROVIDER_NOTICES: Record<
    Provider,
    { text: string; href: string; linkLabel: string }
> = {
    openai: {
        text: "Requests are not used for training by default. Retention up to 30 days.",
        href: "https://openai.com/policies/api-data-usage-policies",
        linkLabel: "OpenAI data policy",
    },
    anthropic: {
        text: "Requests are not used for training by default.",
        href: "https://www.anthropic.com/legal/privacy",
        linkLabel: "Anthropic privacy policy",
    },
    mistral: {
        text: "Mistral may retain prompts. Review their data policy before sending sensitive content.",
        href: "https://mistral.ai/terms",
        linkLabel: "Mistral terms",
    },
    "openai-compatible": {
        text: "Behavior depends on your endpoint. For maximum privacy, run a local model with Ollama or LM Studio.",
        href: "https://ollama.com",
        linkLabel: "Ollama",
    },
};

const settings = useSettingsStore();
const personaStore = usePersonaStore();
const license = useLicenseStore();
const logStore = useLogStore();
const licenseModalOpen = ref(false);

const provider = ref<Provider>(settings.provider);
const model = ref(settings.model);
const apiKey = ref(settings.apiKey);
const endpoint = ref(settings.endpoint);
const testState = ref<"idle" | "loading" | "ok" | "error">("idle");
const testMsg = ref("");
const saved = ref(false);

const models = ref<string[]>([]);
const modelsState = ref<"idle" | "loading" | "error">("idle");

const clearedMsg = ref<string | null>(null);
const showResetModal = ref(false);
const resetConfirmText = ref("");
const resetInProgress = ref(false);
const debugExpanded = ref(false);

watch(
    () => props.open,
    (open) => {
        if (open) {
            provider.value = settings.provider;
            model.value = settings.model;
            apiKey.value = settings.apiKey;
            endpoint.value = settings.endpoint;
            testState.value = "idle";
            testMsg.value = "";
            models.value = [];
            modelsState.value = "idle";
        }
    },
);

async function loadModels() {
    if (!apiKey.value) return;
    if (provider.value === "openai-compatible" && !endpoint.value) return;
    modelsState.value = "loading";
    try {
        const list = await listModels({
            provider: provider.value,
            model: model.value,
            apiKey: apiKey.value,
            endpoint: endpoint.value || undefined,
        });
        models.value = list;
        modelsState.value = "idle";
    } catch {
        models.value = [];
        modelsState.value = "error";
    }
}

async function handleSave() {
    await settings.update({
        provider: provider.value,
        model: model.value,
        apiKey: apiKey.value,
        endpoint: endpoint.value || undefined,
    });
    logger.info("settings", "Settings saved");
    saved.value = true;
    setTimeout(() => {
        saved.value = false;
        emit("close");
    }, 800);
}

async function handleTest() {
    testState.value = "loading";
    testMsg.value = "";
    try {
        const ms = await testConnection({
            provider: provider.value,
            model: model.value,
            apiKey: apiKey.value,
            endpoint: endpoint.value || undefined,
        });
        testState.value = "ok";
        testMsg.value = `Connected in ${ms}ms`;
    } catch (e) {
        testState.value = "error";
        testMsg.value = e instanceof Error ? e.message : "Connection failed";
    }
}

async function handleExport() {
    if (!personaStore.persona) return;
    const json = JSON.stringify(personaStore.persona.data, null, 2);
    downloadFile(json, "mirror.json", "application/json");
    logger.info("export", "Mirror exported");
}

async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            await personaStore.importFromJSON(text);
            alert("Mirror imported successfully.");
            emit("close");
        } catch (e) {
            logger.error("import", "Mirror import failed", {
                error: e instanceof Error ? e : undefined,
            });
            alert(
                `Import failed: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
    };
    input.click();
}

function flashCleared(label: string) {
    clearedMsg.value = label;
    setTimeout(() => {
        if (clearedMsg.value === label) clearedMsg.value = null;
    }, 1500);
}

async function handleClearPersonaData() {
    if (
        !confirm(
            "This deletes your mirror data and interview history. Your AI provider settings stay. Continue?",
        )
    )
        return;
    await wipePersonaData();
    flashCleared("Mirror data cleared.");
}

async function handleClearAiProvider() {
    if (
        !confirm(
            "This deletes your API key and provider settings. Your mirror data stays. Continue?",
        )
    )
        return;
    await wipeAiProvider();
    provider.value = "openai";
    model.value = "gpt-4o";
    apiKey.value = "";
    endpoint.value = "";
    testState.value = "idle";
    testMsg.value = "";
    flashCleared("AI provider cleared.");
}

function openResetModal() {
    resetConfirmText.value = "";
    showResetModal.value = true;
}

async function handleFactoryReset() {
    if (resetConfirmText.value !== "RESET") return;
    resetInProgress.value = true;
    await factoryReset();
}

function onProviderChange() {
    testState.value = "idle";
    models.value = [];
    modelsState.value = "idle";
}

const themeTitle = computed(() => {
    const next: Record<string, string> = {
        system: "Theme: follow system — click for Light",
        light: "Theme: Light — click for Dark",
        dark: "Theme: Dark — click for System",
    };
    return next[settings.theme] || "";
});
</script>

<template>
    <div v-if="open" class="fixed inset-0 z-50 flex">
        <!-- Backdrop -->
        <div
            class="flex-1"
            style="background: rgba(0, 0, 0, 0.35)"
            @click="emit('close')"
        />

        <!-- Panel -->
        <div
            class="flex flex-col overflow-y-auto"
            style="
                width: 420px;
                max-width: 100vw;
                background: var(--nc-bg);
                box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
            "
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between shrink-0"
                style="
                    padding: var(--nc-space-5) var(--nc-space-5)
                        var(--nc-space-4);
                    border-bottom: var(--nc-border-width) solid
                        var(--nc-line-subtle);
                "
            >
                <h2 class="nc-heading-4">Settings</h2>
                <div class="flex items-center" style="gap: var(--nc-space-4)">
                    <button
                        class="nc-text-xs"
                        style="
                            color: var(--nc-accent-ink);
                            cursor: pointer;
                            background: none;
                            border: none;
                            padding: 0;
                        "
                        title="View privacy details"
                        @click="emit('openPrivacy')"
                    >
                        <Shield :size="12" />
                        Privacy details
                    </button>
                    <button
                        class="nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm"
                        :title="themeTitle"
                        @click="settings.cycleTheme()"
                    >
                        <Sun v-if="settings.theme === 'light'" :size="16" />
                        <Moon v-else-if="settings.theme === 'dark'" :size="16" />
                        <Monitor v-else :size="16" />
                    </button>
                    <button
                        class="nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm"
                        aria-label="Close settings"
                        @click="emit('close')"
                    >
                        <X :size="18" />
                    </button>
                </div>
            </div>

            <!-- Body -->
            <div
                class="flex-1 overflow-y-auto"
                style="
                    padding: var(--nc-space-5);
                    display: flex;
                    flex-direction: column;
                    gap: var(--nc-space-6);
                "
            >
                <!-- AI Provider -->
                <div
                    style="
                        display: flex;
                        flex-direction: column;
                        gap: var(--nc-space-2);
                    "
                >
                    <span class="nc-field__label">AI Provider</span>
                    <select
                        v-model="provider"
                        class="nc-select"
                        @change="onProviderChange"
                    >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="mistral">Mistral</option>
                        <option value="openai-compatible">
                            OpenAI-compatible (Groq, Together, Ollama…)
                        </option>
                    </select>
                    <!-- Provider data-handling notice -->
                    <div
                        class="flex"
                        :style="{
                            gap: 'var(--nc-space-2)',
                            borderRadius: 'var(--nc-radius-md)',
                            backgroundColor: 'var(--nc-accent-subtle)',
                            padding: 'var(--nc-space-2) var(--nc-space-3)',
                        }"
                    >
                        <Shield
                            :size="12"
                            class="shrink-0"
                            :style="{
                                color: 'var(--nc-accent)',
                                marginTop: '2px',
                            }"
                        />
                        <p
                            class="nc-text-xs nc-text-secondary"
                            :style="{ lineHeight: 'var(--nc-leading-relaxed)' }"
                        >
                            {{ PROVIDER_NOTICES[provider].text }}
                            <button
                                style="
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 2px;
                                    color: var(--nc-accent-ink);
                                    background: none;
                                    border: none;
                                    cursor: pointer;
                                    text-decoration: underline;
                                "
                                @click="
                                    openExternal(
                                        PROVIDER_NOTICES[provider].href,
                                    )
                                "
                            >
                                {{ PROVIDER_NOTICES[provider].linkLabel }}
                                <ExternalLink :size="10" />
                            </button>
                        </p>
                    </div>
                </div>

                <!-- Endpoint (openai-compatible only) -->
                <div
                    v-if="provider === 'openai-compatible'"
                    style="
                        display: flex;
                        flex-direction: column;
                        gap: var(--nc-space-2);
                    "
                >
                    <span class="nc-field__label">Endpoint URL</span>
                    <input
                        v-model="endpoint"
                        type="url"
                        placeholder="https://api.groq.com/openai/v1"
                        class="nc-input"
                    />
                </div>

                <!-- Model -->
                <div
                    style="
                        display: flex;
                        flex-direction: column;
                        gap: var(--nc-space-2);
                    "
                >
                    <div class="flex justify-between items-center">
                        <span class="nc-field__label" style="margin: 0"
                            >Model</span
                        >
                        <button
                            type="button"
                            :disabled="
                                !apiKey ||
                                modelsState === 'loading' ||
                                (provider === 'openai-compatible' && !endpoint)
                            "
                            class="nc-text-xs"
                            style="
                                color: var(--nc-accent-ink);
                                background: none;
                                border: none;
                                cursor: pointer;
                                text-decoration: underline;
                            "
                            title="Fetch available models from the provider"
                            :style="{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--nc-space-1)',
                                fontSize: 'var(--nc-text-2xs)',
                            }"
                            @click="loadModels"
                        >
                            <RefreshCw
                                :size="11"
                                :class="
                                    modelsState === 'loading'
                                        ? 'animate-spin'
                                        : ''
                                "
                            />
                            {{
                                modelsState === "loading"
                                    ? "Loading…"
                                    : "Fetch models"
                            }}
                        </button>
                    </div>
                    <input
                        v-model="model"
                        type="text"
                        list="model-datalist"
                        placeholder="Select or type a model name"
                        class="nc-input"
                        @input="testState = 'idle'"
                    />
                    <datalist id="model-datalist">
                        <option v-for="m in models" :key="m" :value="m" />
                    </datalist>
                    <p
                        v-if="modelsState === 'error'"
                        class="nc-field__help"
                        style="color: var(--nc-error)"
                    >
                        Couldn't fetch models — check your API key and endpoint,
                        then retry. You can still type a model name.
                    </p>
                    <p
                        v-if="modelsState === 'idle' && models.length > 0"
                        class="nc-field__help"
                    >
                        {{ models.length }} models available — start typing to
                        filter.
                    </p>
                </div>

                <!-- API Key -->
                <div
                    style="
                        display: flex;
                        flex-direction: column;
                        gap: var(--nc-space-2);
                    "
                >
                    <span class="nc-field__label">API Key</span>
                    <input
                        v-model="apiKey"
                        type="password"
                        placeholder="sk-…"
                        class="nc-input"
                        @input="testState = 'idle'"
                    />
                    <p class="nc-field__help">
                        Stored in your OS credential store (Windows Credential
                        Manager / macOS Keychain). Encrypted at rest.
                    </p>
                </div>

                <!-- Test connection -->
                <div
                    :style="{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--nc-space-2)',
                    }"
                >
                    <button
                        :disabled="!apiKey || testState === 'loading'"
                        class="nc-btn nc-btn--secondary"
                        @click="handleTest"
                    >
                        <Loader2
                            v-if="testState === 'loading'"
                            :size="14"
                            class="animate-spin"
                            :style="{ color: 'var(--nc-ink-3)' }"
                        />
                        <CheckCircle
                            v-else-if="testState === 'ok'"
                            :size="14"
                            :style="{ color: 'var(--nc-ink-2)' }"
                        />
                        <AlertCircle
                            v-else-if="testState === 'error'"
                            :size="14"
                            :style="{ color: 'var(--nc-error)' }"
                        />
                        <span v-else :style="{ width: '14px' }" />
                        Test connection
                    </button>
                    <p
                        v-if="testMsg"
                        class="nc-text-xs"
                        :style="{
                            color:
                                testState === 'ok'
                                    ? 'var(--nc-ink-2)'
                                    : 'var(--nc-error)',
                            lineHeight: 'var(--nc-leading-relaxed)',
                        }"
                    >
                        {{ testMsg }}
                    </p>
                </div>

                <!-- Data -->
                <div
                    class="flex flex-col"
                    style="
                        padding-top: var(--nc-space-5);
                        border-top: var(--nc-border-width) solid
                            var(--nc-line-subtle);
                    "
                >
                    <h3
                        class="nc-field__label"
                        :style="{ marginBottom: 'var(--nc-space-3)' }"
                    >
                        Data
                    </h3>
                    <div
                        :style="{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--nc-space-2)',
                        }"
                    >
                        <button
                            :disabled="!personaStore.persona"
                            class="nc-btn nc-btn--secondary"
                            :style="{ justifyContent: 'flex-start' }"
                            @click="handleExport"
                        >
                            Export mirror.json
                        </button>
                        <button
                            class="nc-btn nc-btn--secondary"
                            :style="{ justifyContent: 'flex-start' }"
                            @click="handleImport"
                        >
                            Import mirror.json
                        </button>
                    </div>
                </div>

                <!-- License -->
                <div
                    class="flex flex-col"
                    style="
                        padding-top: var(--nc-space-5);
                        border-top: var(--nc-border-width) solid
                            var(--nc-line-subtle);
                    "
                >
                    <div
                        class="flexjustify-between items-center"
                        :style="{ marginBottom: 'var(--nc-space-3)' }"
                    >
                        <h3 class="nc-field__label" :style="{ margin: 0 }">
                            License
                        </h3>
                        <span
                            v-if="license.isPro"
                            class="nc-badge nc-badge--accent"
                        >
                            <Crown :size="9" />
                            Pro
                        </span>
                    </div>
                    <div
                        v-if="license.isPro"
                        :style="{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--nc-space-2)',
                        }"
                    >
                        <p class="nc-text-xs nc-text-secondary">
                            Key:
                            <span class="nc-text-mono">{{
                                license.maskedKey
                            }}</span>
                        </p>
                        <p
                            v-if="license.activatedAt"
                            class="nc-text-xs nc-text-muted"
                        >
                            Activated
                            {{
                                new Date(
                                    license.activatedAt,
                                ).toLocaleDateString()
                            }}
                        </p>
                        <button
                            class="nc-text-xs"
                            style="
                                color: var(--nc-accent-ink);
                                cursor: pointer;
                                background: none;
                                border: none;
                                padding: 0;
                            "
                            :style="{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--nc-space-1)',
                            }"
                            @click="licenseModalOpen = true"
                        >
                            <KeyRound :size="11" />
                            Manage license
                        </button>
                    </div>
                    <div
                        v-else
                        :style="{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--nc-space-2)',
                        }"
                    >
                        <p
                            class="nc-text-xs nc-text-muted"
                            :style="{ lineHeight: 'var(--nc-leading-relaxed)' }"
                        >
                            No license activated. Running on the free tier.
                        </p>
                        <button
                            class="nc-btn nc-btn--secondary nc-btn--sm"
                            :style="{ justifyContent: 'flex-start' }"
                            @click="licenseModalOpen = true"
                        >
                            <KeyRound :size="13" />
                            Activate license key
                        </button>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div
                    class="flex flex-col"
                    style="
                        padding-top: var(--nc-space-5);
                        border-top: var(--nc-border-width) solid
                            var(--nc-line-subtle);
                    "
                >
                    <div :style="{ marginBottom: 'var(--nc-space-3)' }">
                        <h3
                            class="nc-field__label"
                            :style="{
                                color: 'var(--nc-error)',
                                marginBottom: 'var(--nc-space-1)',
                            }"
                        >
                            Danger Zone
                        </h3>
                        <p
                            class="nc-text-xs nc-text-muted"
                            :style="{ lineHeight: 'var(--nc-leading-relaxed)' }"
                        >
                            Destructive actions. Each step is isolated so you
                            only wipe what you mean to.
                        </p>
                    </div>
                    <div
                        :style="{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--nc-space-2)',
                        }"
                    >
                        <button
                            class="nc-btn nc-btn--secondary nc-btn--sm"
                            :style="{
                                justifyContent: 'flex-start',
                                borderColor: 'var(--nc-error)',
                                color: 'var(--nc-error)',
                            }"
                            @click="handleClearPersonaData"
                        >
                            Clear mirror data
                        </button>
                        <button
                            class="nc-btn nc-btn--secondary nc-btn--sm"
                            :style="{
                                justifyContent: 'flex-start',
                                borderColor: 'var(--nc-error)',
                                color: 'var(--nc-error)',
                            }"
                            @click="handleClearAiProvider"
                        >
                            Clear AI provider
                        </button>
                        <button
                            class="nc-btn nc-btn--secondary nc-btn--sm"
                            :style="{
                                justifyContent: 'flex-start',
                                borderColor: 'var(--nc-error)',
                                color: 'var(--nc-error)',
                                fontWeight: 'var(--nc-font-semibold)',
                            }"
                            @click="openResetModal"
                        >
                            Factory reset
                        </button>
                        <p
                            v-if="clearedMsg"
                            class="nc-text-xs nc-text-secondary"
                            :style="{ paddingLeft: 'var(--nc-space-1)' }"
                        >
                            {{ clearedMsg }}
                        </p>
                    </div>
                </div>

                <!-- Debug -->
                <div
                    class="flex flex-col"
                    style="
                        padding-top: var(--nc-space-5);
                        border-top: var(--nc-border-width) solid
                            var(--nc-line-subtle);
                    "
                >
                    <button
                        :style="{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            marginBottom: 'var(--nc-space-3)',
                        }"
                        @click="debugExpanded = !debugExpanded"
                    >
                        <div
                            class="flexitems-center"
                            :style="{ gap: 'var(--nc-space-1)' }"
                        >
                            <Bug
                                :size="12"
                                :style="{ color: 'var(--nc-ink-3)' }"
                            />
                            <h3 class="nc-field__label" :style="{ margin: 0 }">
                                Debug
                            </h3>
                        </div>
                        <ChevronDown
                            v-if="debugExpanded"
                            :size="14"
                            :style="{ color: 'var(--nc-ink-3)' }"
                        />
                        <ChevronRight
                            v-else
                            :size="14"
                            :style="{ color: 'var(--nc-ink-3)' }"
                        />
                    </button>

                    <!-- Toggle — always visible -->
                    <div class="flexjustify-between items-center">
                        <label class="nc-toggle"
                            ><input
                                type="checkbox"
                                @update:checked="
                                    settings.update({ debugEnabled: $event })
                                "
                            />
                            Enable debug logging</label
                        >
                        <!-- <Toggle
                            :model-value="settings.debugEnabled"
                            @update:model-value="
                                settings.update({ debugEnabled: $event })
                            "
                        /> -->
                    </div>

                    <div
                        v-if="debugExpanded"
                        :style="{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--nc-space-3)',
                            marginTop: 'var(--nc-space-3)',
                        }"
                    >
                        <!-- Entry count -->
                        <p class="nc-text-xs nc-text-muted">
                            {{ logStore.entries.length }} entries in buffer (max
                            {{ logStore.maxEntries }})
                        </p>

                        <!-- Action buttons -->
                        <div class="flex" :style="{ gap: 'var(--nc-space-2)' }">
                            <button
                                :disabled="
                                    !settings.debugEnabled ||
                                    logStore.entries.length === 0
                                "
                                class="nc-btn nc-btn--secondary nc-btn--sm"
                                :style="{ flex: 1 }"
                                :title="
                                    !settings.debugEnabled
                                        ? 'Enable debug logging first'
                                        : logStore.entries.length === 0
                                          ? 'No entries to export'
                                          : 'Download debug log as JSON'
                                "
                                @click="exportDebugLog"
                            >
                                Export log
                            </button>
                            <button
                                :disabled="
                                    !settings.debugEnabled ||
                                    logStore.entries.length === 0
                                "
                                class="nc-btn nc-btn--secondary nc-btn--sm"
                                :style="{ flex: 1 }"
                                :title="
                                    !settings.debugEnabled
                                        ? 'Enable debug logging first'
                                        : 'Clear all log entries from the buffer'
                                "
                                @click="logStore.clear()"
                            >
                                Clear log
                            </button>
                        </div>

                        <!-- Inline log viewer -->
                        <LogViewer v-if="logStore.entries.length > 0" />
                    </div>
                </div>
            </div>

            <!-- Footer / Save -->
            <div
                class="shrink-0"
                style="
                    padding: var(--nc-space-4) var(--nc-space-5);
                    border-top: var(--nc-border-width) solid
                        var(--nc-line-subtle);
                "
            >
                <button
                    :disabled="saved"
                    class="nc-btn nc-btn--accent w-full"
                    :style="{ justifyContent: 'center' }"
                    @click="handleSave"
                >
                    <template v-if="saved"><Check :size="14" /> Saved</template>
                    <template v-else>Save</template>
                </button>
            </div>
        </div>

        <!-- License modal -->
        <LicenseModal
            :open="licenseModalOpen"
            @close="licenseModalOpen = false"
        />

        <!-- Factory reset confirmation modal -->
        <div
            v-if="showResetModal"
            class="fixed inset-0 z-50 flex items-center justify-center"
            style="background: rgba(0, 0, 0, 0.35)"
            @click="!resetInProgress && (showResetModal = false)"
        >
            <div
                class="flex flex-col overflow-hidden"
                style="
                    width: 400px;
                    max-width: 90vw;
                    background: var(--nc-bg);
                    border: var(--nc-border-width) solid var(--nc-error);
                    border-radius: var(--nc-radius-lg);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                "
                @click.stop
            >
                <div :style="{ padding: 'var(--nc-space-5)' }">
                    <h3
                        class="nc-heading-4"
                        :style="{
                            color: 'var(--nc-error)',
                            marginBottom: 'var(--nc-space-2)',
                        }"
                    >
                        Factory reset
                    </h3>
                    <p
                        class="nc-text-sm nc-text-secondary"
                        :style="{
                            lineHeight: 'var(--nc-leading-relaxed)',
                            marginBottom: 'var(--nc-space-4)',
                        }"
                    >
                        This deletes your mirror data, interview history, AI
                        provider settings, cached assets, and the local
                        database, then reloads the app. This cannot be undone.
                    </p>
                    <p
                        class="nc-text-xs nc-text-muted"
                        :style="{ marginBottom: 'var(--nc-space-2)' }"
                    >
                        Type
                        <span
                            class="nc-text-mono"
                            :style="{ color: 'var(--nc-error)' }"
                            >RESET</span
                        >
                        to confirm:
                    </p>
                    <input
                        v-model="resetConfirmText"
                        type="text"
                        autofocus
                        :disabled="resetInProgress"
                        class="nc-input nc-text-mono"
                    />
                    <div
                        class="flex"
                        :style="{
                            gap: 'var(--nc-space-2)',
                            marginTop: 'var(--nc-space-4)',
                        }"
                    >
                        <button
                            :disabled="resetInProgress"
                            class="nc-btn nc-btn--secondary"
                            :style="{ flex: 1 }"
                            @click="showResetModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            :disabled="
                                resetConfirmText !== 'RESET' || resetInProgress
                            "
                            class="nc-btn nc-btn--danger"
                            :style="{ flex: 1, justifyContent: 'center' }"
                            @click="handleFactoryReset"
                        >
                            <Loader2
                                v-if="resetInProgress"
                                :size="14"
                                class="animate-spin"
                            />
                            {{
                                resetInProgress
                                    ? "Resetting…"
                                    : "Reset everything"
                            }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
