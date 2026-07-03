// The shared domain shape for a conversation line. A transcript is produced by
// the interview and stored on the persona, so the type belongs to the
// foundational `core` layer rather than to any single feature. It is a DOMAIN
// message — not the LLM library's `Message` wire type, which stays in `src/llm`.

/** A single line of a conversation transcript.
 *
 *  Total, like the aggregates that hold it: every key is always present.
 *  `context` may be `undefined`; `isError` is a plain boolean (a message either
 *  errored or did not — never "absent"), defaulting to `false`. Build via
 *  `createTranscriptMessage` so the defaults are applied in one place. */
export interface TranscriptMessage {
    role: "user" | "assistant";
    content: string;
    /** Assistant probes carry a brief acknowledgement of the prior answer. */
    context: string | undefined;
    /** ISO-8601 timestamp. */
    timestamp: string;
    isError: boolean;
}

/** Build a total transcript line, defaulting `context` to `undefined`,
 *  `isError` to `false`, and `timestamp` to now. */
export function createTranscriptMessage(init: {
    role: TranscriptMessage["role"];
    content: string;
    context?: string;
    timestamp?: string;
    isError?: boolean;
}): TranscriptMessage {
    return {
        role: init.role,
        content: init.content,
        context: init.context,
        timestamp: init.timestamp ?? new Date().toISOString(),
        isError: init.isError ?? false,
    };
}
