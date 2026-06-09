import { describe, it, expect, beforeEach, vi } from "vitest";
import { wipePersonaData, wipeAiProvider, factoryReset } from "../../lib/wipe";
import { useMirrorStore } from "../../stores/mirror";
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

describe("wipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadApiKey.mockResolvedValue(null);
    mockIsTauri.mockReturnValue(false);
  });

  describe("wipePersonaData", () => {
    it("clears persona and interview records from IndexedDB via mirrorStore", async () => {
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
            metadata: {
              sources_used: [],
              language: "en",
              generated_at: now,
              version: "1.0",
            },
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

      expect(await db.get("persona", "default")).toBeDefined();
      expect(await db.get("interview", "default")).toBeDefined();

      await wipePersonaData();

      expect(await db.get("persona", "default")).toBeUndefined();
      expect(await db.get("interview", "default")).toBeUndefined();
    });
  });

  describe("wipeAiProvider", () => {
    it("clears llmConfig and deletes settings record from IndexedDB on PWA", async () => {
      mockIsTauri.mockReturnValue(false);

      const store = useMirrorStore();
      await store.saveLLMConfig({
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        apiKey: "sk-wipe-test",
        endpoint: "https://api.anthropic.com",
      });
      expect(store.isLLMConfigured).toBe(true);

      const db = await getDB();
      expect(await db.get("settings", "default")).toBeDefined();

      await wipeAiProvider();

      expect(store.llmConfig).toBeNull();
      expect(store.isLLMConfigured).toBe(false);
      expect(await db.get("settings", "default")).toBeUndefined();
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

      expect(mockClearApiKey).toHaveBeenCalled();
      expect(store.llmConfig).toBeNull();
    });
  });

  describe("factoryReset", () => {
    it("deletes the IndexedDB database and reloads the page", async () => {
      const db = await getDB();
      const now = new Date().toISOString();

      await db.put("settings", {
        id: "default",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
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
            metadata: {
              sources_used: [],
              language: "en",
              generated_at: now,
              version: "1.0",
            },
          },
        },
        derived: { how_i_work_best: [] },
        createdAt: now,
        updatedAt: now,
      });

      expect(await db.get("settings", "default")).toBeDefined();

      const mockReload = vi.fn();
      Object.defineProperty(window, "location", {
        value: { reload: mockReload },
        writable: true,
      });

      await factoryReset();

      const databases = await indexedDB.databases();
      const ourDb = databases.find((d) => d.name === "mirror-db");
      expect(ourDb).toBeUndefined();
      expect(mockReload).toHaveBeenCalled();
    });
  });
});
