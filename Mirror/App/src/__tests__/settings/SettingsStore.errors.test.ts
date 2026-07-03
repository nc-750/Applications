import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";

// Mock the feature's db barrel so every persistence call rejects — this exercises
// the store's catch-into-error-state paths (CONVENTIONS 7.17/7.18: a leaf store
// surfaces a failure into its own `error` ref, never logs, never rethrows). The
// store imports the same module id, so it sees these mocks.
vi.mock("../../settings/db", () => ({
    readSettings: vi.fn().mockRejectedValue(new Error("read boom")),
    writeSettings: vi.fn().mockRejectedValue(new Error("write boom")),
    clearSettings: vi.fn().mockRejectedValue(new Error("delete boom")),
}));

import { useSettingsStore } from "../../settings/stores";
import { createEmptySettings } from "../../settings/models";

describe("useSettingsStore — persistence failures surface as error state", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("saveSettings surfaces a write failure without throwing", async () => {
        const store = useSettingsStore();
        await expect(store.saveSettings(createEmptySettings())).resolves
            .toBeUndefined();
        expect(store.error).toContain("Failed to save settings");
        expect(store.error).toContain("write boom");
    });

    it("loadSettings surfaces a read failure without throwing", async () => {
        const store = useSettingsStore();
        await expect(store.loadSettings()).resolves.toBeUndefined();
        expect(store.error).toContain("Failed to load settings");
    });

    it("clearSettings surfaces a delete failure without throwing", async () => {
        const store = useSettingsStore();
        await expect(store.clearSettings()).resolves.toBeUndefined();
        expect(store.error).toContain("Failed to clear settings");
        // the in-memory reset still happened before the failing delete
        expect(store.isLLMConfigured).toBe(false);
    });
});
