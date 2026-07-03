// The single boundary between the app's domain transcript and the LLM library's
// wire `Message` shape. Features build `TranscriptMessage[]` (core) and hand it
// here whenever a conversation must be sent to a client; no feature constructs a
// wire `Message` itself.

import type { Message } from "@nc-750/llm-ts";
import type { TranscriptMessage } from "../core/Transcript";

/** Convert domain transcript lines to wire `Message[]` for LLM calls. */
export function toWireMessages(messages: TranscriptMessage[]): Message[] {
    return messages.map((m) => ({
        role: m.role,
        content: [{ type: "text", text: m.content }],
    }));
}
