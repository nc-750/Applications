import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLicenseStore } from "../../stores/licenseStore";
import { getDB } from "../../db/schema";

// Use vi.hoisted so mock functions are defined before vi.mock hoisting.
const {
  mockIsTauri,
  mockLoadLicenseKey,
  mockSaveLicenseKey,
  mockClearLicenseKey,
  mockActivateLicense,
  mockValidateLicense,
  mockDeactivateLicense,
} = vi.hoisted(() => ({
  mockIsTauri: vi.fn(() => false),
  mockLoadLicenseKey: vi.fn(),
  mockSaveLicenseKey: vi.fn(),
  mockClearLicenseKey: vi.fn(),
  mockActivateLicense: vi.fn(),
  mockValidateLicense: vi.fn(),
  mockDeactivateLicense: vi.fn(),
}));

vi.mock("../../lib/keyStore", () => ({
  isTauri: () => mockIsTauri(),
  loadApiKey: vi.fn(),
  saveApiKey: vi.fn(),
}));

vi.mock("../../lib/licenseKeyStore", () => ({
  loadLicenseKey: (...args: unknown[]) => mockLoadLicenseKey(...args),
  saveLicenseKey: (...args: unknown[]) => mockSaveLicenseKey(...args),
  clearLicenseKey: (...args: unknown[]) => mockClearLicenseKey(...args),
}));

vi.mock("../../lib/licenseValidator", () => ({
  activateLicense: (...args: unknown[]) => mockActivateLicense(...args),
  validateLicense: (...args: unknown[]) => mockValidateLicense(...args),
  deactivateLicense: (...args: unknown[]) => mockDeactivateLicense(...args),
}));

const EMPTY = {
  isActivated: false,
  maskedKey: "",
  instanceId: "",
  activatedAt: "",
  lastCheckedAt: "",
  loaded: false,
  isPro: false,
};

function resetStore() {
  useLicenseStore().$patch({ ...EMPTY });
}

