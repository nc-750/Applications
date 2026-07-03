import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSettingsStore } from "../../settings/stores";
import { createEmptySettings, type Settings } from "../../settings/models";
import { readSettings } from "../../settings/db";
import { LLMProvider } from "../../llm";

// The store runs the PWA path (key in IndexedDB). The keyring backend is mocked to
// the PWA default so no real OS keyring is touched; the Tauri-vs-PWA key split
// itself is owned by `SettingsDb.test.ts`, not re-asserted here.
vi.mock("../../settings/db/keyStore", () => ({
    isTauri: () => false,
    saveApiKey: vi.fn(),
    loadApiKey: vi.fn().mockResolvedValue(null),
    clearApiKey: vi.fn(),
}));

/** A fully-populated domain settings record. */
function populatedSettings(): Settings {
    return {
        ...createEmptySettings(),
        provider: LLMProvider.Anthropic,
        model: "claude-sonnet-4-6",
        apiKey: "sk-secret-key",
        endpoint: "https://api.anthropic.com",
    };
}

describe("useSettingsStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("starts from an empty, unconfigured record", () => {
        const store = useSettingsStore();
        expect(store.provider).toBeUndefined();
        expect(store.model).toBe("");
        expect(store.apiKey).toBe("");
        expect(store.endpoint).toBe("");
        expect(store.error).toBeNull();
        expect(store.isLLMConfigured).toBe(false);
    });

    it("saveSettings assigns the flat fields and persists the record", async () => {
        const store = useSettingsStore();
        await store.saveSettings(populatedSettings());

        // In-memory flat surface updated.
        expect(store.provider).toBe(LLMProvider.Anthropic);
        expect(store.model).toBe("claude-sonnet-4-6");
        expect(store.apiKey).toBe("sk-secret-key");

        // Persisted to the db layer, not just held in memory.
        const persisted = await readSettings();
        expect(persisted).not.toBeNull();
        expect(persisted!.provider).toBe(LLMProvider.Anthropic);
        expect(persisted!.apiKey).toBe("sk-secret-key");
    });

    it("loadSettings rehydrates from persistence into a fresh store", async () => {
        const writer = useSettingsStore();
        await writer.saveSettings(populatedSettings());

        setActivePinia(createPinia());
        const reader = useSettingsStore();
        expect(reader.isLLMConfigured).toBe(false); // fresh instance starts empty

        await reader.loadSettings();
        expect(reader.provider).toBe(LLMProvider.Anthropic);
        expect(reader.model).toBe("claude-sonnet-4-6");
        expect(reader.endpoint).toBe("https://api.anthropic.com");
        expect(reader.isLLMConfigured).toBe(true);
    });

    it("loadSettings leaves the empty seed when nothing is stored", async () => {
        const store = useSettingsStore();
        await store.loadSettings();
        expect(store.isLLMConfigured).toBe(false);
        expect(store.model).toBe("");
        expect(store.error).toBeNull();
    });

    it("isLLMConfigured derives from field-completeness, not a null check", async () => {
        const store = useSettingsStore();
        expect(store.isLLMConfigured).toBe(false);

        await store.saveSettings(populatedSettings());
        expect(store.isLLMConfigured).toBe(true);

        // A record missing the api key is incomplete → not configured.
        await store.saveSettings({ ...populatedSettings(), apiKey: "" });
        expect(store.isLLMConfigured).toBe(false);
    });

    it("clearSettings resets to empty and removes the persisted record", async () => {
        const store = useSettingsStore();
        await store.saveSettings(populatedSettings());
        expect(await readSettings()).not.toBeNull();

        await store.clearSettings();

        expect(store.provider).toBeUndefined();
        expect(store.model).toBe("");
        expect(store.isLLMConfigured).toBe(false);
        expect(await readSettings()).toBeNull();
    });

    it("is a shared singleton — two useSettingsStore() calls see the same state", async () => {
        // The bug this rung fixes: the old factory stub handed each caller its own
        // unshared copy. With a real defineStore, a save through one handle is
        // visible through another (e.g. Settings screen → Interview screen).
        const a = useSettingsStore();
        const b = useSettingsStore();
        expect(a).toBe(b);

        await a.saveSettings(populatedSettings());
        expect(b.isLLMConfigured).toBe(true);
        expect(b.model).toBe("claude-sonnet-4-6");
    });
});
