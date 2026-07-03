// Cross-feature app-lifecycle teardown (CONVENTIONS 5.7). Lives in src/core/
// because factory reset spans every feature; it composes each feature's own
// public clear action (5.8) rather than reaching into their internals. Stores
// are injected (2.5) — core never calls use*Store() itself.

import { wipeDatabase } from "../db";
import { clearLogs, logger } from "../logger";
import type { usePersonaStore } from "../persona/stores";
import type { useSettingsStore } from "../settings/stores";

type PersonaStore = ReturnType<typeof usePersonaStore>;
type SettingsStore = ReturnType<typeof useSettingsStore>;

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
 * Tier 3 — full factory reset. Order matters: compose each feature's own clear
 * action first (so any open transactions complete on the live connection), then
 * drop the entire IndexedDB database via the db-layer primitive, nuke caches +
 * service workers, reset the theme, and reload so the app boots fresh.
 */
export async function factoryReset(
    personaStore: PersonaStore,
    settingsStore: SettingsStore,
): Promise<void> {
    await personaStore.clearPersona();
    await settingsStore.clearSettings();
    clearLogs();
    await wipeServiceWorker();
    // Reset theme to system default.
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
