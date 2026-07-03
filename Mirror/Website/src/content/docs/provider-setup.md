---
title: "Provider Setup"
description: "How to get an API key for each supported AI provider"
order: 2
---

How to get an API key for each supported AI provider.

---

## OpenAI

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Sign up or log in.
3. Click **Create new secret key**.
4. Copy the key (it starts with `sk-`).
5. In Mirror Settings, select **OpenAI**, paste the key.

**Estimated cost per interview:** roughly $0.10–0.50 with GPT-4o, depending on interview length and input size. Smaller models like GPT-4o-mini cost less.

**Data policy:** OpenAI does not use API requests for training by default. Retention is up to 30 days for abuse monitoring. [Full policy](https://openai.com/policies/api-data-usage-policies).

---

## Anthropic

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).
2. Sign up or log in.
3. Click **Create Key**.
4. Copy the key (it starts with `sk-ant-`).
5. In Mirror Settings, select **Anthropic**, paste the key.

**Estimated cost per interview:** roughly $0.15–0.60 with Claude Sonnet 4, depending on interview length.

**Data policy:** Anthropic does not use API requests for training by default. [Full policy](https://www.anthropic.com/legal/privacy).

---

## Mistral

1. Go to [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys).
2. Sign up or log in.
3. Click **Create new key**.
4. Copy the key.
5. In Mirror Settings, select **Mistral**, paste the key.

**Estimated cost per interview:** roughly $0.05–0.20 with Mistral Large or Small, depending on tier.

**Data policy:** Mistral may retain prompts. Review their [terms](https://mistral.ai/terms) before sending sensitive content.

---

## OpenAI-compatible endpoints

The "OpenAI-compatible" option works with any provider that speaks the OpenAI `/chat/completions` API format. You need both an API key and an endpoint URL.

### Groq

1. Go to [console.groq.com/keys](https://console.groq.com/keys).
2. Create a key and copy it.
3. In Mirror Settings, select **OpenAI-compatible**.
4. Set endpoint to: `https://api.groq.com/openai/v1`
5. Paste your key.

Groq offers a free tier with generous rate limits. Very fast inference.

### Together AI

1. Go to [api.together.ai](https://api.together.ai).
2. Copy your API key.
3. Endpoint: `https://api.together.xyz/v1`

### OpenRouter

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys).
2. Copy your API key.
3. Endpoint: `https://openrouter.ai/api/v1`

OpenRouter gives you access to many models through a single API key.

---

## Local models (no API key, full privacy)

Run a model on your own machine. Nothing leaves your device — not even to an AI provider.

### Ollama

1. Install [Ollama](https://ollama.com) (macOS, Linux, Windows).
2. Pull a model: `ollama pull llama3.2` (or `mistral`, `gemma3`, etc.)
3. Start Ollama — it runs on `http://localhost:11434` by default.
4. In Mirror Settings:
   - Select **OpenAI-compatible**
   - Endpoint: `http://localhost:11434/v1`
   - API key: anything (Ollama ignores it, but the field can't be empty — type `ollama`)

> **Note:** Local models produce less consistent structured output. Mirror has a fallback path that handles this, but synthesis may take an extra attempt. Use a model with strong instruction-following (Llama 3.2 7B+, Mistral 7B+, or Gemma 3 12B+).

### LM Studio

1. Install [LM Studio](https://lmstudio.ai) (macOS, Windows, Linux).
2. Download a model through the in-app catalog.
3. Start the local server (default port 1234).
4. In Mirror Settings:
   - Select **OpenAI-compatible**
   - Endpoint: `http://localhost:1234/v1`
   - API key: `lm-studio` (or any non-empty value)

---

## Fetching available models

Once you've set a provider and API key, click **Fetch models** in Settings to load the list of models available to your account. You can select from the list or type any model name directly — Mirror doesn't restrict you to the list.

---

## Connection troubleshooting

- **"API error 401"** — your API key is wrong or expired. Double-check it in your provider dashboard.
- **"API error 403"** — your account may not have access to the model you selected, or your account has a restriction.
- **"API error 429"** — rate limited. Wait a moment and try again.
- **"Failed to fetch"** — check your internet connection. If using a local model, make sure Ollama or LM Studio is running.
- **Test connection works but models won't load** — some providers (notably Ollama) don't implement `/models` fully. Type the model name manually instead of fetching.
