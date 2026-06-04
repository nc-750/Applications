import { defineStore } from "pinia";
import { ref } from "vue";
import { getDB } from "../db/schema";
import { isTauri } from "../lib/keyStore";
import { saveLicenseKey, loadLicenseKey, clearLicenseKey } from "../lib/licenseKeyStore";
import { activateLicense, validateLicense, deactivateLicense } from "../lib/licenseValidator";
import { logger } from "../logger";
import type { LicenseRecord } from "../types/license";

function maskKey(key: string): string {
  return key.length > 8 ? `****-${key.slice(-8)}` : "****";
}

function generateInstanceId(): string {
  return crypto.randomUUID();
}

export const useLicenseStore = defineStore("license", () => {
  const isActivated = ref(false);
  const maskedKey = ref("");
  const instanceId = ref("");
  const activatedAt = ref("");
  const lastCheckedAt = ref("");
  const loaded = ref(false);

  /** True when the user has a valid activated license. Feature code reads this. */
  const isPro = ref(false);

  function reset(markLoaded: boolean) {
    isActivated.value = false;
    maskedKey.value = "";
    instanceId.value = "";
    activatedAt.value = "";
    lastCheckedAt.value = "";
    isPro.value = false;
    loaded.value = markLoaded;
  }

  /** Read persisted state from IDB + keyring on app startup. */
  async function load() {
    const db = await getDB();
    const record = await db.get("license", "default");

    // On PWA, the raw key lives in the IDB record's rawKey field.
    // On Tauri, load it from the OS keyring.
    const rawKey = isTauri() ? await loadLicenseKey() : (record?.rawKey ?? null);

    if (record && record.isActivated && rawKey) {
      isActivated.value = true;
      isPro.value = true;
      maskedKey.value = record.maskedKey;
      instanceId.value = record.instanceId;
      activatedAt.value = record.activatedAt;
      lastCheckedAt.value = record.lastCheckedAt;
      loaded.value = true;
      // Background re-validation — don't await, don't block render.
      check().catch(() => {});
    } else {
      reset(true);
    }
  }

  /** Activate a new license key. Throws with a user-friendly message on failure. */
  async function activate(key: string) {
    const id = instanceId.value || generateInstanceId();

    // Throws on failure — let the UI catch and display the error.
    await activateLicense(key, id);

    const now = new Date().toISOString();
    const masked = maskKey(key);

    // Persist key to OS keyring (Tauri) or as part of the IDB record (PWA).
    await saveLicenseKey(key);

    const record: LicenseRecord = {
      id: "default",
      isActivated: true,
      maskedKey: masked,
      instanceId: id,
      activatedAt: now,
      lastCheckedAt: now,
      // On PWA, rawKey is the only persistent storage for the key.
      rawKey: isTauri() ? undefined : key,
    };

    const db = await getDB();
    await db.put("license", record);

    isActivated.value = true;
    isPro.value = true;
    maskedKey.value = masked;
    instanceId.value = id;
    activatedAt.value = now;
    lastCheckedAt.value = now;
    logger.info("license", "License activated");
  }

  /** Deactivate the current license (calls LS API + clears storage). */
  async function deactivate() {
    const id = instanceId.value;
    const db = await getDB();
    const record = await db.get("license", "default");
    const rawKey = isTauri() ? await loadLicenseKey() : (record?.rawKey ?? null);

    if (rawKey && id) {
      await deactivateLicense(rawKey, id);
    }

    await clearLicenseKey();
    await db.delete("license", "default");
    reset(true);
    logger.info("license", "License deactivated");
  }

  /** Re-validate the stored key against the server. Graceful on network failure. */
  async function check() {
    const id = instanceId.value;
    const db = await getDB();
    const record = await db.get("license", "default");
    const rawKey = isTauri() ? await loadLicenseKey() : (record?.rawKey ?? null);

    if (!rawKey || !id) return;

    try {
      const valid = await validateLicense(rawKey, id);
      const now = new Date().toISOString();

      if (!valid) {
        // Key was revoked on the server — deactivate locally.
        await clearLicenseKey();
        await db.delete("license", "default");
        reset(true);
        return;
      }

      // Update lastCheckedAt in IDB and in memory.
      if (record) {
        await db.put("license", { ...record, lastCheckedAt: now });
      }
      lastCheckedAt.value = now;
    } catch {
      // Network failure — keep existing isActivated state (grace period).
      logger.warn("license", "License validation failed (grace period applied)");
    }
  }

  return {
    isActivated, maskedKey, instanceId, activatedAt, lastCheckedAt, loaded, isPro,
    load, activate, deactivate, check,
  };
});
