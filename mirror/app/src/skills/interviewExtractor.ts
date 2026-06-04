import { parsePersonaJSONLenient, locatePersonaData, type PersonaJSON } from "../types/persona";

const JSON_FENCE_REGEX = /```(?:json)?\s*([\s\S]*?)```/g;

/**
 * Scans an assistant message for an embedded persona.json code block.
 * Returns the parsed PersonaJSON if found and valid, otherwise null.
 *
 * This is a defence-in-depth safety net: the chat phase is told to emit a
 * completion sentinel rather than JSON, but a model may ignore that and print
 * the JSON inline anyway. Uses the same Zod schema as the import flow.
 */
export function extractPersonaJSON(text: string): PersonaJSON | null {
  for (const raw of fencedBlocks(text)) {
    try {
      const parsed = JSON.parse(raw);
      // Use the same lenient unwrap+validate path as coercePersonaJSON so
      // inline extraction and the synthesis fallback accept the same shapes.
      const result = parsePersonaJSONLenient({ persona: locatePersonaData(parsed) });
      if (result.ok) return result.data;
    } catch {
      // not valid JSON, continue scanning
    }
  }
  return null;
}

/**
 * Returns the first parseable JSON value from a fenced code block (or the whole
 * string if it is bare JSON), without schema validation. Used by the plain-text
 * synthesis fallback, where the caller validates leniently afterwards.
 */
export function extractFencedJSON(text: string): unknown | null {
  for (const raw of fencedBlocks(text)) {
    try {
      return JSON.parse(raw);
    } catch {
      // continue scanning
    }
  }
  try {
    return JSON.parse(text.trim());
  } catch {
    return null;
  }
}

function fencedBlocks(text: string): string[] {
  JSON_FENCE_REGEX.lastIndex = 0;
  const out: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = JSON_FENCE_REGEX.exec(text)) !== null) {
    out.push(match[1].trim());
  }
  return out;
}
