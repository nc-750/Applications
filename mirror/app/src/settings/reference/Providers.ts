// Selectable LLM providers for the settings form — labels and their enum values.
// Reference data, not a domain model (CONVENTIONS 1.2 / 6.10); the LLMProvider
// enum itself is the shared type in `src/llm/`. Named PROVIDER_OPTIONS to avoid
// confusion with the llm package's internal wire-shape PROVIDERS table.

import { LLMProvider } from "../../llm";

export interface ProviderOption {
    value: LLMProvider;
    /** Display name shown in the provider `<select>`. */
    label: string;
    endpoint: string;
}

export const PROVIDER_OPTIONS: readonly ProviderOption[] = [
    { 
        value: LLMProvider.OpenAI, 
        label: "OpenAI",
        endpoint: "https://api.openai.com",
    },
    { 
        value: LLMProvider.Anthropic,
        label: "Anthropic",
        endpoint: "https://api.anthropic.com"
    },
    {
        value: LLMProvider.CustomRemoteOpenAI,
        label: "Remote OpenAI-Compatible (DeepSeek, Mistral, ...)",
        endpoint: "https://api.provider.com"
    },
    {
        value: LLMProvider.CustomLocalOpenAI,
        label: "Local OpenAI-Compatible (LM Studio, Ollama, ...)",
        endpoint: "https://localhost:port/v1"
    },
] as const;
