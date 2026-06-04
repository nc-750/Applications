import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { StoredPersona } from "../types/persona";
import type { Provider } from "../llm/types";
import type { LicenseRecord } from "../types/license";

export type { Provider };
export type { LicenseRecord };

export interface SettingsRecord {
  id: "default";
  provider: Provider;
  model: string;
  apiKey: string;
  endpoint?: string;
  debugEnabled?: boolean;
  updatedAt: string;
}

export interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isError?: boolean;
}

export type InterviewStatus = "idle" | "active" | "synthesizing" | "completed" | "error";

export interface InterviewRecord {
  id: "default";
  status: InterviewStatus;
  /** Set when status is "error": a one-line reason the synthesis failed, shown to the user. */
  synthesisError?: string;
  /** The context brief sent to the LLM — verbatim input OR an LLM-digested extract, depending on size. */
  initialData: string;
  /** Raw text typed by the user in the data-input step (before file contents are appended). */
  inputText?: string;
  /** Names of files the user uploaded (contents are NOT stored, only the names). */
  uploadedFileNames?: string[];
  /** Whether the initialData was condensed via LLM digest (true = digested, false/absent = verbatim). */
  wasDigested?: boolean;
  messages: InterviewMessage[];
  createdAt: string;
  updatedAt: string;
}

interface PersonaDB extends DBSchema {
  settings: {
    key: string;
    value: SettingsRecord;
  };
  persona: {
    key: string;
    value: StoredPersona;
  };
  interview: {
    key: string;
    value: InterviewRecord;
  };
  license: {
    key: string;
    value: LicenseRecord;
  };
}

export const DB_NAME = "mirror-db";
const OLD_DB_NAME = "persona-db";

let dbInstance: IDBPDatabase<PersonaDB> | null = null;

/**
 * One-time migration: copies data from the old "persona-db" into the new
 * "mirror-db", then deletes the old database. Runs on first `getDB()` call.
 * Failures are logged but never thrown — a fresh start is better than a crash.
 */
async function migrateFromOldDB(): Promise<void> {
  const oldReq = indexedDB.open(OLD_DB_NAME);
  const oldExists = await new Promise<boolean>((resolve) => {
    oldReq.onsuccess = () => resolve(true);
    oldReq.onerror = () => resolve(false);
  });
  if (!oldExists) return;

  try {
    const oldDB = oldReq.result;
    const storeNames = Array.from(oldDB.objectStoreNames);
    const db = await getDB();
    for (const name of storeNames) {
      const tx = oldDB.transaction(name, "readonly");
      const store = tx.objectStore(name);
      const items = await new Promise<{ key: IDBValidKey; value: unknown }[]>((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => resolve([]);
      });
      // Need to handle keyPath vs auto-generated keys; these stores all have keyPath
      const newTx = db.transaction(name as "settings" | "persona" | "interview" | "license", "readwrite");
      const newStore = newTx.objectStore(name as "settings" | "persona" | "interview" | "license");
      for (const item of items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newStore.put(item.value as any);
      }
      await newTx.done;
    }
    oldDB.close();
    indexedDB.deleteDatabase(OLD_DB_NAME);
  } catch {
    // Best-effort: if migration fails the app starts fresh
  }
}

export async function getDB(): Promise<IDBPDatabase<PersonaDB>> {
  if (dbInstance) return dbInstance;
  await migrateFromOldDB();
  dbInstance = await openDB<PersonaDB>(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore("settings", { keyPath: "id" });
        db.createObjectStore("persona", { keyPath: "id" });
        db.createObjectStore("interview", { keyPath: "id" });
      }
      if (oldVersion < 2) {
        db.createObjectStore("license", { keyPath: "id" });
      }
    },
  });
  return dbInstance;
}

/**
 * Closes the cached IndexedDB connection and clears the module-level handle so
 * the next `getDB()` call reopens fresh. Used by `wipeIndexedDBDatabase()` to
 * allow `indexedDB.deleteDatabase()` to succeed without being blocked by an
 * open connection.
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Deletes the entire IndexedDB database file. Closes the cached connection
 * first so the delete request isn't blocked. Resolves when the deletion
 * succeeds, or rejects on error. A `blocked` event (another tab holding the
 * DB open) is surfaced as a rejection so the caller can decide what to do.
 */
export function wipeIndexedDBDatabase(): Promise<void> {
  closeDB();
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("deleteDatabase failed"));
    req.onblocked = () => reject(new Error("deleteDatabase blocked by another connection"));
  });
}
