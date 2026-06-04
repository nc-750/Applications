/**
 * Local key store for the LLM API key on the Tauri side.
 *
 * On Windows: Windows Credential Manager (DPAPI-encrypted).
 * On macOS:   Keychain.
 * On Linux:   Secret Service / KWallet.
 *
 * In the PWA (no Tauri), every function here is a no-op and the API key
 * is held in IndexedDB via the settings store instead.
 *
 * All calls are wrapped in try/catch: a keyring failure must not crash app
 * boot or block saveSettings.
 */

import { logger } from "../logger";

export const isTauri = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function saveApiKey(apiKey: string): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("save_api_key", { key: apiKey });
  } catch (e) {
    logger.warn("keyring", "saveApiKey failed (degrading to no-op)", { error: e instanceof Error ? e : undefined });
  }
}

export async function loadApiKey(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string | null>("load_api_key");
  } catch (e) {
    logger.warn("keyring", "loadApiKey failed (returning null)", { error: e instanceof Error ? e : undefined });
    return null;
  }
}

export async function clearApiKey(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("delete_api_key");
  } catch (e) {
    logger.warn("keyring", "clearApiKey failed", { error: e instanceof Error ? e : undefined });
  }
}
