import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    readSettings,
    writeSettings,
    clearSettings,
    SETTINGS_KEY,
} from "../../settings/db";
import { createEmptySettings, type Settings } from "../../settings/models";
import { getDB, STORES } from "../../db";
import { LLMProvider } from "../../llm";

// The keyring backend is mocked so the Tauri-vs-PWA key split can be exercised
// without a real OS keyring. `isTauri` is toggled per-test (default: PWA/false).
const mockSaveApiKey = vi.fn();
const mockLoadApiKey = vi.fn();
const mockClearApiKey = vi.fn();
const mockIsTauri = vi.fn(() => false);

vi.mock("../../settings/db/keyStore", () => ({
    isTauri: () => mockIsTauri(),
    saveApiKey: (...args: unknown[]) => mockSaveApiKey(...args),
    loadApiKey: (...args: unknown[]) => mockLoadApiKey(...args),
    clearApiKey: (...args: unknown[]) => mockClearApiKey(...args),
}));

/** A fully-populated domain settings record — every field set so the round-trip
 *  exercises the whole shape. */
function populatedSettings(): Settings {
    return {
        ...createEmptySettings(),
        provider: LLMProvider.Anthropic,
        model: "claude-sonnet-4-6",
        apiKey: "sk-secret-key",
        endpoint: "https://api.anthropic.com",
    };
}

describe("settings/db", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsTauri.mockReturnValue(false);
        mockLoadApiKey.mockResolvedValue(null);
    });

    it("returns null when no settings have been persisted", async () => {
        expect(await readSettings()).toBeNull();
    });

    describe("PWA (no keyring)", () => {
        it("round-trips a domain settings record through write → read", async () => {
            const settings = populatedSettings();

            await writeSettings(settings);

            // read returns a domain model equal to the original — proving the key
            // is added on write and stripped on read (no DTO `id` leaks back up).
            expect(await readSettings()).toEqual(settings);
        });

        it("stores the apiKey in IndexedDB and never touches the keyring", async () => {
            await writeSettings(populatedSettings());

            const db = await getDB();
            const record = await db.get(STORES.settings, SETTINGS_KEY);
            expect(record).toBeDefined();
            expect((record as { apiKey: string }).apiKey).toBe("sk-secret-key");

            expect(mockSaveApiKey).not.toHaveBeenCalled();
        });

        it("clearSettings removes the record and never touches the keyring", async () => {
            await writeSettings(populatedSettings());
            expect(await readSettings()).not.toBeNull();

            await clearSettings();

            expect(await readSettings()).toBeNull();
            expect(mockClearApiKey).not.toHaveBeenCalled();
        });
    });

    describe("Tauri (OS keyring)", () => {
        beforeEach(() => {
            mockIsTauri.mockReturnValue(true);
        });

        it("writes the key to the keyring and persists apiKey:'' in the DTO", async () => {
            await writeSettings(populatedSettings());

            expect(mockSaveApiKey).toHaveBeenCalledWith("sk-secret-key");

            const db = await getDB();
            const record = await db.get(STORES.settings, SETTINGS_KEY);
            expect(record).toBeDefined();
            expect((record as { apiKey: string }).apiKey).toBe("");
        });

        it("restores the key from the keyring on read", async () => {
            mockLoadApiKey.mockResolvedValue("sk-from-keyring");
            await writeSettings(populatedSettings());

            const restored = await readSettings();

            expect(restored).not.toBeNull();
            expect(restored!.apiKey).toBe("sk-from-keyring");
            expect(restored!.provider).toBe(LLMProvider.Anthropic);
        });

        it("falls back to an empty apiKey when the keyring has no entry", async () => {
            mockLoadApiKey.mockResolvedValue(null);
            await writeSettings(populatedSettings());

            const restored = await readSettings();

            expect(restored!.apiKey).toBe("");
        });

        it("clearSettings deletes the record and clears the keyring", async () => {
            await writeSettings(populatedSettings());

            await clearSettings();

            expect(await readSettings()).toBeNull();
            expect(mockClearApiKey).toHaveBeenCalled();
        });
    });
});
