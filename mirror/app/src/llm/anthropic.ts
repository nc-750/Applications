import type { LLMProvider, LLMConfig, Message } from ".";
import { logger } from "../logger";

const ANTHROPIC_VERSION = "2023-06-01";

// Anthropic-shape provider: /messages wire format with a top-level system
// string and SSE deltas distinct from the OpenAI shape.
export function anthropicShape(config: LLMConfig, baseUrl: string): LLMProvider {
  const url = (path: string) => `${baseUrl}/${path}`;
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": config.apiKey,
    "anthropic-version": ANTHROPIC_VERSION,
    "anthropic-dangerous-direct-browser-access": "true",
  };

  // Anthropic requires the system prompt top-level, not as a message.
  function split(messages: Message[]): { system: string; msgs: Message[] } {
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    return { system, msgs: messages.filter((m) => m.role !== "system") };
  }

  async function post(body: unknown, signal?: AbortSignal): Promise<Response> {
    const start = Date.now();
    try {
      const res = await fetch(url("messages"), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
      });
      logger.debug("llm", "API response received", { data: { provider: config.provider, model: config.model, status: res.status, durationMs: Date.now() - start } });
      if (!res.ok) {
        throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
      }
      return res;
    } catch (e) {
      logger.error("llm", "API request failed", { data: { provider: config.provider, model: config.model, durationMs: Date.now() - start }, error: e instanceof Error ? e : undefined });
      throw e;
    }
  }

  return {
    async *streamChat(messages: Message[], signal?: AbortSignal) {
      const { system, msgs } = split(messages);
      const res = await post(
        {
          model: config.model,
          max_tokens: 8192,
          system: system || undefined,
          messages: msgs,
          stream: true,
        },
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
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(trimmed.slice(6));
            if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
              yield json.delta.text;
            }
          } catch {
            // ignore
          }
        }
      }
    },

    async complete(messages: Message[], signal?: AbortSignal) {
      const { system, msgs } = split(messages);
      const res = await post(
        {
          model: config.model,
          max_tokens: 2048,
          system: system || undefined,
          messages: msgs,
        },
        signal
      );
      const json = await res.json();
      return json.content?.[0]?.text ?? "";
    },

    async structuredComplete(messages, schema, schemaName, signal) {
      // Anthropic has no json_schema mode; the equivalent is a single forced
      // tool call whose input_schema is the JSON Schema. The model's arguments
      // come back as the tool_use block's `input`.
      const { system, msgs } = split(messages);
      const res = await post(
        {
          model: config.model,
          max_tokens: 8192,
          system: system || undefined,
          messages: msgs,
          tools: [
            {
              name: schemaName,
              description: "Emit the structured persona data.",
              input_schema: schema,
            },
          ],
          tool_choice: { type: "tool", name: schemaName },
        },
        signal
      );
      const json = await res.json();
      const block = (json.content ?? []).find(
        (b: { type?: string }) => b.type === "tool_use"
      );
      if (!block) throw new Error("Structured output returned no tool_use block");
      return block.input;
    },

    async listModels(signal?: AbortSignal) {
      const res = await fetch(url("models"), { headers, signal });
      if (!res.ok) {
        throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
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
