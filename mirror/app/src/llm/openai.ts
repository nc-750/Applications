import type { LLMConfig, LLMProvider, Message } from ".";
import { logger } from "../logger";

// OpenAI-shape provider: the /chat/completions + /models wire format used by
// OpenAI, Mistral, and any "openai-compatible" endpoint (Groq, Together,
// OpenRouter, Ollama, …). The only variation between them is the base URL.
export function openaiShape(config: LLMConfig, baseUrl: string): LLMProvider {
  const url = (path: string) => `${baseUrl}/${path}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };

  async function post(body: unknown, signal?: AbortSignal): Promise<Response> {
    const start = Date.now();
    try {
      const res = await fetch(url("chat/completions"), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
      });
      logger.debug("llm", "API response received", { data: { provider: config.provider, model: config.model, status: res.status, durationMs: Date.now() - start } });
      if (!res.ok) {
        throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
      }
      return res;
    } catch (e) {
      // Log at warn rather than error: many OpenAI-compatible providers reject
      // json_schema mode, which is an expected fallback handled by the caller.
      // The debug log above already captured the status code and duration.
      logger.warn("llm", "API request failed", { data: { provider: config.provider, model: config.model, durationMs: Date.now() - start }, error: e instanceof Error ? e : undefined });
      throw e;
    }
  }

  return {
    async *streamChat(messages: Message[], signal?: AbortSignal) {
      const res = await post(
        { model: config.model, messages, stream: true },
        signal
      );
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // ignore parse errors on malformed chunks
          }
        }
      }
    },

    async complete(messages: Message[], signal?: AbortSignal) {
      const res = await post(
        { model: config.model, messages, stream: false },
        signal
      );
      const json = await res.json();
      return json.choices?.[0]?.message?.content ?? "";
    },

    async structuredComplete(messages, schema, schemaName, signal) {
      const parse = (json: { choices?: { message?: { content?: string } }[] }) => {
        const content = json.choices?.[0]?.message?.content;
        if (typeof content !== "string" || !content.trim()) {
          throw new Error("Structured output returned no content");
        }
        return JSON.parse(content);
      };

      // A full persona is large; cap output high so it isn't truncated into
      // invalid JSON (DeepSeek, for one, defaults to only 4096 output tokens).
      const max_tokens = 8192;

      // Rung 1 — strict json_schema (OpenAI, Azure, …): hard schema guarantee.
      try {
        const res = await post(
          {
            model: config.model,
            messages,
            stream: false,
            max_tokens,
            response_format: {
              type: "json_schema",
              json_schema: { name: schemaName, schema, strict: true },
            },
          },
          signal
        );
        return parse(await res.json());
      } catch (e) {
        // Don't retry a user-cancelled request.
        if (signal?.aborted) throw e;
        // Most OpenAI-compatible providers (DeepSeek, Mistral, Groq, …) reject
        // json_schema but support json_object — fall through to that rung.
      }

      // Rung 2 — json_object: guaranteed-valid JSON, schema enforced by the
      // prompt + validated leniently by the caller. `post` throws if the
      // provider supports neither, letting the caller drop to plain text.
      const res = await post(
        {
          model: config.model,
          messages,
          stream: false,
          max_tokens,
          response_format: { type: "json_object" },
        },
        signal
      );
      return parse(await res.json());
    },

    async listModels(signal?: AbortSignal) {
      const res = await fetch(url("models"), { headers, signal });
      if (!res.ok) {
        throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
      }
      const json = await res.json();
      const ids: string[] = (json.data ?? [])
        .map((m: { id?: string }) => m.id)
        .filter((id: unknown): id is string => typeof id === "string");
      return ids.sort();
    },

    async healthCheck(): Promise<void | Error> {
      await this.complete([{ role: "user", content: "Reply with the single word: ok" }]);
    }
  };

  
}
