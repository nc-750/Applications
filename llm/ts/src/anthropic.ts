import Anthropic from "@anthropic-ai/sdk";
import { LLMError, Ok, Err } from "./types";
import type {
  LLMClient,
  MessageOptions,
  StreamOptions,
  Message,
  ContentPart,
  TextPart,
  Result,
  ProviderKind,
} from "./types";
import { normalizeError } from "./errors";

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_BASE_URL = "https://api.anthropic.com/v1";

// ── Content part mapping ───────────────────────────────────────────────────

function toAnthropicContentBlock(
  part: ContentPart,
): Anthropic.Messages.ContentBlockParam {
  if (part.type === "text") {
    return { type: "text", text: part.text };
  }
  if (part.type === "image") {
    // The Anthropic SDK restricts media_type to specific image MIME types
    // at the type level. Our library accepts any string — the cast is safe.
    return {
      type: "image",
      source: {
        type: "base64" as const,
        media_type: part.source.media_type,
        data: part.source.data,
      },
    } as Anthropic.Messages.ContentBlockParam;
  }
  if (part.type === "audio") {
    // Anthropic Messages API does not support audio input blocks natively.
    return {
      type: "text",
      text: `[Audio: ${part.source.media_type}]`,
    };
  }
  throw new Error(`Unknown content part type: ${(part as ContentPart).type}`);
}

function toAnthropicUserContent(
  content: ContentPart[],
): Anthropic.Messages.ContentBlockParam[] {
  return content.map(toAnthropicContentBlock);
}

// ── System prompt extraction ───────────────────────────────────────────────

/**
 * Extracts system messages from the message array and returns:
 * - `system`: concatenated system prompt (string or undefined)
 * - `messages`: remaining user/assistant messages
 *
 * Anthropic requires the system prompt as a top-level parameter — it cannot
 * appear as a regular message.
 */
function extractSystem(
  messages: Message[],
): {
  system: string | undefined;
  messages: Anthropic.Messages.MessageParam[];
} {
  const systemParts: string[] = [];
  const rest: Anthropic.Messages.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      // System content is text parts — concatenate their text. (Anthropic's
      // system parameter is plain text, so non-text parts have no place here.)
      const text = msg.content
        .filter((p): p is TextPart => p.type === "text")
        .map((p) => p.text)
        .join("\n\n");
      systemParts.push(text);
    } else {
      rest.push({
        role: msg.role as "user" | "assistant",
        content: toAnthropicUserContent(msg.content),
      });
    }
  }

  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    messages: rest,
  };
}

// ── Structured output via tool use ─────────────────────────────────────────

/**
 * Forces the Anthropic model to respond with a tool call whose `input_schema`
 * matches the requested schema. Extracts and returns `tool_use.input`.
 */
async function structuredMessage(
  apiKey: string,
  baseUrl: string,
  model: string,
  messages: Message[],
  structured: { name: string; schema: Record<string, unknown> },
  opts: { maxTokens: number; temperature?: number; signal?: AbortSignal },
): Promise<Result<unknown, LLMError>> {
  const client = new Anthropic({ apiKey, baseURL: baseUrl });
  const { system, messages: anthropicMessages } = extractSystem(messages);

  try {
    const response = await client.messages.create(
      {
        model,
        system,
        messages: anthropicMessages,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        stream: false,
        tools: [
          {
            name: structured.name,
            input_schema: structured.schema as Anthropic.Messages.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: structured.name },
      },
      { signal: opts.signal },
    );

    // Extract the tool_use block from the response
    for (const block of response.content) {
      if (block.type === "tool_use") {
        return Ok(block.input);
      }
    }

    // Model didn't use the tool — return the text content as fallback
    const textBlocks = response.content.filter(
      (b): b is Anthropic.Messages.TextBlock => b.type === "text",
    );
    const text = textBlocks.map((b) => b.text).join("");
    return Ok(text);
  } catch (err) {
    return Err(normalizeError(err, "anthropic"));
  }
}

// ── Provider creation ──────────────────────────────────────────────────────

/**
 * Creates an {@link LLMClient} backed by the Anthropic SDK.
 *
 * A fresh SDK client is created per request so that the API key (fetched via
 * {@link KeyProvider}) is never stored beyond the lifetime of a single call.
 *
 * @internal
 */
export function createAnthropicClient(
  model: string,
  keyProvider: () => Promise<string>,
  baseUrl?: string,
): LLMClient {
  const resolvedBaseUrl = baseUrl ?? DEFAULT_BASE_URL;
  const provider: ProviderKind = "anthropic";

  const llmClient: LLMClient = {
    async message(
      messages: Message[],
      options?: MessageOptions,
    ): Promise<Result<unknown, LLMError>> {
      const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
      const temperature = options?.temperature;
      const signal = options?.signal;

      // Structured output path
      if (options?.structured) {
        const { name, schema } = options.structured;
        const apiKey = await keyProvider();
        return structuredMessage(apiKey, resolvedBaseUrl, model, messages, { name, schema }, { maxTokens, temperature, signal });
      }

      // Plain text path
      const { system, messages: anthropicMessages } = extractSystem(messages);

      try {
        const apiKey = await keyProvider();
        const client = new Anthropic({ apiKey, baseURL: resolvedBaseUrl, dangerouslyAllowBrowser: true });

        const response = await client.messages.create(
          {
            model,
            system,
            messages: anthropicMessages,
            max_tokens: maxTokens,
            temperature,
            stream: false as const,
          },
          { signal },
        );

        // Extract text from response content blocks
        const textBlocks = response.content.filter(
          (b): b is Anthropic.Messages.TextBlock => b.type === "text",
        );
        const text = textBlocks.map((b) => b.text).join("");
        return Ok(text);
      } catch (err) {
        return Err(normalizeError(err, provider));
      }
    },

    async stream(
      messages: Message[],
      options?: StreamOptions,
    ): Promise<Result<AsyncIterable<string>, LLMError>> {
      const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
      const temperature = options?.temperature;

      const { system, messages: anthropicMessages } = extractSystem(messages);

      const apiKey = await keyProvider();
      const client = new Anthropic({ apiKey, baseURL: resolvedBaseUrl });

      let stream: ReturnType<typeof client.messages.stream>;
      try {
        stream = client.messages.stream({
          model,
          system,
          messages: anthropicMessages,
          max_tokens: maxTokens,
          temperature,
        });
      } catch (err) {
        return Err(normalizeError(err, provider));
      }

      async function* generate(): AsyncGenerator<string> {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            yield event.delta.text;
          }
        }
      }

      return Ok(generate());
    },
  };

  return llmClient;
}
