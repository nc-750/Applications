import { describe, it, expect } from "vitest";
import {
    readInterview,
    writeInterview,
    deleteInterview,
} from "../../interview/db";
import {
    createEmptyInterview,
    createTranscriptMessage,
    type Interview,
} from "../../interview/models";

/** A fully-populated domain interview — every optional field set so the
 *  round-trip exercises the whole shape. Built from the factory, not the stale
 *  `factories/interview.ts` fixture. */
function populatedInterview(): Interview {
    return {
        ...createEmptyInterview(),
        status: "active",
        messages: [
            createTranscriptMessage({
                role: "assistant",
                content: "What drives you?",
                context: "Good opener.",
                timestamp: "2026-01-15T10:00:00.000Z",
            }),
            createTranscriptMessage({
                role: "user",
                content: "Building things that last.",
                timestamp: "2026-01-15T10:00:30.000Z",
            }),
        ],
        coverage: {
            story: 0.5,
            strengths: 0.3,
            hidden: 0.1,
            growth: 0,
            drivers: 0.8,
        },
        currentFacet: "drivers",
        probeSignal: "strong",
        initialData: "Brief summary of the candidate...",
        inputText: "Raw text from data input...",
        uploadedFileNames: ["resume.pdf"],
        wasDigested: true,
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-01-15T10:00:30.000Z",
    };
}

describe("interview/db", () => {
    it("round-trips a domain interview through write → read", async () => {
        const interview = populatedInterview();

        await writeInterview(interview);

        // read returns a domain model equal to the original — proving the key is
        // added on write and stripped on read (no DTO `id` leaks back up).
        expect(await readInterview()).toEqual(interview);
    });

    it("returns null when no interview has been persisted", async () => {
        expect(await readInterview()).toBeNull();
    });

    it("deleteInterview removes the record", async () => {
        await writeInterview(populatedInterview());
        expect(await readInterview()).not.toBeNull();

        await deleteInterview();

        expect(await readInterview()).toBeNull();
    });
});
