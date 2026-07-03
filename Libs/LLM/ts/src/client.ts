import { LLMError, Ok, Err } from "./types";
import type { LLMClient, LLMClientConfig, Result } from "./types";
import { createOpenAIClient } from "./openai";
import { createAnthropicClient } from "./anthropic";

/**
 * Creates an LLM client backed by OpenAI, Anthropic, or an OpenAI-compatible endpoint.
 *
 * The client is a lightweight factory — it holds the model, provider, and a way to fetch
 * the API key on demand. No network calls happen until {@link LLMClient.message} or
 * {@link LLMClient.stream} is called.
 *
 * @example
 * ```ts
 * const result = createLLMClient({
 *   provider: "openai",
 *   model: "gpt-4o",
 *   keyProvider: () => loadApiKey(),
 * });
 * if (!result.ok) {
 *   console.error("Invalid config:", result.error.message);
 *   return;
 * }
 * const llm = result.value;
 * ```
 */
export function createLLMClient(
  config: LLMClientConfig,
): Result<LLMClient, LLMError> {
  switch (config.provider) {
    case "openai":
      return Ok(
        createOpenAIClient(
          "openai",
          config.model,
          config.keyProvider,
          config.baseUrl,
        ),
      );

    case "openai-compatible":
      if (!config.baseUrl) {
        return Err(
          new LLMError(
            'The "openai-compatible" provider requires a baseUrl.',
            "openai-compatible",
          ),
        );
      }
      return Ok(
        createOpenAIClient(
          "openai-compatible",
          config.model,
          config.keyProvider,
          config.baseUrl,
        ),
      );

    case "anthropic":
      return Ok(
        createAnthropicClient(
          config.model,
          config.keyProvider,
          config.baseUrl,
        ),
      );

    default: {
      const unknown = config as { provider: string };
      return Err(
        new LLMError(`Unknown provider: ${unknown.provider}`, "openai"),
      );
    }
  }
}
