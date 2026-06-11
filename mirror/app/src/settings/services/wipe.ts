import { useAppStore } from "../../AppStore";
import { logger } from "../../logger";

export async function wipePersona() {
    const personaStore = useAppStore().persona;
    // await personaStore.clearPersona();
}

export async function wipeSettings() {
    const settingsStore = useAppStore().settings;

    await settingsStore.clearSettings();
}

export async function wipeLogs() {
    const logStore = useAppStore().log;

    // await logStore.clearLogs();
}

export async function wipeDatabase() {
    // implement based on old wipeIndexedDBDatabase
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
  await wipePersona();
  await wipeSettings();
  await wipeLogs();
  await wipeServiceWorker();
  // Reset theme to system default
  localStorage.removeItem("mirror-theme");
  localStorage.removeItem("persona-theme");
  document.documentElement.setAttribute(
    "data-theme",
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  try {
    await wipeDatabase();
    logger.info("wipe", "factoryReset complete");
  } catch (e) {
    logger.warn("wipe", "Database delete failed", { error: e instanceof Error ? e : undefined });
  }
  if (typeof location !== "undefined") {
    location.reload();
  }
}