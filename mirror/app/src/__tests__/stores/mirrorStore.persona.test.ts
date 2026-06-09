import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMirrorStore } from "../../stores/mirror";
import { getDB } from "../../db/schema";
import { minimalPersona } from "../factories/persona";

// Mock keyStore
vi.mock("../../lib/keyStore", () => ({
  loadApiKey: vi.fn().mockResolvedValue(null),
  saveApiKey: vi.fn(),
  clearApiKey: vi.fn(),
  isTauri: () => false,
}));

describe("mirrorStore persona", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const db = await getDB();
    try { await db.delete("persona", "default"); } catch { /* ok */ }
  });

  describe("savePersona + loadPersona round-trip", () => {
    it("persists persona data and reloads it", async () => {
      const store = useMirrorStore();
      const data = minimalPersona();

      await store.savePersona(data, ["Clear communication", "Async-first"]);

      // Verify in-memory state
      expect(store.persona).not.toBeNull();
      expect(store.persona!.data.persona.identity.name).toBe("Jane Doe");
      expect(store.persona!.derived.how_i_work_best).toEqual(["Clear communication", "Async-first"]);

      // Verify IndexedDB persistence
      const db = await getDB();
      const record = await db.get("persona", "default");
      expect(record).toBeDefined();
      expect(record!.data.persona.identity.name).toBe("Jane Doe");

      // Simulate fresh app start
      setActivePinia(createPinia());
      const freshStore = useMirrorStore();
      expect(freshStore.personaLoaded).toBe(false);

      await freshStore.loadPersona();

      expect(freshStore.personaLoaded).toBe(true);
      expect(freshStore.persona).not.toBeNull();
      expect(freshStore.persona!.data.persona.identity.name).toBe("Jane Doe");
      expect(freshStore.persona!.derived.how_i_work_best).toEqual(["Clear communication", "Async-first"]);
    });
  });

  describe("importPersonaFromJSON", () => {
    it("stores valid JSON string correctly", async () => {
      const store = useMirrorStore();
      const json = JSON.stringify(minimalPersona());

      await store.importPersonaFromJSON(json);

      expect(store.persona).not.toBeNull();
      expect(store.persona!.data.persona.identity.name).toBe("Jane Doe");

      // Verify persistence
      const db = await getDB();
      const record = await db.get("persona", "default");
      expect(record).toBeDefined();
    });

    it("throws on invalid JSON (non-persona data)", async () => {
      const store = useMirrorStore();
      const json = JSON.stringify({ not: "a persona" });

      await expect(store.importPersonaFromJSON(json)).rejects.toThrow();
      expect(store.persona).toBeNull();
    });
  });

  describe("setDerived", () => {
    it("updates only the how_i_work_best field, preserving persona data", async () => {
      const store = useMirrorStore();
      await store.savePersona(minimalPersona(), ["Old value"]);

      await store.setDerived(["Updated value 1", "Updated value 2"]);

      expect(store.persona!.data.persona.identity.name).toBe("Jane Doe"); // preserved
      expect(store.persona!.derived.how_i_work_best).toEqual(["Updated value 1", "Updated value 2"]);

      // Verify persistence
      const db = await getDB();
      const record = await db.get("persona", "default");
      expect(record!.derived.how_i_work_best).toEqual(["Updated value 1", "Updated value 2"]);
    });

    it("is a no-op when no persona exists", async () => {
      const store = useMirrorStore();
      await store.setDerived(["Something"]);
      expect(store.persona).toBeNull();
    });
  });

  describe("clearPersona", () => {
    it("removes persona from IndexedDB and resets state to null", async () => {
      const store = useMirrorStore();
      await store.savePersona(minimalPersona());
      expect(store.persona).not.toBeNull();

      await store.clearPersona();

      expect(store.persona).toBeNull();

      const db = await getDB();
      const record = await db.get("persona", "default");
      expect(record).toBeUndefined();
    });
  });

  describe("loadPersona — empty state", () => {
    it("sets personaLoaded=true with persona=null when no record exists", async () => {
      const store = useMirrorStore();
      expect(store.personaLoaded).toBe(false);

      await store.loadPersona();

      expect(store.personaLoaded).toBe(true);
      expect(store.persona).toBeNull();
    });
  });
});
