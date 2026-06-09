export type Provider = "openai" | "anthropic" | "mistral" | "openai-compatible";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
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
}

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