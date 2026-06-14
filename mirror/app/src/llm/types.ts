// App-domain LLM configuration. The shared `src/llm/` layer owns these types so the
// factory has no dependency on any feature folder. Consumers (settings, interview)
// import from here, never the other way around.

export enum LLMProvider {
    OpenAI,
    Anthropic,
    CompatibleOpenAI,
}

export interface LLMConfig {
    provider: LLMProvider;
    model: string;
    apiKey: string;
    endpoint: string;
}
