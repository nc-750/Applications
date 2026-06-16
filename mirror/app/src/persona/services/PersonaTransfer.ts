// The Persona feature's transfer service: import a persona JSON file the user
// supplies, and export the current persona to a download. App logic lives here, not
// in the view (CONVENTIONS 4.1). Structured as a functional core (pure parse/validate
// helpers) plus an imperative shell (the two orchestrators that do the file I/O and
// commit through the store). Services receive the store by injection (2.5) and never
// call `usePersonaStore()` themselves; they persist only through the store (4.5).
//
// An imported file is an untrusted boundary, so its contents are validated with Zod
// before they become a domain `Persona` (1.9). The boundary schema lives here, next
// to the flow it guards, and mirrors the domain model — its parsed output IS a valid
// `Persona`. (The exported format is the plain domain `Persona` as JSON, so a round
// trip — export then re-import — validates cleanly.)

import { z } from "zod";
import {
    PersonaSkillCategory,
    PersonaSkillLevel,
    PersonaSkillSource,
    PersonaGoalType,
    type Persona,
} from "../models";
import type { usePersonaStore } from "../stores";
import { createTranscriptMessage } from "../../core/Transcript";
import { logger } from "../../logger";
// `downloadFile`/`readFileAsText` are generic file helpers. They currently live in
// `fileManager/services/utils` (the project has no `src/lib/` yet); imported here the
// same way `logger/services/export` already consumes them. Relocating them to a shared
// `src/lib/` is a flagged cross-cutting follow-up, out of scope for this rung.
import { downloadFile, readFileAsText } from "../../fileManager/services/utils";

// ── Boundary schema (functional core) ────────────────────────────────────────
// Mirrors the domain `Persona` so a parsed result is directly assignable to it.
// Numeric domain enums validate via `z.nativeEnum`; the interview transcript is
// validated against the domain `TranscriptMessage` shape (role + string content).

const SkillSchema = z.object({
    name: z.string(),
    category: z.nativeEnum(PersonaSkillCategory),
    level: z.nativeEnum(PersonaSkillLevel),
    source: z.nativeEnum(PersonaSkillSource),
});

const CareerSchema = z.object({
    dateStart: z.number(),
    dateEnd: z.number(),
    role: z.string(),
    highlights: z.array(z.string()),
    organization: z.string().optional(),
    realStory: z.string().optional(),
    skillsRevealed: z.array(SkillSchema).optional(),
    note: z.string().optional(),
});

const PersonaSchema = z.object({
    metadata: z.object({
        sourceUsed: z.array(z.string()),
        language: z.string(),
        createdAt: z.number(),
        version: z.string(),
    }),
    metrics: z.object({
        story: z.number(),
        strengths: z.number(),
        hidden: z.number(),
        growth: z.number(),
        drivers: z.number(),
    }),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    skills: z.array(SkillSchema),
    career: z.array(CareerSchema),
    personal: z.array(CareerSchema),
    traits: z.array(
        z.object({
            dimension: z.string(),
            position: z.number(),
            note: z.string().optional(),
        }),
    ),
    values: z.array(z.string()),
    hiddenAssets: z.array(z.string()),
    goals: z.array(
        z.object({
            type: z.nativeEnum(PersonaGoalType),
            description: z.string(),
        }),
    ),
    interview: z.object({
        // Parse leniently — `JSON.stringify` drops `context` when undefined, and
        // older exports may lack timestamp/isError — then normalize through the
        // core factory so each line is a total `TranscriptMessage`.
        messages: z.array(
            z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
                context: z.string().optional(),
                timestamp: z.string().optional(),
                isError: z.boolean().optional(),
            }).transform(createTranscriptMessage),
        ),
    }),
    derived: z.object({
        howIWorkBest: z.array(z.string()),
        cvSummary: z.string().nullable(),
        linkedinAbout: z.string().nullable(),
        interviewPitch: z.string().nullable(),
    }),
});

/**
 * Parse raw file text into a domain `Persona`, validating the untrusted JSON at the
 * boundary. Pure: explicit input, no I/O, no store access (4.4). Throws a single-line
 * `Error` when the text is not JSON or does not match the persona shape — the caller
 * logs and surfaces it.
 */
export function parseImportedPersona(text: string): Persona {
    let raw: unknown;
    try {
        raw = JSON.parse(text);
    } catch {
        throw new Error("The file is not valid JSON.");
    }
    const result = PersonaSchema.safeParse(raw);
    if (!result.success) {
        throw new Error("The file is not a valid persona export.");
    }
    return result.data;
}

/** Serialize a persona to pretty-printed JSON. Pure (4.4). */
export function serializePersona(persona: Persona): string {
    return JSON.stringify(persona, null, 2);
}

// ── Orchestrators (imperative shell) ─────────────────────────────────────────

/**
 * Read a user-supplied file, validate it into a domain `Persona`, and commit it via
 * the store. Logs-once-and-throws on a malformed file (7.16) so the view can catch
 * it into reactive error state. The store is injected (2.5); persistence happens only
 * through the store action (4.5).
 */
export async function importPersona(
    file: File,
    personaStore: ReturnType<typeof usePersonaStore>,
): Promise<void> {
    const text = await readFileAsText(file);
    let persona: Persona;
    try {
        persona = parseImportedPersona(text);
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        logger.error("import", `Persona import failed: ${message}`);
        throw e;
    }
    await personaStore.savePersona(persona);
}

/**
 * Serialize the current persona and trigger a file download. The store is injected
 * (2.5); this reads its live record and never queries the db directly.
 */
export function exportPersona(
    personaStore: ReturnType<typeof usePersonaStore>,
): void {
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    downloadFile(
        serializePersona(personaStore.persona),
        `mirror-persona-${date}.json`,
        "application/json",
    );
}
