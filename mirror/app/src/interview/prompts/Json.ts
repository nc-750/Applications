// Pure JSON-coercion helpers for turning raw LLM text into something a boundary
// schema can parse. The LLM is an untrusted boundary: it may fence its JSON, wrap
// it in prose, or sprinkle explicit `null`s where a field should be absent. These
// helpers normalise that before `safeParse` runs (CONVENTIONS 4.4 — pure, explicit
// args, no side effects). The schemas themselves live next to each flow.

const JSON_FENCE_REGEX = /```(?:json)?\s*([\s\S]*?)```/g;

/** Every fenced code block in `text`, trimmed, in document order. */
function fencedBlocks(text: string): string[] {
    JSON_FENCE_REGEX.lastIndex = 0;
    const out: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = JSON_FENCE_REGEX.exec(text)) !== null) {
        out.push(match[1].trim());
    }
    return out;
}

/**
 * Returns the first parseable JSON value from a fenced code block, or — if no
 * fence parses — from the whole string treated as bare JSON. Returns `null` when
 * nothing parses. No schema validation: the caller validates afterwards.
 */
export function extractFencedJSON(text: string): unknown | null {
    for (const raw of fencedBlocks(text)) {
        try {
            return JSON.parse(raw);
        } catch {
            // not valid JSON, keep scanning
        }
    }
    try {
        return JSON.parse(text.trim());
    } catch {
        return null;
    }
}

/**
 * Recursively drops keys whose value is `null` (and `null` array elements), so a
 * model that emits `"organization": null` for an absent field doesn't trip a
 * schema that models absence as an omitted key. Leaves all other values intact.
 */
export function stripNulls<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.filter((v) => v !== null).map((v) => stripNulls(v)) as unknown as T;
    }
    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (v === null) continue;
            out[k] = stripNulls(v);
        }
        return out as T;
    }
    return value;
}
