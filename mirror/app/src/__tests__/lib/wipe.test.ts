import { describe, it, expect, beforeEach, vi } from "vitest";
import { wipePersonaData, wipeAiProvider, factoryReset } from "../../lib/wipe";
import { usePersonaStore } from "../../stores/personaStore";
import { useInterviewStore } from "../../stores/interviewStore";
import { useMirrorStore } from "../../stores/mirror";
import { useLicenseStore } from "../../stores/licenseStore";
import { getDB } from "../../db/schema";

// Mock keyStore
const mockClearApiKey = vi.fn();
const mockIsTauri = vi.fn(() => false);
const mockLoadApiKey = vi.fn();
const mockSaveApiKey = vi.fn();

vi.mock("../../lib/keyStore", () => ({
  clearApiKey: (...args: unknown[]) => mockClearApiKey(...args),
  isTauri: () => mockIsTauri(),
  loadApiKey: (...args: unknown[]) => mockLoadApiKey(...args),
  saveApiKey: (...args: unknown[]) => mockSaveApiKey(...args),
}));

// Mock licenseValidator so deactivate never makes an HTTP call
vi.mock("../../lib/licenseValidator", () => ({
  activateLicense: vi.fn(),
  validateLicense: vi.fn(),
  deactivateLicense: vi.fn(),
}));

// Mock the old settingsStore (still referenced by interviewStore) to avoid
// Vite/Rollup parse errors on the .ts.old extension.
vi.mock("../../stores/settingsStore.ts.old", () => ({
  useSettingsStore: vi.fn(() => ({
    provider: "openai",
    model: "gpt-4o",
    apiKey: "",
    endpoint: "",
  })),
}));

// Mock licenseKeyStore so keyring operations are no-ops
vi.mock("../../lib/licenseKeyStore", () => ({
  clearLicenseKey: vi.fn(),
  loadLicenseKey: vi.fn(),
  saveLicenseKey: vi.fn(),
}));

describe("wipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadApiKey.mockResolvedValue(null);
    mockIsTauri.mockReturnValue(false);
  });

  describe("wipePersonaData", () => {
    it("clears persona and interview records from IndexedDB", async () => {
      // Pre-populate persona in IndexedDB
      const db = await getDB();
      const now = new Date().toISOString();
      await db.put("persona", {
        id: "default",
        data: {
          persona: {
            identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" },
            strengths: [],
            weaknesses: [],
            skills: [],
            career_timeline: [],
            non_professional: [],
            personality_traits: [],
            values: [],
            hidden_assets: [],
            goals: {},
            use_cases: {},
          },
          metadata: {
            sources_used: [],
            language: "en",
            generated_at: now,
            version: "1.0",
          },
        },
        derived: { how_i_work_best: [] },
        createdAt: now,
        updatedAt: now,
      });
      await db.put("interview", {
        id: "default",
        status: "active",
        initialData: "test data",
        messages: [],
        createdAt: now,
        updatedAt: now,
      });

      // Verify pre-population
      expect(await db.get("persona", "default")).toBeDefined();
      expect(await db.get("interview", "default")).toBeDefined();

      await wipePersonaData();

      // Verify records are deleted from IndexedDB
      expect(await db.get("persona", "default")).toBeUndefined();
      expect(await db.get("interview", "default")).toBeUndefined();
    });
  });

  describe("wipeAiProvider", () => {
    it("clears llmConfig and deletes settings record from IndexedDB", async () => {
      mockIsTauri.mockReturnValue(false);

      // Pre-populate settings via the store
      const store = useMirrorStore();
      await store.saveLLMConfig({
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        apiKey: "sk-wipe-test",
        endpoint: "https://api.anthropic.com",
      });
      expect(store.llmConfig).not.toBeNull();
      expect(store.isLLMConfigured).toBe(true);

      // Verify IDB record exists
      const db = await getDB();
      expect(await db.get("settings", "default")).toBeDefined();

      await wipeAiProvider();

      // In-memory state cleared
      expect(store.llmConfig).toBeNull();
      expect(store.isLLMConfigured).toBe(false);

      // IDB record deleted
      expect(await db.get("settings", "default")).toBeUndefined();

      // On PWA, clearApiKey is NOT called (wipeAiProvider calls it unconditionally,
      // but the mocked implementation is a no-op outside Tauri).
      expect(mockClearApiKey).toHaveBeenCalled();
    });

    it("calls clearApiKey on Tauri", async () => {
      mockIsTauri.mockReturnValue(true);

      const store = useMirrorStore();
      await store.saveLLMConfig({
        provider: "openai",
        model: "gpt-4o",
        apiKey: "sk-tauri-wipe",
        endpoint: "",
      });

      await wipeAiProvider();

      // clearApiKey is called (by wipeAiProvider directly, then by clearLLMConfig)
      expect(mockClearApiKey).toHaveBeenCalled();
    });
  });

  describe("factoryReset", () => {
    it("deletes the IndexedDB database and reloads the page", async () => {
      // Pre-populate data
      const db = await getDB();
      const now = new Date().toISOString();

      await db.put("settings", {
        id: "default",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        apiKey: "sk-factory-reset",
        endpoint: "",
        updatedAt: now,
      });
      await db.put("persona", {
        id: "default",
        data: {
          persona: {
            identity: { name: "Test", tagline: "Dev", elevator_pitch: "Hi" },
            strengths: [],
            weaknesses: [],
            skills: [],
            career_timeline: [],
            non_professional: [],
            personality_traits: [],
            values: [],
            hidden_assets: [],
            goals: {},
            use_cases: {},
          },
          metadata: {
            sources_used: [],
            language: "en",
            generated_at: now,
            version: "1.0",
          },
        },
        derived: { how_i_work_best: [] },
        createdAt: now,
        updatedAt: now,
      });

      expect(await db.get("settings", "default")).toBeDefined();
      expect(await db.get("persona", "default")).toBeDefined();

      // Mock location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, "location", {
        value: { reload: mockReload },
        writable: true,
      });

      await factoryReset();

      // IndexedDB database should be deleted
      const databases = await indexedDB.databases();
      const ourDb = databases.find((d) => d.name === "mirror-db");
      expect(ourDb).toBeUndefined();

      // location.reload should have been called
      expect(mockReload).toHaveBeenCalled();
    });
  });
});
