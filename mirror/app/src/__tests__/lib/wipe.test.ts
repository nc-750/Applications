import { describe, it, expect, vi, beforeEach } from "vitest";
import { wipePersonaData, wipeAiProvider, wipeServiceWorker, factoryReset } from "../../lib/wipe";
import { usePersonaStore } from "../../stores/personaStore";
import { useInterviewStore } from "../../stores/interviewStore";
import { useSettingsStore } from "../../stores/settingsStore.ts.old";
import { useLicenseStore } from "../../stores/licenseStore";

// Mock keyStore.clearApiKey
vi.mock("../../lib/keyStore", () => ({
  clearApiKey: vi.fn(),
  isTauri: vi.fn(() => false),
  loadApiKey: vi.fn(),
  saveApiKey: vi.fn(),
}));

// Mock licenseKeyStore
vi.mock("../../lib/licenseKeyStore", () => ({
  clearLicenseKey: vi.fn(),
  loadLicenseKey: vi.fn(),
  saveLicenseKey: vi.fn(),
}));

function resetAllStores() {
  usePersonaStore().$patch({ persona: null, loaded: false });
  useInterviewStore().$patch({ record: null, loaded: false, streamingContent: "", isThinking: false, synthesisPhase: null });
  useSettingsStore().$patch({ provider: "openai", model: "gpt-4o", apiKey: "", endpoint: "", debugEnabled: false, loaded: false });
  useLicenseStore().$patch({ isActivated: false, isPro: false, maskedKey: "", instanceId: "", activatedAt: "", lastCheckedAt: "", loaded: false });
}

describe("wipe", () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe("wipePersonaData", () => {
    it("clears persona and interview stores", async () => {
      // Prime stores with some data
      usePersonaStore().$patch({ persona: { id: "default", data: { persona: { identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" }, strengths: [], weaknesses: [], skills: [], career_timeline: [], non_professional: [], personality_traits: [], values: [], hidden_assets: [], goals: {}, use_cases: {}, metadata: { sources_used: [], language: "en", generated_at: "2026-01-01T00:00:00.000Z", version: "1.0" } } }, derived: { how_i_work_best: [] }, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }, loaded: true });
      useInterviewStore().$patch({ record: { id: "default", status: "active", initialData: "test", messages: [], createdAt: "", updatedAt: "" }, loaded: true });

      await wipePersonaData();

      expect(usePersonaStore().persona).toBeNull();
      expect(useInterviewStore().record).toBeNull();
    });
  });

  describe("wipeAiProvider", () => {
    it("resets settings store to defaults", async () => {
      useSettingsStore().$patch({ provider: "anthropic", model: "claude-4", apiKey: "sk-key", endpoint: "https://test.com" });

      await wipeAiProvider();

      const state = useSettingsStore();
      expect(state.provider).toBe("openai");
      expect(state.apiKey).toBe("");
    });
  });

  describe("wipeServiceWorker", () => {
    it("completes without throwing (best-effort)", async () => {
      // Should not throw even if caches/serviceWorker APIs are absent in jsdom
      await expect(wipeServiceWorker()).resolves.toBeUndefined();
    });
  });

  describe("factoryReset", () => {
    it("runs through all steps without throwing (reload skipped in test)", async () => {
      // Override the global location so the final reload is a no-op.
      const originalLocation = globalThis.location;
      delete (globalThis as Record<string, unknown>).location;
      (globalThis as Record<string, unknown>).location = {
        ...originalLocation,
        reload: vi.fn(),
      };

      try {
        await factoryReset();
        expect(true).toBe(true);
      } finally {
        // Restore
        (globalThis as Record<string, unknown>).location = originalLocation;
      }
    });
  });
});
