import OpenAI from "openai";
import { LLMError, Ok, Err } from "./types";
import type {
  LLMClient,
  MessageInput,
  MessageOptions,
  StreamOptions,
  Message,
  ContentPart,
  TextPart,
  ImagePart,
  AudioPart,
  Result,
  ProviderKind,
} from "./types";
import { normalizeError } from "./errors";

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_BASE_URL = "https://api.openai.com/v1";

// ── Content part mapping ───────────────────────────────────────────────────

function toOpenAIContentPart(
  part: ContentPart,
): OpenAI.Chat.ChatCompletionContentPart {
  if (part.type === "text") {
    return { type: "text", text: (part as TextPart).text };
  }
  if (part.type === "image") {
    const img = part as ImagePart;
    return {
      type: "image_url",
      image_url: {
        url: `data:${img.source.media_type};base64,${img.source.data}`,
        detail: "auto",
      },
    } as OpenAI.Chat.ChatCompletionContentPart;
  }
  if (part.type === "audio") {
    // OpenAI Chat Completions does not support audio input blocks directly.
    // Represent as a text description rather than silently dropping.
    return {
      type: "text",
      text: `[Audio: ${(part as AudioPart).source.media_type}]`,
    } as OpenAI.Chat.ChatCompletionContentPart;
  }
  throw new Error(`Unknown content part type: ${(part as ContentPart).type}`);
}

function toOpenAIMessages(
  messages: Message[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map((msg) => {
    if (msg.role === "system") {
      return {
        role: "system",
        content: typeof msg.content === "string" ? msg.content : "",
      };
    }
    if (msg.role === "assistant") {
      return {
        role: "assistant",
        content: typeof msg.content === "string" ? msg.content : "",
      };
    }
    // user — can be string or content parts
    if (typeof msg.content === "string") {
      return { role: "user", content: msg.content };
    }
    return {
      role: "user",
      content: msg.content.map(toOpenAIContentPart),
    };
  });
}

// ── Input normalization ────────────────────────────────────────────────────

function normalizeInput(input: MessageInput): Message[] {
  if (typeof input === "string") {
    return [{ role: "user", content: input }];
  }
  if (Array.isArray(input)) {
    return input;
  }
  return [input];
}

// ── Provider creation ──────────────────────────────────────────────────────

/**
 * Creates an {@link LLMClient} backed by the OpenAI SDK.
 *
 * OpenAI and OpenAI-compatible providers share the same implementation —
 * the only difference is the base URL.
 *
 * @internal
 */
export function createOpenAIClient(
  provider: ProviderKind,
  model: string,
  keyProvider: () => Promise<string>,
  baseUrl?: string,
): LLMClient {
  // The OpenAI SDK accepts apiKey as a function — we pass the keyProvider directly.
  // The key is never stored as a string property in our code or the SDK's.
  const client = new OpenAI({
    apiKey: keyProvider,
    baseURL: baseUrl ?? DEFAULT_BASE_URL,
    dangerouslyAllowBrowser: true
  });

  // Cast to LLMClient — the implementation satisfies the overloaded interface
  // but TypeScript cannot verify overload compatibility with a plain object literal.
  const llmClient: LLMClient = {
    async message(
      input: MessageInput,
      options?: MessageOptions,
    ): Promise<Result<string | unknown, LLMError>> {
      const messages = normalizeInput(input);
      const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
      const temperature = options?.temperature;
      const signal = options?.signal;
      const store = options?.store ?? false;

      try {
        // Structured output path
        if (options?.structured) {
          const { name, schema, strict = true } = options.structured;
          return await structuredMessage(
            client,
            model,
            messages,
            { name, schema, strict },
            { maxTokens, temperature, store, signal },
          );
        }

        // Plain text path
        const response = await client.chat.completions.create(
          {
            model,
            messages: toOpenAIMessages(messages),
            stream: false as const,
            store,
            max_tokens: maxTokens,
            temperature,
          },
          { signal },
        );

        const content = (response as OpenAI.Chat.ChatCompletion).choices[0]?.message?.content ?? "";
        return Ok(content);
      } catch (err) {
        return Err(normalizeError(err, provider));
      }
    },

    async stream(
      input: MessageInput,
      options?: StreamOptions,
    ): Promise<Result<AsyncIterable<string>, LLMError>> {
      const messages = normalizeInput(input);
      const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
      const temperature = options?.temperature;
      const signal = options?.signal;
      const store = options?.store ?? false;

      return streamText(client, model, messages, {
        maxTokens,
        temperature,
        store,
        signal,
        provider,
      });
    },
  };

  return llmClient;
}

// ── Structured message ─────────────────────────────────────────────────────

async function structuredMessage(
  client: OpenAI,
  model: string,
  messages: Message[],
  structured: { name: string; schema: Record<string, unknown>; strict: boolean },
  opts: { maxTokens: number; temperature?: number; store: boolean; signal?: AbortSignal },
): Promise<Result<unknown, LLMError>> {
  // Primary path: json_schema with strict mode
  if (structured.strict) {
    try {
      const response = await client.chat.completions.parse(
        {
          model,
          messages: toOpenAIMessages(messages),
          stream: false as const,
          store: opts.store,
          max_tokens: opts.maxTokens,
          temperature: opts.temperature,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: structured.name,
              schema: structured.schema,
              strict: true,
            },
          },
        },
        { signal: opts.signal },
      );

      const completion = response as OpenAI.Chat.ChatCompletion;
      // The .parse() method populates message.parsed, but the generic-less
      // SDK type doesn't expose it — access via a cast.
      return Ok((completion.choices[0]?.message as unknown as Record<string, unknown> | undefined)?.parsed
        ?? completion.choices[0]?.message?.content);
    } catch {
      // Fall through to json_object fallback
    }
  }

  // Fallback: json_object mode (works with more providers)
  try {
    const response = await client.chat.completions.create(
      {
        model,
        messages: toOpenAIMessages(messages),
        stream: false as const,
        store: opts.store,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        response_format: { type: "json_object" },
      },
      { signal: opts.signal },
    );

    const text = (response as OpenAI.Chat.ChatCompletion).choices[0]?.message?.content ?? "";
    return Ok(JSON.parse(text));
  } catch (err) {
    return Err(normalizeError(err, "openai"));
  }
}

// ── Stream ─────────────────────────────────────────────────────────────────

async function streamText(
  client: OpenAI,
  model: string,
  messages: Message[],
  opts: {
    maxTokens: number;
    temperature?: number;
    store: boolean;
    signal?: AbortSignal;
    provider: ProviderKind;
  },
): Promise<Result<AsyncIterable<string>, LLMError>> {
  // The stream is created eagerly to catch connection/auth errors up front.
  // Once the iterator starts, mid-stream errors must be handled by the
  // caller with try-catch around the for-await loop.
  let stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
  try {
    const sdkStream = await client.chat.completions.create(
      {
        model,
        messages: toOpenAIMessages(messages),
        stream: true as const,
        store: opts.store,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
      },
      { signal: opts.signal },
    );

    // When stream: true, the SDK returns a Stream<ChatCompletionChunk>
    stream = sdkStream as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
  } catch (err) {
    return Err(normalizeError(err, opts.provider));
  }

  async function* generate(): AsyncGenerator<string> {
    for await (const chunk of stream) {
      const delta = (chunk as OpenAI.Chat.ChatCompletionChunk).choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  return Ok(generate());
}
