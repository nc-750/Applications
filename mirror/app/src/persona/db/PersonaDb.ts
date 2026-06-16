// The Persona feature's persistence layer — the sole owner of reading and
// writing the persona record (CONVENTIONS 2.2). It owns the persisted DTO (1.4)
// and the persistence key, attaches to the one shared connection (`src/db`, rule
// 2.8), and crosses the domain↔persistence boundary only through the transforms
// in `../mappers` (1.5).
//
// One persona per device (CLAUDE.md "one mirror per device"): the persona is
// persisted standalone under key "default" in the `persona` store. A future
// `src/core/` composer will assemble this record with the interview into a single
// portable "Mirror document" at the export boundary — that composition is NOT
// built here; this layer owns only the persona half.

import { getDB, STORES } from "../../db";
import type { Persona } from "../models";
import { toPersonaDTO, fromPersonaDTO } from "../mappers";

/** The single per-device record key (CLAUDE.md "one mirror per device"). */
export const PERSONA_KEY = "default";

/**
 * The persisted shape of a persona — owned by this DB layer (1.4). It is the
 * domain `Persona` plus the persistence `id`; the key lives here, never on the
 * domain model. The `persona` store's keyPath is "id" (see `db/Database.ts`).
 */
export interface PersonaDTO extends Persona {
    id: string;
}

/** Read the persisted persona, or null when none has been stored yet. */
export async function readPersona(): Promise<Persona | null> {
    const db = await getDB();
    // The shared schema types this store's value as `unknown` (each feature
    // narrows at its own boundary — see `db/Database.ts`); this is that cast.
    const value = (await db.get(STORES.persona, PERSONA_KEY)) as
        | PersonaDTO
        | undefined;
    return value ? fromPersonaDTO(value) : null;
}

/** Persist the persona, overwriting any existing record. */
export async function writePersona(persona: Persona): Promise<void> {
    const db = await getDB();
    // keyPath store → the key travels inside the DTO; no explicit key argument.
    await db.put(STORES.persona, toPersonaDTO(persona));
}

/** Remove the persisted persona record. */
export async function clearPersona(): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.persona, PERSONA_KEY);
}
