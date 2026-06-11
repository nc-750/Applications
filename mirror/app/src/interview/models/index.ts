// Rates are official provider API prices as of June 9, 2026
const LLM_CONTEXT_WINDOW_LIMIT: { [model: string]: number } = {
    "opus-4.8": 1_000_000,
    "opus-4.7": 1_000_000,
    "opus-4.6": 1_000_000,
    "sonnet-4.6": 1_000_000,
    "gpt-5.5": 1_000_000,
    "gpt-5.4": 1_000_000,
    "gemini-3.1": 1_000_000,
    "deepseek-v4-pro": 1_000_000,
    "deepseek-v4-flash": 1_000_000,
    "minimax-m3": 1_000_000,
    "qwen-3.5-plus": 1_000_000,
    "gpt-5.4-mini": 400_000,
    "gpt-5.2-codex": 400_000,
    "kimi-k2.6": 250_000,
    "kimi-k2.5": 250_000,
    "haiku-4.5": 200_000,
    "sonnet-4.5": 200_000,
    "opus-4.5": 200_000,
    "other": 200_000,
}

export function getContextWindowLimit(model: string): number {
    if (model in LLM_CONTEXT_WINDOW_LIMIT) {
        return LLM_CONTEXT_WINDOW_LIMIT[model];
    } else {
        return LLM_CONTEXT_WINDOW_LIMIT["other"];
    }
}