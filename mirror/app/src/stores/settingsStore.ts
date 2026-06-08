import { defineStore } from "pinia";
import { LLMConfig } from "../llm";

export const useSettingsStore = defineStore("settings", {
    state: () => ({
        llmConfig: null as LLMConfig | null
    }),
    getters: {
        isLLMConfigured: (state) => state.llmConfig != null
    },
    actions: {
        saveLLMConfig(config: LLMConfig) {
            this.llmConfig = config;
        }
    }
});