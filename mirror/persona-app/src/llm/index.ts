import type { LLMProvider, LLMConfig, Provider } from "./types";
import { openaiShape } from "./openai";
import { anthropicShape } from "./anthropic";
import { logger } from "../logger";

export type { LLMProvider, LLMConfig, Message, Provider } from "./types";

type Shape = (config: LLMConfig, baseUrl: string) => LLMProvider;

// Each provider is just a wire shape + a default base URL. "openai-compatible"
// has no default — the user must supply an endpoint.
const PROVIDERS: Record<Provider, { shape: Shape; baseUrl: string | null }> = {
  openai: { shape: openaiShape, baseUrl: "https://api.openai.com/v1" },
  mistral: { shape: openaiShape, baseUrl: "https://api.mistral.ai/v1" },
  "openai-compatible": { shape: openaiShape, baseUrl: null },
  anthropic: { shape: anthropicShape, baseUrl: "https://api.anthropic.com/v1" },
};

export function createLLMProvider(config: LLMConfig): LLMProvider {
  const entry = PROVIDERS[config.provider];
  if (!entry) throw new Error(`Unknown provider: ${config.provider}`);
  const baseUrl = config.endpoint?.replace(/\/$/, "") || entry.baseUrl;
  if (!baseUrl) {
    throw new Error(`${config.provider} provider requires an endpoint URL`);
  }
  logger.debug("llm", "Provider created", { data: { provider: config.provider, model: config.model, hasEndpoint: !!config.endpoint } });
  return entry.shape(config, baseUrl);
}

/** Fetch the model IDs the configured account/endpoint exposes. */
export async function listModels(config: LLMConfig, signal?: AbortSignal): Promise<string[]> {
  try {
    const models = await createLLMProvider(config).listModels(signal);
    logger.debug("llm", "Models fetched", { data: { provider: config.provider, modelCount: models.length } });
    return models;
  } catch (e) {
    logger.warn("llm", "listModels failed", { error: e instanceof Error ? e : undefined });
    throw e;
  }
}

/** Quick probe — sends a minimal message and returns latency in ms, or throws. */
export async function testConnection(config: LLMConfig): Promise<number> {
  const provider = createLLMProvider(config);
  const start = Date.now();
  await provider.complete([{ role: "user", content: "Reply with the single word: ok" }]);
  const latency = Date.now() - start;
  logger.info("llm", "Connection test succeeded", { data: { provider: config.provider, model: config.model, latencyMs: latency } });
  return latency;
}
