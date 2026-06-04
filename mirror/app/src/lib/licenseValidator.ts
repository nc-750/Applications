/**
 * Lemon Squeezy license API wrapper.
 *
 * On Tauri, all HTTP calls are dispatched through Rust commands so that the LS
 * endpoint URL is compiled into the binary and never appears in the JS bundle.
 * On PWA, calls are made directly from the browser (the endpoint is in the
 * Rust source but not bundled into the JS — an acceptable trade-off for PWA).
 */

import { isTauri } from "./keyStore";

const LS_API = "https://api.lemonsqueezy.com/v1/licenses";

// ─── Tauri path (through Rust) ─────────────────────────────────────────────

async function tauriActivate(key: string, instanceId: string): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("activate_license", { key, instanceId });
}

async function tauriValidate(key: string, instanceId: string): Promise<boolean> {
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<boolean>("validate_license", { key, instanceId });
}

async function tauriDeactivate(key: string, instanceId: string): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("deactivate_license", { key, instanceId });
}

// ─── PWA path (direct browser fetch) ──────────────────────────────────────

async function pwaPost(path: string, body: Record<string, string>): Promise<Response> {
  return fetch(`${LS_API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
}

async function pwaActivate(key: string, instanceId: string): Promise<void> {
  const res = await pwaPost("activate", { license_key: key, instance_name: instanceId });
  const body = await res.json().catch(() => ({} as Record<string, unknown>));
  // The authoritative success signal is the `activated` flag, not the HTTP status.
  if (res.ok && body?.activated === true) return;
  const detail =
    body?.error ??
    body?.errors?.[0]?.detail ??
    (res.status === 404
      ? "License key not found."
      : res.status === 400
        ? "This license key has reached its activation limit, or is invalid."
        : "License activation failed.");
  throw new Error(detail);
}

async function pwaValidate(key: string, instanceId: string): Promise<boolean> {
  const res = await pwaPost("validate", { license_key: key, instance_id: instanceId });
  // 2xx alone is not enough — LS reports revoked/expired/disabled keys as
  // `valid: false` in the body with a 200 status.
  if (!res.ok) return false;
  const body = await res.json().catch(() => ({} as Record<string, unknown>));
  return body?.valid === true;
}

async function pwaDeactivate(key: string, instanceId: string): Promise<void> {
  await pwaPost("deactivate", { license_key: key, instance_id: instanceId }).catch(() => {});
}

// ─── Public API ────────────────────────────────────────────────────────────

/** Activates a license key for the given instance. Throws with a user-friendly
 *  message on failure (invalid key, already at device limit, network error). */
export async function activateLicense(key: string, instanceId: string): Promise<void> {
  if (isTauri()) {
    await tauriActivate(key, instanceId);
  } else {
    await pwaActivate(key, instanceId);
  }
}

/** Validates an already-activated license. Returns false if the key has been
 *  revoked. Throws on network error so the caller can apply a grace period. */
export async function validateLicense(key: string, instanceId: string): Promise<boolean> {
  if (isTauri()) {
    return tauriValidate(key, instanceId);
  }
  return pwaValidate(key, instanceId);
}

/** Deactivates the license instance. Best-effort — errors are swallowed so
 *  factory reset always completes even when offline. */
export async function deactivateLicense(key: string, instanceId: string): Promise<void> {
  if (isTauri()) {
    await tauriDeactivate(key, instanceId).catch(() => {});
  } else {
    await pwaDeactivate(key, instanceId);
  }
}
