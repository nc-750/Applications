import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "../../stores/settingsStore";
import { getDB } from "../../db/schema";

// Mock keyStore — individual tests configure return values
const mockLoadApiKey = vi.fn();
const mockSaveApiKey = vi.fn();
const mockIsTauri = vi.fn(() => false);

vi.mock("../../lib/keyStore", () => ({
  loadApiKey: (...args: unknown[]) => mockLoadApiKey(...args),
  saveApiKey: (...args: unknown[]) => mockSaveApiKey(...args),
  isTauri: () => mockIsTauri(),
}));

describe("settingsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadApiKey.mockResolvedValue(null);
    mockIsTauri.mockReturnValue(false);
  });

  describe("load", () => {
    it("sets defaults when no record exists in IndexedDB", async () => {
      await useSettingsStore().load();
      const state = useSettingsStore();
      expect(state.loaded).toBe(true);
      expect(state.provider).toBe("openai");
      expect(state.model).toBe("gpt-4o");
      expect(state.apiKey).toBe("");
    });

    it("reads from IndexedDB when record exists", async () => {
      const db = await getDB();
      await db.put("settings", {
        id: "default",
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        apiKey: "sk-test",
        endpoint: "",
        updatedAt: new Date().toISOString(),
      });

      await useSettingsStore().load();
      const state = useSettingsStore();
      expect(state.provider).toBe("anthropic");
      expect(state.model).toBe("claude-sonnet-4-6");
      // PWA: apiKey stored in IDB
      expect(state.apiKey).toBe("sk-test");
    });

    it("prefers keyring key over IndexedDB key on Tauri", async () => {
      mockIsTauri.mockReturnValue(true);
      mockLoadApiKey.mockResolvedValue("sk-keyring-key");

      const db = await getDB();
      await db.put("settings", {
        id: "default",
        provider: "openai",
        model: "gpt-4o",
        apiKey: "",
        endpoint: "",
        updatedAt: new Date().toISOString(),
      });

      await useSettingsStore().load();
      expect(useSettingsStore().apiKey).toBe("sk-keyring-key");
    });
  });

  describe("update", () => {
    it("updates in-memory state and persists to IndexedDB", async () => {
      await useSettingsStore().update({ provider: "anthropic", model: "claude-haiku-4-5" });

      const state = useSettingsStore();
      expect(state.provider).toBe("anthropic");
      expect(state.model).toBe("claude-haiku-4-5");

      // Verify persistence
      const db = await getDB();
      const record = await db.get("settings", "default");
      expect(record).toBeDefined();
      expect(record!.provider).toBe("anthropic");
    });

    it("saves API key via saveApiKey", async () => {
      await useSettingsStore().update({ apiKey: "sk-new-key" });
      expect(mockSaveApiKey).toHaveBeenCalledWith("sk-new-key");
    });

    it("syncs debugEnabled to log store", async () => {
      await useSettingsStore().update({ debugEnabled: true });
      expect(useSettingsStore().debugEnabled).toBe(true);

      // Check logStore sync
      const { useLogStore } = await import("../../stores/logStore");
      expect(useLogStore().debugEnabled).toBe(true);
    });

    it("does not store API key in IndexedDB on Tauri", async () => {
      mockIsTauri.mockReturnValue(true);
      await useSettingsStore().update({ apiKey: "sk-tauri-key" });

      const db = await getDB();
      const record = await db.get("settings", "default");
      expect(record!.apiKey).toBe(""); // Tauri stores key in OS keyring
    });
  });

  describe("clear", () => {
    it("deletes persisted record and resets to defaults", async () => {
      await useSettingsStore().update({ provider: "anthropic", apiKey: "sk-key" });
      await useSettingsStore().clear();

      const state = useSettingsStore();
      expect(state.provider).toBe("openai");
      expect(state.model).toBe("gpt-4o");
      expect(state.apiKey).toBe("");

      const db = await getDB();
      const record = await db.get("settings", "default");
      expect(record).toBeUndefined();
    });
  });

  describe("isConfigured", () => {
    it("returns false when apiKey is empty", () => {
      useSettingsStore().$patch({ apiKey: "" });
      expect(useSettingsStore().isConfigured()).toBe(false);
    });

    it("returns false when openai-compatible and no endpoint", () => {
      useSettingsStore().$patch({
        provider: "openai-compatible",
        apiKey: "sk-key",
        endpoint: "",
      });
      expect(useSettingsStore().isConfigured()).toBe(false);
    });

    it("returns true when openai-compatible with endpoint", () => {
      useSettingsStore().$patch({
        provider: "openai-compatible",
        apiKey: "sk-key",
        endpoint: "https://api.openrouter.ai/v1",
      });
      expect(useSettingsStore().isConfigured()).toBe(true);
    });

    it("returns true for openai with apiKey", () => {
      useSettingsStore().$patch({ provider: "openai", apiKey: "sk-key" });
      expect(useSettingsStore().isConfigured()).toBe(true);
    });
  });
});
