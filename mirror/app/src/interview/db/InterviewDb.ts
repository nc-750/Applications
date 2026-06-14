// The Interview feature's persistence layer — the sole owner of reading and
// writing the interview record (CONVENTIONS 2.2). It owns the persisted DTO
// (1.4) and the persistence key, attaches to the one shared connection
// (`src/db`, rule 2.8), and crosses the domain↔persistence boundary only through
// the transforms in `../mappers` (1.5).
//
// Mirror-document seam (decision #2): the interview is persisted standalone under
// key "default" in the `interview` store — one interview per device. A future
// `src/core/` composer will assemble this record together with the persona into a
// single portable "Mirror document" at the export boundary. That composition is
// NOT built here; this layer owns only the interview half.

import { getDB, STORES } from "../../db";
import type { Interview } from "../models";
import { toInterviewDTO, fromInterviewDTO } from "../mappers";

/** The single per-device record key (CLAUDE.md "one mirror per device"). */
export const INTERVIEW_KEY = "default";

/**
 * The persisted shape of an interview — owned by this DB layer (1.4). It is the
 * domain `Interview` plus the persistence `id`; the key lives here, never on the
 * domain model. The `interview` store's keyPath is "id" (see `db/Database.ts`).
 */
export interface InterviewDTO extends Interview {
    id: string;
}

/** Read the persisted interview, or null when none has been stored yet. */
export async function readInterview(): Promise<Interview | null> {
    const db = await getDB();
    // The shared schema types this store's value as `unknown` (each feature
    // narrows at its own boundary — see `db/Database.ts`); this is that cast.
    const value = (await db.get(STORES.interview, INTERVIEW_KEY)) as
        | InterviewDTO
        | undefined;
    return value ? fromInterviewDTO(value) : null;
}

/** Persist the interview, overwriting any existing record. */
export async function writeInterview(interview: Interview): Promise<void> {
    const db = await getDB();
    // keyPath store → the key travels inside the DTO; no explicit key argument.
    await db.put(STORES.interview, toInterviewDTO(interview));
}

/** Remove the persisted interview record. */
export async function deleteInterview(): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.interview, INTERVIEW_KEY);
}
