// Boundary transforms for the Settings feature (CONVENTIONS 1.5/1.6): the single
// place the domain↔persistence crossing is found and changed. These are pure —
// they only stamp on / strip off the persistence key. The platform-specific
// API-key split (Tauri keyring vs IndexedDB) is NOT here; it is the db module's
// impure concern (`db/SettingsDb.ts`). These are called only by that db module
// (rule 2.2) — never by the store, service, or view.

import type { Settings } from "./models";
import { SETTINGS_KEY, type SettingsDTO } from "./db/SettingsDb";

/** Domain → persisted DTO: stamp on the per-device key. */
export function toSettingsDTO(settings: Settings): SettingsDTO {
    return { id: SETTINGS_KEY, ...settings };
}

/** Persisted DTO → domain: drop the persistence key (it never reaches a store/view). */
export function fromSettingsDTO(dto: SettingsDTO): Settings {
    const { id: _id, ...settings } = dto;
    return settings;
}
