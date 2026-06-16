// The Settings feature's persistence layer — the sole owner of reading and
// writing the settings record (CONVENTIONS 2.2). It owns the persisted DTO (1.4)
// and the persistence key, attaches to the one shared connection (`src/db`, rule
// 2.8), and crosses the domain↔persistence boundary only through the transforms
// in `../mappers` (1.5).
//
// Platform key split (decision: brief Phase 2). The API key is sensitive, so on
// Tauri it lives in the OS keyring (`keyStore.ts`) and the persisted DTO carries
// `apiKey: ""`; in the PWA there is no keyring, so the key lives in the DTO in
// IndexedDB. That split is THIS layer's implementation detail — the store and
// view always see a complete `Settings` with `apiKey` populated, never knowing
// where it was stored.

import { getDB, STORES } from "../../db";
import type { Settings } from "../models";
import { toSettingsDTO, fromSettingsDTO } from "../mappers";
import { isTauri, saveApiKey, loadApiKey, clearApiKey } from "./keyStore";

/** The single per-device record key (CLAUDE.md "one mirror per device"). */
export const SETTINGS_KEY = "default";

/**
 * The persisted shape of settings — owned by this DB layer (1.4). It is the
 * domain `Settings` plus the persistence `id`; the key lives here, never on the
 * domain model. The `settings` store's keyPath is "id" (see `db/Database.ts`).
 */
export interface SettingsDTO extends Settings {
    id: string;
}

/** Read the persisted settings, or null when none has been stored yet.
 *
 *  On Tauri the API key is restored from the OS keyring (the persisted DTO holds
 *  only `apiKey: ""`); on PWA the key is already in the DTO. */
export async function readSettings(): Promise<Settings | null> {
    const db = await getDB();
    // The shared schema types this store's value as `unknown` (each feature
    // narrows at its own boundary — see `db/Database.ts`); this is that cast.
    const value = (await db.get(STORES.settings, SETTINGS_KEY)) as
        | SettingsDTO
        | undefined;
    if (!value) return null;

    const settings = fromSettingsDTO(value);
    if (isTauri()) {
        settings.apiKey = (await loadApiKey()) ?? "";
    }
    return settings;
}

/** Persist the settings, overwriting any existing record.
 *
 *  On Tauri the key is sent to the OS keyring and the DTO is stored with an empty
 *  `apiKey`; on PWA the DTO (key included) is stored as-is. */
export async function writeSettings(settings: Settings): Promise<void> {
    const db = await getDB();
    const dto = toSettingsDTO(settings);
    if (isTauri()) {
        await saveApiKey(settings.apiKey);
        // keyPath store → the key travels inside the DTO; no explicit key arg.
        await db.put(STORES.settings, { ...dto, apiKey: "" });
    } else {
        await db.put(STORES.settings, dto);
    }
}

/** Remove the persisted settings record (and the keyring entry on Tauri). */
export async function clearSettings(): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.settings, SETTINGS_KEY);
    if (isTauri()) {
        await clearApiKey();
    }
}
