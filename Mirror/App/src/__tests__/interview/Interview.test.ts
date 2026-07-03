import { describe, it, expect } from "vitest";
import {
    createEmptyInterview,
    emptyCoverage,
    FACET_KEYS,
} from "../../interview/models";

describe("emptyCoverage", () => {
    it("returns every facet at zero", () => {
        const coverage = emptyCoverage();
        expect(Object.keys(coverage).sort()).toEqual([...FACET_KEYS].sort());
        for (const key of FACET_KEYS) {
            expect(coverage[key]).toBe(0);
        }
    });
});

describe("createEmptyInterview", () => {
    it("returns a zeroed, idle session", () => {
        const interview = createEmptyInterview();

        expect(interview.status).toBe("idle");
        expect(interview.messages).toEqual([]);
        expect(interview.initialData).toBe("");
        expect(interview.coverage).toEqual(emptyCoverage());
        expect(interview.currentFacet).toBeUndefined();
        expect(interview.probeSignal).toBeUndefined();
    });

    it("stamps ISO createdAt/updatedAt timestamps", () => {
        const interview = createEmptyInterview();

        expect(typeof interview.createdAt).toBe("string");
        expect(typeof interview.updatedAt).toBe("string");
        expect(Number.isNaN(Date.parse(interview.createdAt))).toBe(false);
        expect(Number.isNaN(Date.parse(interview.updatedAt))).toBe(false);
    });
});
