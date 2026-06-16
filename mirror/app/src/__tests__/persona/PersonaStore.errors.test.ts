import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";

// Mock the feature's db barrel so every persistence call rejects — this exercises
// the store's catch-into-error-state paths (CONVENTIONS 7.17/7.18: a leaf store
// surfaces a failure into its own error field, without logging or rethrowing). The
// store imports the same module id, so it sees these mocks.
vi.mock("../../persona/db", () => ({
    readPersona: vi.fn().mockRejectedValue(new Error("read boom")),
    writePersona: vi.fn().mockRejectedValue(new Error("write boom")),
    clearPersona: vi.fn().mockRejectedValue(new Error("delete boom")),
}));

import { usePersonaStore } from "../../persona/stores";
import { createEmptyPersona } from "../../persona/models";

describe("usePersonaStore — persistence failures surface as error state", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("savePersona surfaces a write failure without throwing", async () => {
        const store = usePersonaStore();
        await expect(store.savePersona(createEmptyPersona())).resolves.toBeUndefined();
        expect(store.error).toContain("Failed to save the persona");
        expect(store.error).toContain("write boom");
    });

    it("loadPersona surfaces a read failure without throwing", async () => {
        const store = usePersonaStore();
        await expect(store.loadPersona()).resolves.toBeUndefined();
        expect(store.error).toContain("Failed to load the persona");
    });

    it("clearPersona surfaces a delete failure without throwing", async () => {
        const store = usePersonaStore();
        await expect(store.clearPersona()).resolves.toBeUndefined();
        expect(store.error).toContain("Failed to clear the persona");
        // the in-memory reset still happened before the failing delete
        expect(store.persona.skills).toEqual([]);
    });
});
