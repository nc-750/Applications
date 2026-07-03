import { describe, it, expect } from "vitest";
import { createEmptySettings } from "../../settings/models";

describe("createEmptySettings", () => {
    it("returns a fully-populated, unconfigured model", () => {
        const settings = createEmptySettings();

        expect(settings.provider).toBeUndefined();
        expect(settings.model).toBe("");
        expect(settings.apiKey).toBe("");
        expect(settings.endpoint).toBe("");
    });

    it("is total — exactly the four expected keys are present", () => {
        const settings = createEmptySettings();

        expect(Object.keys(settings).sort()).toEqual(
            ["apiKey", "endpoint", "model", "provider"].sort(),
        );
    });
});
