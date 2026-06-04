import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { getDB } from "../db/schema";
import { parsePersonaJSON, type StoredPersona, type PersonaJSON } from "../types/persona";
import { logger } from "../logger";

async function writePersona(data: PersonaJSON, howIWorkBest: string[]): Promise<StoredPersona> {
  const db = await getDB();
  const existing = await db.get("persona", "default");
  const now = new Date().toISOString();
  const record: StoredPersona = {
    id: "default",
    data,
    derived: { how_i_work_best: howIWorkBest },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.put("persona", record);
  return record;
}

export const usePersonaStore = defineStore("persona", () => {
  // shallowRef: persona records are replaced wholesale and written to IndexedDB,
  // so avoid deep reactive proxies that structured clone can't serialize.
  const persona = shallowRef<StoredPersona | null>(null);
  const loaded = ref(false);

  async function load() {
    const db = await getDB();
    const record = await db.get("persona", "default");
    persona.value = record ?? null;
    loaded.value = true;
  }

  async function save(data: PersonaJSON, howIWorkBest: string[] = []) {
    persona.value = await writePersona(data, howIWorkBest);
    logger.info("store", "Mirror saved");
  }

  async function setDerived(howIWorkBest: string[]) {
    const existing = persona.value;
    if (!existing) return;
    persona.value = await writePersona(existing.data, howIWorkBest);
  }

  async function clear() {
    const db = await getDB();
    await db.delete("persona", "default");
    persona.value = null;
    logger.info("wipe", "Mirror cleared");
  }

  async function importFromJSON(json: string) {
    // parsePersonaJSON validates every field against the Zod schema and throws
    // a single-line, field-pointing error on the first issue.
    const parsed = parsePersonaJSON(JSON.parse(json));
    persona.value = await writePersona(parsed, []);
    logger.info("import", "Mirror imported successfully");
  }

  return { persona, loaded, load, save, setDerived, clear, importFromJSON };
});
