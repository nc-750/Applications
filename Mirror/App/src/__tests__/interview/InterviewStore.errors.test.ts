import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";

// Mock the feature's db barrel so every persistence call rejects — this exercises
// the store's catch-into-error-state paths (CONVENTIONS rules 11/13). The store
// imports the same module id, so it sees these mocks.
vi.mock("../../interview/db", () => ({
    readInterview: vi.fn().mockRejectedValue(new Error("read boom")),
    writeInterview: vi.fn().mockRejectedValue(new Error("write boom")),
    deleteInterview: vi.fn().mockRejectedValue(new Error("delete boom")),
}));

import { useInterviewStore } from "../../interview/stores";
import { createEmptyInterview } from "../../interview/models";

describe("useInterviewStore — persistence failures surface as error state", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("saveInterview surfaces a write failure without throwing", async () => {
        const store = useInterviewStore();
        await expect(store.saveInterview(createEmptyInterview())).resolves
            .toBeUndefined();
        expect(store.error).toContain("Failed to save the interview");
        expect(store.error).toContain("write boom");
    });

    it("loadInterview surfaces a read failure without throwing", async () => {
        const store = useInterviewStore();
        await expect(store.loadInterview()).resolves.toBeUndefined();
        expect(store.error).toContain("Failed to load the interview");
    });

    it("clearInterview surfaces a delete failure without throwing", async () => {
        const store = useInterviewStore();
        await expect(store.clearInterview()).resolves.toBeUndefined();
        expect(store.error).toContain("Failed to clear the interview");
        // the in-memory reset still happened before the failing delete
        expect(store.messages).toEqual([]);
    });
});
