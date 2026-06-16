// Selectable LLM providers for the settings form — labels and their enum values.
// Reference data, not a domain model (CONVENTIONS 1.2 / 6.10); the LLMProvider
// enum itself is the shared type in `src/llm/`. Named PROVIDER_OPTIONS to avoid
// confusion with the llm package's internal wire-shape PROVIDERS table.

import { LLMProvider } from "../../llm";

export interface ProviderOption {
    value: LLMProvider;
    /** Display name shown in the provider `<select>`. */
    label: string;
}

export const PROVIDER_OPTIONS: readonly ProviderOption[] = [
    { value: LLMProvider.OpenAI, label: "OpenAI" },
    { value: LLMProvider.Anthropic, label: "Anthropic" },
    {
        value: LLMProvider.CompatibleOpenAI,
        label: "OpenAI-Compatible (Groq, Together, Ollama, LM Studio...)",
    },
] as const;
