import { createClientFromConfig, LLMClientError } from "../../llm";
import type { LLMConfig } from "../../llm";
import { logger } from "../../logger";

/**
 * Verifies that a config can reach its provider by sending a single throwaway
 * prompt, and returns the round-trip latency in milliseconds. A bad config
 * propagates the throw from {@link createClientFromConfig}; a failed call logs
 * once and throws {@link LLMClientError} (CONVENTIONS 7.16, never a sentinel).
 * The caller (the Settings view) catches and surfaces the message.
 *
 * This is the one Settings app-flow: it *uses* the shared `src/llm/`
 * construction but is not itself shared construction, so it lives in the
 * Settings service layer, not in the factory (CONVENTIONS 2.4, 4.7).
 */
export async function testConnection(config: LLMConfig): Promise<number> {
    const client = createClientFromConfig(config);

    const start = Date.now();
    const result = await client.message([
        { role: "user", content: [{ type: "text", text: "Reply with the single word: ok" }] },
    ]);

    if (!result.ok) {
        logger.error("llm", `Connection test failed: ${result.error.message}`);
        throw new LLMClientError(result.error.message);
    }

    return Date.now() - start;
}
