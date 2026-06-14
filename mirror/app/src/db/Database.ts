import { openDB, deleteDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * The one central IndexedDB module (layering rule 11 / CONVENTIONS 2.8): it owns
 * the database name, version, object-store registry, and the upgrade callback.
 * IndexedDB is a single database at a single version, so exactly one module may
 * open the connection. Each feature owns its own DTO type and read/write
 * functions in `<feature>/db/`, importing the connection from here — no feature
 * opens its own connection.
 */

export const DB_NAME = "mirror-db";
export const DB_VERSION = 1;

/**
 * The object stores in the one database, named once here so features reference
 * `STORES.interview` rather than the bare string literal `"interview"`.
 */
export const STORES = {
    settings: "settings",
    persona: "persona",
    interview: "interview",
} as const;

/**
 * Schema for the connection. This rung declares the *stores*; it does not define
 * their *value shapes* — each store's value is the persisted DTO owned by that
 * feature's own `<feature>/db/` module (interview = Phase 2.2; persona/settings
 * = their own refactors). Until then values are `unknown`; a feature's db module
 * narrows at its own boundary (a cast there, or interface augmentation).
 */
export interface MirrorDB extends DBSchema {
    settings: { key: string; value: unknown };
    persona: { key: string; value: unknown };
    interview: { key: string; value: unknown };
}

// Lazy memoized singleton connection. Nulled by closeDB so the next getDB()
// re-opens (the test harness deletes the database between tests).
let dbPromise: Promise<IDBPDatabase<MirrorDB>> | null = null;

/**
 * The connection accessor. Lazily opens the one database and memoizes the
 * promise. (A lazy-caching accessor that can fail loudly — the open exception to
 * naming rule 6.2 that CONVENTIONS lists as still-open; `getDB` is the term the
 * codebase already standardizes on.)
 */
export function getDB(): Promise<IDBPDatabase<MirrorDB>> {
    if (!dbPromise) {
        dbPromise = openDB<MirrorDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                for (const name of Object.values(STORES)) {
                    if (!db.objectStoreNames.contains(name)) {
                        db.createObjectStore(name, { keyPath: "id" });
                    }
                }
            },
        });
    }
    return dbPromise;
}

/**
 * Close the live connection and drop the memoized promise so the next getDB()
 * re-opens. Safe to call synchronously; the close is fire-and-forget because
 * callers (e.g. a delete that follows) tolerate the race via deleteDatabase's
 * blocked path.
 */
export function closeDB(): void {
    if (dbPromise) {
        const closing = dbPromise;
        dbPromise = null;
        closing.then((db) => db.close()).catch(() => {});
    }
}

/**
 * Drop the entire database. The DB-layer wipe primitive; a future `src/core`
 * factory-reset composes this with each feature's own clear actions.
 */
export async function wipeDatabase(): Promise<void> {
    closeDB();
    await deleteDB(DB_NAME, {
        blocked() {
            closeDB();
        },
    });
}
