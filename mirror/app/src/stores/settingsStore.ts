import { defineStore } from "pinia";
import { ref } from "vue";
import { getDB } from "../db/schema";
import { isTauri, loadApiKey, saveApiKey } from "../lib/keyStore";
import { useLogStore } from "./logStore";
import type { SettingsRecord } from "../db/schema";
import type { Provider } from "../llm/types";

const DEFAULTS = { provider: "openai" as Provider, model: "gpt-4o", apiKey: "", endpoint: "", debugEnabled: false };

const THEME_STORAGE_KEY = "mirror-theme";
type Theme = "system" | "light" | "dark";
const THEME_CYCLE: Theme[] = ["system", "light", "dark"];

function resolveEffectiveTheme(t: Theme): "light" | "dark" {
  if (t === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return t;
}

function applyThemeToDOM(t: Theme) {
  document.documentElement.setAttribute("data-theme", resolveEffectiveTheme(t));
  localStorage.setItem(THEME_STORAGE_KEY, t);
}

export const useSettingsStore = defineStore("settings", () => {
  const provider = ref<Provider>("openai");
  const model = ref("gpt-4o");
  const apiKey = ref("");
  const endpoint = ref("");
  const debugEnabled = ref(false);
  const theme = ref<Theme>("system");
  const loaded = ref(false);

  async function load() {
    const db = await getDB();
    const [record, storedKey] = await Promise.all([db.get("settings", "default"), loadApiKey()]);
    if (record) {
      provider.value = record.provider;
      model.value = record.model;
      // In Tauri: prefer the key store value; fall back to IndexedDB for PWA
      apiKey.value = storedKey ?? record.apiKey;
      endpoint.value = record.endpoint ?? "";
      debugEnabled.value = record.debugEnabled ?? false;
      loaded.value = true;
    } else {
      apiKey.value = storedKey ?? "";
      loaded.value = true;
    }
    // Restore theme from localStorage (already applied by inline script, just sync ref)
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      theme.value = stored;
    }
  }

  // Keep the DOM in sync when the user changes OS preference while theme is "system"
  if (typeof window !== "undefined") {
    const osMq = window.matchMedia("(prefers-color-scheme: dark)");
    osMq.addEventListener("change", () => {
      if (theme.value === "system") {
        document.documentElement.setAttribute("data-theme", osMq.matches ? "dark" : "light");
      }
    });
  }

  function cycleTheme() {
    const idx = THEME_CYCLE.indexOf(theme.value);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    theme.value = next;
    applyThemeToDOM(next);
  }

  function setTheme(t: Theme) {
    theme.value = t;
    applyThemeToDOM(t);
  }

  async function update(patch: Partial<Omit<SettingsRecord, "id" | "updatedAt">>) {
    if (patch.provider !== undefined) provider.value = patch.provider;
    if (patch.model !== undefined) model.value = patch.model;
    if (patch.apiKey !== undefined) apiKey.value = patch.apiKey;
    if (patch.endpoint !== undefined) endpoint.value = patch.endpoint ?? "";
    if (patch.debugEnabled !== undefined) debugEnabled.value = patch.debugEnabled;

    if (patch.apiKey !== undefined) {
      await saveApiKey(patch.apiKey);
    }
    // Sync debug toggle to log store
    if ("debugEnabled" in patch) {
      useLogStore().setDebugEnabled(debugEnabled.value);
    }
    const db = await getDB();
    await db.put("settings", {
      id: "default",
      provider: provider.value,
      model: model.value,
      // On Tauri the key lives in the OS keyring (via saveApiKey above).
      // In the PWA, IndexedDB is the only store, so we keep the key there.
      apiKey: isTauri() ? "" : apiKey.value,
      endpoint: endpoint.value || undefined,
      debugEnabled: debugEnabled.value || undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  /** Delete the persisted settings record and reset in-memory state to defaults. */
  async function clear() {
    const db = await getDB();
    await db.delete("settings", "default");
    provider.value = DEFAULTS.provider;
    model.value = DEFAULTS.model;
    apiKey.value = DEFAULTS.apiKey;
    endpoint.value = DEFAULTS.endpoint;
    debugEnabled.value = DEFAULTS.debugEnabled;
    setTheme("system");
  }

  function isConfigured(): boolean {
    if (!apiKey.value) return false;
    if (provider.value === "openai-compatible" && !endpoint.value) return false;
    return true;
  }

  return { provider, model, apiKey, endpoint, debugEnabled, theme, loaded, load, update, clear, cycleTheme, setTheme, isConfigured };
});
