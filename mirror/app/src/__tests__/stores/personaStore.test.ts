import { describe, it, expect, beforeEach } from "vitest";
import { usePersonaStore } from "../../stores/personaStore";
import { getDB } from "../../db/schema";
import { minimalPersona, richPersona } from "../factories/persona";

function resetStore() {
  usePersonaStore().$patch({ persona: null, loaded: false });
}

describe("personaStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("load", () => {
    it("sets persona to null when no record exists", async () => {
      await usePersonaStore().load();
      const state = usePersonaStore();
      expect(state.loaded).toBe(true);
      expect(state.persona).toBeNull();
    });

    it("reads existing persona from IndexedDB", async () => {
      const db = await getDB();
      const stored = {
        id: "default" as const,
        data: minimalPersona(),
        derived: { how_i_work_best: ["Clear goals"] },
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-01-15T10:00:00.000Z",
      };
      await db.put("persona", stored);

      await usePersonaStore().load();
      const state = usePersonaStore();
      expect(state.persona).not.toBeNull();
      expect(state.persona!.data.persona.identity.name).toBe("Jane Doe");
      expect(state.persona!.derived.how_i_work_best).toEqual(["Clear goals"]);
    });
  });

  describe("save", () => {
    it("writes a new persona and sets in-memory state", async () => {
      const persona = richPersona();
      await usePersonaStore().save(persona, [
        "Give me autonomy",
        "Value deep discussions",
      ]);

      const state = usePersonaStore();
      expect(state.persona).not.toBeNull();
      expect(state.persona!.data.persona.identity.name).toBe("Alex Chen");
      expect(state.persona!.derived.how_i_work_best).toHaveLength(2);

      // Verify persistence
      const db = await getDB();
      const record = await db.get("persona", "default");
      expect(record).toBeDefined();
      expect(record!.data.persona.identity.name).toBe("Alex Chen");
    });

    it("overwrites existing persona but preserves createdAt", async () => {
      const persona = minimalPersona();
      await usePersonaStore().save(persona, []);
      const firstCreatedAt = usePersonaStore().persona!.createdAt;

      // Wait a tick so updatedAt is different
      await new Promise((r) => setTimeout(r, 10));

      const newPersona = richPersona();
      await usePersonaStore().save(newPersona, []);
      const state = usePersonaStore();

      expect(state.persona!.createdAt).toBe(firstCreatedAt);
      expect(state.persona!.updatedAt).not.toBe(firstCreatedAt);
      expect(state.persona!.data.persona.identity.name).toBe("Alex Chen");
    });

    it("uses empty howIWorkBest array by default", async () => {
      await usePersonaStore().save(minimalPersona());
      expect(usePersonaStore().persona!.derived.how_i_work_best).toEqual([]);
    });
  });

  describe("setDerived", () => {
    it("updates only howIWorkBest, preserving persona data", async () => {
      await usePersonaStore().save(richPersona(), []);
      const originalName = usePersonaStore().persona!.data.persona.identity.name;

      await usePersonaStore().setDerived(["New statement"]);
      const state = usePersonaStore();

      expect(state.persona!.data.persona.identity.name).toBe(originalName);
      expect(state.persona!.derived.how_i_work_best).toEqual(["New statement"]);
    });

    it("no-ops when persona is null", async () => {
      await usePersonaStore().setDerived(["Should not work"]);
      expect(usePersonaStore().persona).toBeNull();
    });
  });

  describe("clear", () => {
    it("removes from IndexedDB and sets persona to null", async () => {
      await usePersonaStore().save(minimalPersona(), []);
      await usePersonaStore().clear();

      expect(usePersonaStore().persona).toBeNull();

      const db = await getDB();
      const record = await db.get("persona", "default");
      expect(record).toBeUndefined();
    });
  });

  describe("importFromJSON", () => {
    it("parses and saves valid PersonaJSON", async () => {
      const json = JSON.stringify(minimalPersona());
      await usePersonaStore().importFromJSON(json);

      const state = usePersonaStore();
      expect(state.persona).not.toBeNull();
      expect(state.persona!.data.persona.identity.name).toBe("Jane Doe");
      expect(state.persona!.derived.how_i_work_best).toEqual([]);
    });

    it("throws on invalid JSON with field-level error", async () => {
      const bad = JSON.stringify({ persona: { identity: { name: "Test" } } });
      await expect(
        usePersonaStore().importFromJSON(bad)
      ).rejects.toThrow(/persona/);
    });

    it("throws on malformed JSON", async () => {
      await expect(
        usePersonaStore().importFromJSON("not json at all")
      ).rejects.toThrow();
    });
  });
});
