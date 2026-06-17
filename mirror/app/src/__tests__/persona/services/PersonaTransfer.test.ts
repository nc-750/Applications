import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";

// The transfer service reads/writes files through the generic file helpers; mock
// that module so the test never touches FileReader or the DOM download path.
const downloadFile = vi.fn();
const readFileAsText = vi.fn();
vi.mock("../../../fileManager/services/utils", () => ({
    downloadFile: (...args: unknown[]) => downloadFile(...args),
    readFileAsText: (...args: unknown[]) => readFileAsText(...args),
}));

import {
    parseImportedPersona,
    serializePersona,
    importPersona,
    exportPersona,
} from "../../../persona/services";
import { usePersonaStore } from "../../../persona/stores";
import {
    createEmptyPersona,
    PersonaSkillCategory,
    PersonaSkillLevel,
    PersonaSkillSource,
    type Persona,
} from "../../../persona/models";

/** A small but valid domain persona (every required field present). */
function validPersona(): Persona {
    return {
        ...createEmptyPersona(),
        strengths: [{ title: "Systems thinking", description: "Sees the whole board" }],
        skills: [
            {
                name: "TypeScript",
                category: PersonaSkillCategory.Technical,
                level: PersonaSkillLevel.Expert,
                source: PersonaSkillSource.Professional,
            },
        ],
        derived: {
            howIWorkBest: ["Focus time"],
            cvSummary: "Engineer.",
            linkedinAbout: null,
            interviewPitch: null,
        },
    };
}

describe("parseImportedPersona", () => {
    it("parses a valid persona JSON into the domain model", () => {
        const persona = validPersona();
        const parsed = parseImportedPersona(JSON.stringify(persona));
        expect(parsed).toEqual(persona);
    });

    it("throws on text that is not JSON", () => {
        expect(() => parseImportedPersona("not json {")).toThrow(
            "The file is not valid JSON.",
        );
    });

    it("throws on JSON that is not a persona", () => {
        expect(() => parseImportedPersona(JSON.stringify({ not: "a persona" }))).toThrow(
            "The file is not a valid persona export.",
        );
    });

    it("throws when an enum value is out of range", () => {
        const bad = { ...validPersona(), skills: [{ name: "X", category: 99, level: 0, source: 0 }] };
        expect(() => parseImportedPersona(JSON.stringify(bad))).toThrow(
            "The file is not a valid persona export.",
        );
    });
});

describe("serializePersona", () => {
    it("round-trips through parse", () => {
        const persona = validPersona();
        expect(parseImportedPersona(serializePersona(persona))).toEqual(persona);
    });
});

describe("importPersona", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        downloadFile.mockReset();
        readFileAsText.mockReset();
    });

    it("commits a valid file through the store", async () => {
        const persona = validPersona();
        readFileAsText.mockResolvedValue(JSON.stringify(persona));
        const store = usePersonaStore();

        await importPersona(new File([], "persona.json"), store);

        expect(store.persona).toEqual(persona);
    });

    it("throws (and does not commit) on a malformed file", async () => {
        readFileAsText.mockResolvedValue("{ broken");
        const store = usePersonaStore();

        await expect(
            importPersona(new File([], "persona.json"), store),
        ).rejects.toThrow("The file is not valid JSON.");
        expect(store.persona.skills).toEqual([]); // unchanged (still the empty seed)
    });
});

describe("exportPersona", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        downloadFile.mockReset();
    });

    it("serializes the store's persona and triggers a download", async () => {
        const store = usePersonaStore();
        await store.savePersona(validPersona());

        exportPersona(store);

        expect(downloadFile).toHaveBeenCalledTimes(1);
        const [content, filename, mime] = downloadFile.mock.calls[0];
        expect(JSON.parse(content as string).skills[0].name).toBe("TypeScript");
        expect(filename as string).toMatch(/^mirror-persona-\d{4}-\d{2}-\d{2}\.json$/);
        expect(mime).toBe("application/json");
    });
});
