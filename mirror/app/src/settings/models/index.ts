export enum LLMProvider { OpenAI, Anthropic, CompatibleOpenAI };

export interface LLMConfig {
    provider: LLMProvider;
    model: string;
    apiKey: string;
    endpoint: string;
}