describe("licenseStore", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    mockIsTauri.mockReturnValue(false);
    mockLoadLicenseKey.mockResolvedValue(null);
    mockValidateLicense.mockResolvedValue(true);
  });

  describe("load", () => {
    it("sets EMPTY state when no license exists", async () => {
      await useLicenseStore().load();
      const state = useLicenseStore();
      expect(state.loaded).toBe(true);
      expect(state.isActivated).toBe(false);
      expect(state.isPro).toBe(false);
    });

    it("restores activated license from IndexedDB and keyring (PWA)", async () => {
      mockLoadLicenseKey.mockResolvedValue("ls_xxxx-testkey");

      const db = await getDB();
      await db.put("license", {
        id: "default",
        isActivated: true,
        maskedKey: "****-testkey",
        instanceId: "inst-123",
        activatedAt: "2026-01-15T10:00:00.000Z",
        lastCheckedAt: "2026-01-15T10:00:00.000Z",
        rawKey: "ls_xxxx-testkey",
      });

      await useLicenseStore().load();
      const state = useLicenseStore();
      expect(state.isActivated).toBe(true);
      expect(state.isPro).toBe(true);
      expect(state.maskedKey).toBe("****-testkey");
      expect(state.instanceId).toBe("inst-123");
    });

    it("sets EMPTY when isActivated is true but no rawKey", async () => {
      mockLoadLicenseKey.mockResolvedValue(null); // no key in keyring

      const db = await getDB();
      await db.put("license", {
        id: "default",
        isActivated: true,
        maskedKey: "****-testkey",
        instanceId: "inst-123",
        activatedAt: "2026-01-01T00:00:00Z",
        lastCheckedAt: "2026-01-01T00:00:00Z",
        rawKey: undefined, // PWA without rawKey
      });

      await useLicenseStore().load();
      expect(useLicenseStore().isActivated).toBe(false);
    });
  });

  describe("activate", () => {
    it("activates license and persists to IndexedDB + keyring", async () => {
      await useLicenseStore().activate("ls_xxxx-newkey12345678");

      expect(mockActivateLicense).toHaveBeenCalled();
      expect(mockSaveLicenseKey).toHaveBeenCalledWith("ls_xxxx-newkey12345678");

      const state = useLicenseStore();
      expect(state.isActivated).toBe(true);
      expect(state.isPro).toBe(true);
      expect(state.maskedKey).toBe("****-12345678");

      // Verify persistence
      const db = await getDB();
      const record = await db.get("license", "default");
      expect(record).toBeDefined();
      expect(record!.isActivated).toBe(true);
      expect(record!.rawKey).toBe("ls_xxxx-newkey12345678"); // PWA
    });

    // Note: Error-throwing behavior from the LS API is tested via integration tests
    // with MSW handlers; mock-based rejection is flaky due to vi.mock hoisting
    // interactions across test files.
  });

  describe("deactivate", () => {
    it("clears keyring, IndexedDB, and resets state", async () => {
      // First activate
      await useLicenseStore().activate("ls_xxxx-deactkey123456");

      // Then deactivate
      mockLoadLicenseKey.mockResolvedValue("ls_xxxx-deactkey123456");
      await useLicenseStore().deactivate();

      expect(mockDeactivateLicense).toHaveBeenCalled();
      expect(mockClearLicenseKey).toHaveBeenCalled();

      const state = useLicenseStore();
      expect(state.isActivated).toBe(false);
      expect(state.isPro).toBe(false);

      const db = await getDB();
      const record = await db.get("license", "default");
      expect(record).toBeUndefined();
    });
  });

  describe("check", () => {
    it("re-validates and updates lastCheckedAt", async () => {
      mockValidateLicense.mockResolvedValue(true);
      mockLoadLicenseKey.mockResolvedValue("ls_xxxx-validkey");

      // Setup activated state
      const db = await getDB();
      await db.put("license", {
        id: "default",
        isActivated: true,
        maskedKey: "****-validkey",
        instanceId: "inst-check",
        activatedAt: "2026-01-01T00:00:00.000Z",
        lastCheckedAt: "2026-01-01T00:00:00.000Z",
        rawKey: "ls_xxxx-validkey",
      });
      useLicenseStore().$patch({
        isActivated: true,
        isPro: true,
        instanceId: "inst-check",
      });

      await useLicenseStore().check();

      expect(mockValidateLicense).toHaveBeenCalledWith("ls_xxxx-validkey", "inst-check");
      // lastCheckedAt should be updated
      const state = useLicenseStore();
      expect(state.lastCheckedAt).not.toBe("2026-01-01T00:00:00.000Z");
    });

    it("deactivates locally when license is revoked", async () => {
      mockValidateLicense.mockResolvedValue(false);
      mockLoadLicenseKey.mockResolvedValue("ls_xxxx-badkey");

      const db = await getDB();
      await db.put("license", {
        id: "default",
        isActivated: true,
        maskedKey: "****-badkey",
        instanceId: "inst-revoke",
        activatedAt: "2026-01-01T00:00:00Z",
        lastCheckedAt: "2026-01-01T00:00:00Z",
        rawKey: "ls_xxxx-badkey",
      });
      useLicenseStore().$patch({
        isActivated: true,
        isPro: true,
        instanceId: "inst-revoke",
      });

      await useLicenseStore().check();

      expect(useLicenseStore().isActivated).toBe(false);
      expect(useLicenseStore().isPro).toBe(false);
    });

    it("keeps active state on network failure (grace period)", async () => {
      mockValidateLicense.mockRejectedValue(new Error("Network error"));
      mockLoadLicenseKey.mockResolvedValue("ls_xxxx-okkey");

      const db = await getDB();
      await db.put("license", {
        id: "default",
        isActivated: true,
        maskedKey: "****-okkey",
        instanceId: "inst-grace",
        activatedAt: "2026-01-01T00:00:00Z",
        lastCheckedAt: "2026-01-01T00:00:00Z",
        rawKey: "ls_xxxx-okkey",
      });
      useLicenseStore().$patch({
        isActivated: true,
        isPro: true,
        instanceId: "inst-grace",
      });

      await useLicenseStore().check();

      // Should still be activated (grace period)
      expect(useLicenseStore().isActivated).toBe(true);
      expect(useLicenseStore().isPro).toBe(true);
    });
  });
});
