import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMirrorStore } from "../../stores/mirror";
import { getDB } from "../../db/schema";

// Mock keyStore — individual tests configure return values
const mockLoadApiKey = vi.fn();
const mockSaveApiKey = vi.fn();
const mockClearApiKey = vi.fn();
const mockIsTauri = vi.fn(() => false);

vi.mock("../../lib/keyStore", () => ({
  loadApiKey: (...args: unknown[]) => mockLoadApiKey(...args),
  saveApiKey: (...args: unknown[]) => mockSaveApiKey(...args),
  clearApiKey: (...args: unknown[]) => mockClearApiKey(...args),
  isTauri: () => mockIsTauri(),
}));

describe("mirrorStore settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadApiKey.mockResolvedValue(null);
    mockIsTauri.mockReturnValue(false);
  });

  describe("loadSettings", () => {
    it("sets loaded=true and llmConfig=null when IndexedDB is empty", async () => {
      const store = useMirrorStore();
      expect(store.loaded).toBe(false);

      await store.loadSettings();

      expect(store.loaded).toBe(true);
      expect(store.llmConfig).toBeNull();
      expect(store.isLLMConfigured).toBe(false);
    });

    it("loads API key from OS keyring on Tauri when record exists", async () => {
      mockIsTauri.mockReturnValue(true);
      mockLoadApiKey.mockResolvedValue("sk-keyring-key");

      // Pre-populate IndexedDB with settings (apiKey empty — Tauri keeps it in keyring)
      const db = await getDB();
      await db.put("settings", {
        id: "default",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        apiKey: "",
        endpoint: "https://api.anthropic.com",
        updatedAt: new Date().toISOString(),
      });

      await useMirrorStore().loadSettings();
      const store = useMirrorStore();

      expect(store.llmConfig).not.toBeNull();
      expect(store.llmConfig!.apiKey).toBe("sk-keyring-key");
      expect(store.llmConfig!.provider).toBe("anthropic");
      expect(store.loaded).toBe(true);
    });
  });

  describe("saveLLMConfig + loadSettings round-trip", () => {
    it("persists config in IndexedDB and reloads it on PWA (apiKey in IDB)", async () => {
      mockIsTauri.mockReturnValue(false);

      const config = {
        provider: "anthropic" as const,
        model: "claude-sonnet-4-20250514",
        apiKey: "sk-pwa-key",
        endpoint: "https://api.anthropic.com",
      };

      // Save
      await useMirrorStore().saveLLMConfig(config);

      // Verify in-memory state
      expect(useMirrorStore().llmConfig).toEqual(config);

      // Verify IDB has the record with apiKey
      const db = await getDB();
      const record = await db.get("settings", "default");
      expect(record).toBeDefined();
      expect(record!.apiKey).toBe("sk-pwa-key");

      // Reset Pinia to simulate a fresh app start
      setActivePinia(createPinia());
      mockIsTauri.mockReturnValue(false);

      // Load from IndexedDB
      const freshStore = useMirrorStore();
      await freshStore.loadSettings();

      expect(freshStore.llmConfig).not.toBeNull();
      expect(freshStore.llmConfig!.provider).toBe("anthropic");
      expect(freshStore.llmConfig!.model).toBe("claude-sonnet-4-20250514");
      expect(freshStore.llmConfig!.apiKey).toBe("sk-pwa-key");
      expect(freshStore.llmConfig!.endpoint).toBe("https://api.anthropic.com");
      expect(freshStore.isLLMConfigured).toBe(true);
    });

    it("does NOT store apiKey in IndexedDB on Tauri, and calls saveApiKey", async () => {
      mockIsTauri.mockReturnValue(true);

      const config = {
        provider: "openai" as const,
        model: "gpt-4o",
        apiKey: "sk-tauri-secret",
        endpoint: "",
      };

      await useMirrorStore().saveLLMConfig(config);

      // IDB record should NOT have apiKey
      const db = await getDB();
      const record = await db.get("settings", "default");
      expect(record).toBeDefined();
      expect(record!.apiKey).toBeUndefined();

      // saveApiKey should have been called with the key
      expect(mockSaveApiKey).toHaveBeenCalledWith("sk-tauri-secret");
    });

    it("stores apiKey in IndexedDB on PWA and does NOT call saveApiKey", async () => {
      mockIsTauri.mockReturnValue(false);

      const config = {
        provider: "anthropic" as const,
        model: "claude-haiku-4-5",
        apiKey: "sk-pwa-key",
        endpoint: "",
      };

      await useMirrorStore().saveLLMConfig(config);

      // IDB record should have apiKey
      const db = await getDB();
      const record = await db.get("settings", "default");
      expect(record).toBeDefined();
      expect(record!.apiKey).toBe("sk-pwa-key");

      // saveApiKey should NOT be called on PWA
      expect(mockSaveApiKey).not.toHaveBeenCalled();
    });
  });

  describe("clearLLMConfig", () => {
    it("clears llmConfig and deletes IDB record, and calls clearApiKey on Tauri", async () => {
      mockIsTauri.mockReturnValue(true);

      // Save a config first
      const config = {
        provider: "anthropic" as const,
        model: "claude-sonnet-4-20250514",
        apiKey: "sk-to-clear",
        endpoint: "https://api.anthropic.com",
      };
      await useMirrorStore().saveLLMConfig(config);
      expect(useMirrorStore().isLLMConfigured).toBe(true);

      // Clear
      await useMirrorStore().clearLLMConfig();

      // In-memory state
      expect(useMirrorStore().llmConfig).toBeNull();
      expect(useMirrorStore().isLLMConfigured).toBe(false);

      // IDB record deleted
      const db = await getDB();
      const record = await db.get("settings", "default");
      expect(record).toBeUndefined();

      // On Tauri, clearApiKey was called
      expect(mockClearApiKey).toHaveBeenCalled();
    });

    it("does NOT call clearApiKey on PWA", async () => {
      mockIsTauri.mockReturnValue(false);

      const config = {
        provider: "openai" as const,
        model: "gpt-4o",
        apiKey: "sk-pwa-clear",
        endpoint: "",
      };
      await useMirrorStore().saveLLMConfig(config);

      await useMirrorStore().clearLLMConfig();

      expect(useMirrorStore().llmConfig).toBeNull();
      expect(mockClearApiKey).not.toHaveBeenCalled();
    });
  });

  describe("isLLMConfigured", () => {
    it("is false by default (null config)", () => {
      expect(useMirrorStore().isLLMConfigured).toBe(false);
    });

    it("is true after saving a config", async () => {
      await useMirrorStore().saveLLMConfig({
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        apiKey: "sk-key",
        endpoint: "",
      });
      expect(useMirrorStore().isLLMConfigured).toBe(true);
    });

    it("is false after clearing the config", async () => {
      await useMirrorStore().saveLLMConfig({
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        apiKey: "sk-key",
        endpoint: "",
      });
      await useMirrorStore().clearLLMConfig();
      expect(useMirrorStore().isLLMConfigured).toBe(false);
    });
  });
});
