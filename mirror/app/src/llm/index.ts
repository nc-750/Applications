import { openaiShape } from "./openai";
import { anthropicShape } from "./anthropic";
import { logger } from "../logger";

type Shape = (config: LLMConfig, baseUrl: string) => LLMProvider;

export type Provider = "openai" | "anthropic" | "mistral" | "openai-compatible";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Config to be saved in Pinia store + IndexedDB
export interface LLMConfig {
  provider: Provider;
  model: string;
  apiKey: string;
  endpoint?: string;
}

export interface ProviderInfo {
  name: string,
  endpoint?: string,
  policyLink?: string,
  text?: string
}

export interface LLMProvider {
  /** Streams chat completion tokens. Yields each delta text chunk. */
  streamChat(messages: Message[], signal?: AbortSignal): AsyncGenerator<string>;
  
  /** Non-streaming single call for short synthesis tasks. */
  complete(messages: Message[], signal?: AbortSignal): Promise<string>;
  
  /**
   * Schema-constrained non-streaming call. Returns the parsed object the model
   * produced under `schema` (OpenAI json_schema mode / Anthropic forced tool
   * use). Throws if the provider/endpoint does not support structured output —
   * callers fall back to `complete` + lenient parsing.
   */
  structuredComplete(
    messages: Message[],
    schema: Record<string, unknown>,
    schemaName: string,
    signal?: AbortSignal
  ): Promise<unknown>;
  
  /** Lists the model IDs the configured account/endpoint exposes. */
  listModels(signal?: AbortSignal): Promise<string[]>;

  healthCheck(): Promise<void | Error>;
}

const providerConfigs: { [key: string]: ProviderInfo } = {
    openai: {
        name: "OpenAI",
        endpoint: "https://api.openai.com/v1",
        policyLink: "https://openai.com/policies/api-data-usage-policies"
    },
    anthropic: {
        name: "Anthropic",
        endpoint: "https://api.anthropic.com/v1",
        policyLink: "https://www.anthropic.com/legal/privacy"
    },
    mistral: {
        name: "Mistral",
        endpoint: "https://api.mistral.ai/v1",
        policyLink: "https://mistral.ai/terms"
    },
    "openai-compatible": {
        name: "OpenAI Compatible",
        endpoint: "",
        policyLink: "",
        text: "Behavior depends on your endpoint. For maximum privacy, run a local model with Ollama or LM Studio."
    }
}
export default providerConfigs;

// Each provider is just a wire shape + a default base URL. "openai-compatible"
// has no default — the user must supply an endpoint.
const providers: Record<Provider, { shape: Shape; baseUrl: string | null }> = {
  openai: { shape: openaiShape, baseUrl: "https://api.openai.com/v1" },
  mistral: { shape: openaiShape, baseUrl: "https://api.mistral.ai/v1" },
  "openai-compatible": { shape: openaiShape, baseUrl: null },
  anthropic: { shape: anthropicShape, baseUrl: "https://api.anthropic.com/v1" },
};

function isConfigValid(config: LLMConfig): LLMProvider | Error {
  const provider = providers[config.provider]
  if (!provider) {
    return Error("Invalid provider");
  }

  const baseUrl = config.endpoint?.replace(/\/$/, "") || provider.baseUrl;
  if (!baseUrl) {
    return Error("Invalid endpoint");
  }

  if (config.apiKey == "") {
    return Error("Invalid API key");
  }

  if (config.model == "") {
    return Error("Invalid model");
  }

  return provider.shape(config, baseUrl);
}

export function createLLMProvider(config: LLMConfig): LLMProvider {
  const entry = providers[config.provider];
  if (!entry) throw new Error(`Unknown provider: ${config.provider}`);
  const baseUrl = config.endpoint?.replace(/\/$/, "") || entry.baseUrl;
  if (!baseUrl) {
    throw new Error(`${config.provider} provider requires an endpoint URL`);
  }
  logger.debug("llm", "Provider created", { data: { provider: config.provider, model: config.model, hasEndpoint: !!config.endpoint } });
  return entry.shape(config, baseUrl);
}

/** Quick probe — sends a minimal message and returns latency in ms, or throws. */
export async function testConnection(config: LLMConfig): Promise<number | Error> {
  if (!isConfigValid(config)) {
    logger.error("llm", "Invalid LLM configuration", { data: config });
    return Error("Invalid LLM configuration");
  }

  const provider = createLLMProvider(config);

  const start = Date.now();
  const response = await provider.complete([{ role: "user", content: "Reply with the single word: ok" }]);
  const latency = Date.now() - start;
  
  logger.debug("llm", response);

  logger.info("llm", "Connection test succeeded", { data: { provider: config.provider, model: config.model, latencyMs: latency } });
  return latency;
}

/** Fetch the model IDs the configured account/endpoint exposes. */
export async function listModels(config: LLMConfig, signal?: AbortSignal): Promise<string[] | Error> {
  if (!isConfigValid(config)) {
    return Error("Invalid LLM config");
  }

  try {
    const models = await createLLMProvider(config).listModels(signal);
    logger.debug("llm", "Models fetched", { data: { provider: config.provider, modelCount: models.length } });
    return models;
  } catch (e) {
    logger.warn("llm", "listModels failed", { error: e instanceof Error ? e : undefined });
    throw e;
  }
}