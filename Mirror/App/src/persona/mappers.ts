// Boundary transforms for the Persona feature (CONVENTIONS 1.5/1.6): the single
// place the domain↔persistence crossing is found and changed. These are pure —
// they only stamp on / strip off the persistence key. They are called only by the
// feature's db module (`db/PersonaDb.ts`, rule 2.2) — never by the store, service,
// or view.

import type { Persona } from "./models";
import { PERSONA_KEY, type PersonaDTO } from "./db/PersonaDb";

/** Domain → persisted DTO: stamp on the per-device key. */
export function toPersonaDTO(persona: Persona): PersonaDTO {
    return { id: PERSONA_KEY, ...persona };
}

/** Persisted DTO → domain: drop the persistence key (it never reaches a store/view). */
export function fromPersonaDTO(dto: PersonaDTO): Persona {
    const { id: _id, ...persona } = dto;
    return persona;
}
