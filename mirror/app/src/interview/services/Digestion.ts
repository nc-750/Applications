// Digestion check for oversized interview input.
//
// When a user pastes a long CV or attaches files whose combined text exceeds
// the active model's context window, the input must be summarised before the
// interview can start. This module provides the check only; the actual
// digestion summariser is a future feature.

import type { AttachedFile } from "../../fileManager/services/fileExtractor";
import { getContextWindowLimit } from "../reference";

/** Characters beyond which digestion is recommended. */
export const DIGEST_THRESHOLD_CHARS = 25_000;

/** Characters per digestion chunk. */
export const DIGEST_CHUNK_CHARS = 10_000;

/** Rough token count: characters ÷ 4 (a common approximation). */
export function estimateTokens(text: string): number {
    return Math.ceil(text.replace(/\s+/g, " ").length / 4);
}

/**
 * Returns `true` when the combined attached files + user input exceed the
 * model's context window and therefore need digestion before the interview
 * can begin.
 *
 * (Formerly named `isDigestionNeeded` with an inverted return value — it
 * returned `true` when digestion was NOT needed. Renamed per CONVENTIONS 6.5.)
 */
export function needsDigestion(
    attachedFiles: AttachedFile[],
    userInput: string,
    model: string,
): boolean {
    const filesConcatData = attachedFiles
        .map((file) => `${file.name} ${file.text}`)
        .join("\n");
    const data = `${filesConcatData}\n\n${userInput}`;
    const contextWindowLimit = getContextWindowLimit(model);

    return estimateTokens(data) > contextWindowLimit;
}
