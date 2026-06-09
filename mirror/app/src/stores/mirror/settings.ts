import { ref, computed } from "vue";
import type { ProviderKind } from "@nc-750/llm-ts";
import { getDB } from "../../db/schema";
import { isTauri, saveApiKey, loadApiKey, clearApiKey } from "../../lib/keyStore";
import { logger } from "../../logger";

export interface LLMConfig {
  provider: ProviderKind;
  model: string;
  apiKey: string;
  endpoint?: string;
}

export function useSettingsModule() {
  const llmConfig = ref<LLMConfig | null>(null);
  const loaded = ref(false);

  const isLLMConfigured = computed(() => llmConfig.value !== null);

  async function loadSettings(): Promise<void> {
    try {
      const db = await getDB();
      const record = await db.get("settings", "default");

      if (!record) {
        loaded.value = true;
        return;
      }

      const apiKey = isTauri() ? (await loadApiKey()) ?? "" : (record.apiKey ?? "");

      if (record.provider && record.model && apiKey) {
        llmConfig.value = {
          provider: record.provider as ProviderKind,
          model: record.model,
          apiKey,
          endpoint: record.endpoint,
        };
      }
    } catch (e) {
      logger.warn("store", "Failed to load settings", { error: e instanceof Error ? e : undefined });
    } finally {
      loaded.value = true;
    }
  }

  async function saveLLMConfig(config: LLMConfig): Promise<void> {
    try {
      const db = await getDB();
      const now = new Date().toISOString();

      await db.put("settings", {
        id: "default",
        provider: config.provider,
        model: config.model,
        apiKey: isTauri() ? undefined : config.apiKey,
        endpoint: config.endpoint,
        updatedAt: now,
      });

      if (isTauri()) {
        await saveApiKey(config.apiKey);
      }

      llmConfig.value = { ...config };
      logger.info("store", "LLM config saved");
    } catch (e) {
      logger.error("store", "Failed to save LLM config", { error: e instanceof Error ? e : undefined });
      throw e;
    }
  }

  async function clearLLMConfig(): Promise<void> {
    try {
      const db = await getDB();
      await db.delete("settings", "default");
      if (isTauri()) {
        await clearApiKey();
      }
      llmConfig.value = null;
      logger.info("store", "LLM config cleared");
    } catch (e) {
      logger.warn("store", "Failed to clear LLM config", { error: e instanceof Error ? e : undefined });
    }
  }

  return {
    llmConfig,
    loaded,
    isLLMConfigured,
    loadSettings,
    saveLLMConfig,
    clearLLMConfig,
  };
}
