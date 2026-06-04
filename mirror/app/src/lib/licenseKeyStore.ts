/**
 * License key bridge — OS keyring on Tauri, IndexedDB rawKey field on PWA.
 *
 * Mirrors the pattern in keyStore.ts. On Tauri the raw key never touches JS
 * at rest; on PWA it is kept in IndexedDB (only persistent option available).
 * All calls are wrapped in try/catch so a keyring failure cannot crash the app.
 */

import { isTauri } from "./keyStore";
import { logger } from "../logger";

export async function saveLicenseKey(key: string): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("save_license_key", { key });
  } catch (e) {
    logger.warn("license", "saveLicenseKey failed (degrading to no-op)", { error: e instanceof Error ? e : undefined });
  }
}

export async function loadLicenseKey(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string | null>("load_license_key");
  } catch (e) {
    logger.warn("license", "loadLicenseKey failed (returning null)", { error: e instanceof Error ? e : undefined });
    return null;
  }
}

export async function clearLicenseKey(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("delete_license_key");
  } catch (e) {
    logger.warn("license", "clearLicenseKey failed", { error: e instanceof Error ? e : undefined });
  }
}

/** Returns the Lemon Squeezy store purchase URL.
 *  Single source for both Tauri and PWA: the VITE_LS_STORE_URL env var, read
 *  from an uncommitted .env file at build time (CI/CD injects it for releases).
 *  It is a public checkout URL — no secret — so bundling it into the JS is fine. */
export async function getStoreUrl(): Promise<string> {
  return (import.meta.env.VITE_LS_STORE_URL as string) ?? "";
}
