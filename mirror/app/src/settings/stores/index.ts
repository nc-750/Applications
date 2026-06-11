import { computed, ref } from "vue";
import { LLMConfig } from "../models";

export function useSettingsStore() {
    const llmConfig = ref<LLMConfig | null>(null);

    const isLLMConfigured = computed(() => llmConfig.value !== null); 

    async function loadSettings() {
        // Calls loadSettingsFromDB
        // Transform DB record object into App usable object
    }

    async function saveSettings(config: LLMConfig) {
        llmConfig.value = config;
        
        // Transform from App objects to DB record
        // Calls saveSettingsToDB
    }

    async function clearSettings() {
        llmConfig.value = null;
        
        // Calls clearSettingsFromDB
    }

    async function loadSettingsFromDB() {}
    async function saveSettingsToDB() {}
    async function clearSettingsFromDB() {}

    return {
        llmConfig,
        isLLMConfigured,
        loadSettings,
        saveSettings,
        clearSettings
    }
}