/**
 * Three-tier destructive-data helpers (Phase 2 security hardening).
 *
 *   wipePersonaData()  → persona + interview records only
 *   wipeAiProvider()   → settings record + Tauri key store
 *   wipeServiceWorker()→ caches + service worker registrations
 *   factoryReset()     → all of the above + delete IndexedDB + reload
 *
 * Each helper is independently callable; `factoryReset` simply chains them.
 * All steps are wrapped in defensive try/catch where a partial failure is
 * recoverable — we don't want a transient caches API error to prevent the
 * IndexedDB from being deleted.
 */

import { wipeIndexedDBDatabase } from "../db/schema";
import { clearApiKey } from "./keyStore";
import { usePersonaStore } from "../stores/personaStore";
import { useInterviewStore } from "../stores/interviewStore";
import { useMirrorStore } from "../stores/mirror";
import { useLicenseStore } from "../stores/licenseStore";
import { logger } from "../logger";

/**
 * Tier 1 — clears persona and interview records. Leaves settings (provider,
 * model, API key) untouched. Both Pinia stores are reset in-memory.
 */
export async function wipePersonaData(): Promise<void> {
  await usePersonaStore().clear();
  await useInterviewStore().clear();
}

/**
 * Tier 2 — clears AI provider settings: IndexedDB settings record + Tauri
 * key store file + Pinia settings reset to defaults.
 */
export async function wipeAiProvider(): Promise<void> {
  await clearApiKey();
  await useMirrorStore().clearLLMConfig();
}

/**
 * Tier 3 helper — unregister all service workers and delete all caches.
 * Best-effort: guarded on feature presence and wrapped in try/catch so
 * failures don't block the surrounding factory reset.
 */
export async function wipeServiceWorker(): Promise<void> {
  try {
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    logger.warn("wipe", "caches delete failed", { error: e instanceof Error ? e : undefined });
  }
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (e) {
    logger.warn("wipe", "service worker unregister failed", { error: e instanceof Error ? e : undefined });
  }
}

/**
 * Tier 3 — full factory reset. Order matters: clear in-memory + IndexedDB
 * stores via the typed helpers first (so any open transactions complete on
 * the live connection), then drop the entire IndexedDB database, then nuke
 * caches + SW, then reload the page so the app boots fresh.
 */
export async function factoryReset(): Promise<void> {
  await wipePersonaData();
  await wipeAiProvider();
  // Deactivate license — calls LS API (best-effort) and clears keyring + IDB record.
  try {
    await useLicenseStore().deactivate();
  } catch (e) {
    logger.warn("wipe", "license deactivate failed", { error: e instanceof Error ? e : undefined });
  }
  await wipeServiceWorker();
  // Reset theme to system default
  localStorage.removeItem("mirror-theme");
  localStorage.removeItem("persona-theme");
  document.documentElement.setAttribute(
    "data-theme",
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  try {
    await wipeIndexedDBDatabase();
    logger.info("wipe", "factoryReset complete");
  } catch (e) {
    logger.warn("wipe", "indexedDB delete failed", { error: e instanceof Error ? e : undefined });
  }
  if (typeof location !== "undefined") {
    location.reload();
  }
}
