import { createLLMClient } from "@nc-750/llm-ts";
import type { LLMClient, ProviderKind } from "@nc-750/llm-ts";
import { logger } from "../logger";
import { LLMProvider } from "./types";
import type { LLMConfig } from "./types";

/**
 * Thrown when an {@link LLMConfig} cannot be turned into a client (e.g. a
 * `CompatibleOpenAI` provider with no endpoint). The library `Result` is
 * unwrapped here and never travels up through app layers (CONVENTIONS 4.10).
 */
export class LLMClientError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LLMClientError";
    }
}

/**
 * The single mapping between the app's {@link LLMProvider} enum and the
 * `@nc-750/llm-ts` `ProviderKind` discriminator (CONVENTIONS 4.8). No consumer
 * re-implements this switch.
 */
const PROVIDER_KIND: Record<LLMProvider, ProviderKind> = {
    [LLMProvider.OpenAI]: "openai",
    [LLMProvider.Anthropic]: "anthropic",
    [LLMProvider.CompatibleOpenAI]: "openai-compatible",
};

/**
 * Builds an {@link LLMClient} from app settings. This is the only place in the
 * app that constructs an LLM client (CONVENTIONS 4.7).
 *
 * Throws {@link LLMClientError} on an invalid config — callers get a narrow,
 * throw-based failure rather than a sentinel.
 */
export function createClientFromConfig(config: LLMConfig): LLMClient {
    const result = createLLMClient({
        provider: PROVIDER_KIND[config.provider],
        model: config.model,
        keyProvider: async () => config.apiKey,
        baseUrl: config.endpoint || undefined,
    });

    if (!result.ok) {
        logger.error("llm", `Unable to create LLM client: ${result.error.message}`);
        throw new LLMClientError(result.error.message);
    }

    return result.value;
}

/**
 * Verifies that a config can reach its provider by sending a single throwaway
 * prompt, and returns the round-trip latency in milliseconds. A bad config
 * propagates the throw from {@link createClientFromConfig}; a failed call throws
 * {@link LLMClientError}. The caller (a view) catches and surfaces the message.
 */
export async function testConnection(config: LLMConfig): Promise<number> {
    const client = createClientFromConfig(config);

    const start = Date.now();
    const result = await client.message("Reply with the single word: ok");

    if (!result.ok) {
        logger.error("llm", `Connection test failed: ${result.error.message}`);
        throw new LLMClientError(result.error.message);
    }

    return Date.now() - start;
}
