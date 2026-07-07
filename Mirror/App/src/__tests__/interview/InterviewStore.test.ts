import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useInterviewStore } from "../../interview/stores";
import {
    createEmptyInterview,
    createTranscriptMessage,
    emptyCoverage,
    type CoverageMap,
    type Interview,
} from "../../interview/models";
import { readInterview } from "../../interview/db";

// A complete, non-trivial interview used to exercise save/load round-trips.
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
        ],
        coverage: { story: 0.4, strengths: 0.2, growth: 0, drivers: 0.6 },
        currentFacet: "drivers",
        probeSignal: "strong",
        initialData: "Candidate brief...",
        inputText: "Raw pasted text...",
        uploadedFileNames: ["resume.pdf"],
        wasDigested: true,
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-01-15T10:00:00.000Z",
    };
}

describe("useInterviewStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("starts from an empty, idle session", () => {
        const store = useInterviewStore();
        expect(store.status).toBe("idle");
        expect(store.messages).toEqual([]);
        expect(store.coverage).toEqual(emptyCoverage());
        expect(store.initialData).toBe("");
        expect(store.error).toBeNull();
    });

    it("saveInterview commits state and persists the record", async () => {
        const store = useInterviewStore();
        await store.saveInterview(populatedInterview());

        expect(store.status).toBe("active");
        expect(store.initialData).toBe("Candidate brief...");
        expect(store.currentFacet).toBe("drivers");

        // Persisted to the db layer, not just held in memory.
        const persisted = await readInterview();
        expect(persisted).not.toBeNull();
        expect(persisted!.status).toBe("active");
        expect(persisted!.uploadedFileNames).toEqual(["resume.pdf"]);
    });

    it("appendMessage adds a transcript line and persists it", async () => {
        const store = useInterviewStore();
        await store.saveInterview(populatedInterview());

        await store.appendMessage(
            createTranscriptMessage({
                role: "user",
                content: "Building things that last.",
                timestamp: "2026-01-15T10:00:30.000Z",
            }),
        );

        expect(store.messages).toHaveLength(2);
        expect(store.messages[1].content).toBe("Building things that last.");
        expect(store.messages[1].isError).toBe(false); // default applied

        const persisted = await readInterview();
        expect(persisted!.messages).toHaveLength(2);
    });

    it("setCoverage replaces the reading verbatim (no merge logic in the store)", async () => {
        const store = useInterviewStore();
        await store.saveInterview(populatedInterview());

        // A lower value must NOT be clamped to the prior — the store is a thin
        // commit; monotonic-merge is a service concern, not a store one.
        const lower: CoverageMap = {
            story: 0.1, strengths: 0.1, growth: 0.1, drivers: 0.1,
        };
        await store.setCoverage(lower);

        expect(store.coverage).toEqual(lower);
        expect((await readInterview())!.coverage).toEqual(lower);
    });

    it("setStatus and setProbe commit their fields", async () => {
        const store = useInterviewStore();
        await store.saveInterview(populatedInterview());

        await store.setStatus("synthesizing");
        await store.setProbe("strengths", "thin");

        expect(store.status).toBe("synthesizing");
        expect(store.currentFacet).toBe("strengths");
        expect(store.probeSignal).toBe("thin");

        const persisted = await readInterview();
        expect(persisted!.status).toBe("synthesizing");
        expect(persisted!.currentFacet).toBe("strengths");
    });

    it("loadInterview rehydrates from persistence", async () => {
        // Seed via one store instance, then load into a fresh Pinia/store.
        const writer = useInterviewStore();
        await writer.saveInterview(populatedInterview());

        setActivePinia(createPinia());
        const reader = useInterviewStore();
        expect(reader.status).toBe("idle"); // fresh instance starts empty

        await reader.loadInterview();
        expect(reader.status).toBe("active");
        expect(reader.messages).toHaveLength(1);
        expect(reader.initialData).toBe("Candidate brief...");
    });

    it("loadInterview leaves the empty seed when nothing is stored", async () => {
        const store = useInterviewStore();
        await store.loadInterview();
        expect(store.status).toBe("idle");
        expect(store.messages).toEqual([]);
    });

    it("clearInterview resets state and removes the persisted record", async () => {
        const store = useInterviewStore();
        await store.saveInterview(populatedInterview());
        expect(await readInterview()).not.toBeNull();

        await store.clearInterview();

        expect(store.status).toBe("idle");
        expect(store.messages).toEqual([]);
        expect(store.coverage).toEqual(emptyCoverage());
        expect(await readInterview()).toBeNull();
    });

    it("setError surfaces and clears transient error state without persisting it", async () => {
        const store = useInterviewStore();
        store.setError("LLM not configured");
        expect(store.error).toBe("LLM not configured");

        // error is UI-only — it never reaches the persisted record.
        await store.saveInterview(populatedInterview());
        const persisted = await readInterview();
        expect(persisted).not.toHaveProperty("error");

        store.setError(null);
        expect(store.error).toBeNull();
    });
});
