/**
 * A discriminated union representing either a successful value or an error.
 *
 * Instead of throwing exceptions, every fallible operation in this library
 * returns a {@link Result}. The caller must check `result.ok` before accessing
 * `result.value`, making error handling explicit and unavoidable.
 *
 * @example
 * ```ts
 * const result = await llm.message("Hello");
 * if (result.ok) {
 *   // TypeScript narrows: result is Ok<string>
 *   console.log(result.value.toUpperCase());
 * } else {
 *   // TypeScript narrows: result is Err<LLMError>
 *   console.error(result.error.message);
 * }
 * ```
 */
export type Result<T, E = LLMError> = Ok<T> | Err<E>;

/** Successful outcome of a fallible operation. */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/** Failed outcome of a fallible operation. */
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

/**
 * Constructs a successful {@link Result}.
 *
 * @example
 * ```ts
 * return Ok("response text");
 * return Ok({ name: "John" });
 * ```
 */
export function Ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Constructs a failed {@link Result}.
 *
 * @example
 * ```ts
 * return Err(normalizeError(sdkError, "openai"));
 * ```
 */
export function Err<E>(error: E): Err<E> {
  return { ok: false, error };
}

// ── Provider identity ──────────────────────────────────────────────────────

/** Identifies which LLM backend to use. */
export type ProviderKind = "openai" | "anthropic" | "openai-compatible";

// ── Key provider ───────────────────────────────────────────────────────────

/**
 * A function that returns an API key on demand.
 *
 * The library calls this before each request then immediately discards the
 * result. The key is never stored as a property, logged, or serialized.
 *
 * @example
 * ```ts
 * const keyProvider = async () => await loadApiKey();
 * ```
 */
export type KeyProvider = () => Promise<string>;

// ── Multi-modal content parts ──────────────────────────────────────────────

/** A block of content in a message — text, image, or audio. */
export type ContentPart = TextPart | ImagePart | AudioPart;

/** A text block. */
export interface TextPart {
  type: "text";
  text: string;
}

/**
 * An image block.
 *
 * `data` must be a base64-encoded string (no data-URI prefix).
 * `media_type` is the MIME type, e.g. `"image/png"`.
 */
export interface ImagePart {
  type: "image";
  source: {
    media_type: string;
    data: string;
  };
}

/**
 * An audio block.
 *
 * `data` must be a base64-encoded string.
 * `media_type` is the MIME type, e.g. `"audio/mp3"`.
 */
export interface AudioPart {
  type: "audio";
  source: {
    media_type: string;
    data: string;
  };
}

// ── Message ────────────────────────────────────────────────────────────────

/**
 * A single message in a conversation.
 *
 * `content` accepts either a plain string (shorthand for a single text block)
 * or an array of content parts for multi-modal input.
 */
export interface Message {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

/**
 * Convenience input for {@link LLMClient.message} and {@link LLMClient.stream}.
 *
 * - `string` — shorthand for a single user message: `"Hello"`
 * - `Message` — a single message with explicit role
 * - `Message[]` — a full conversation including system prompt and history
 */
export type MessageInput = string | Message | Message[];

// ── Options ────────────────────────────────────────────────────────────────

/** Options shared by both {@link LLMClient.message} and {@link LLMClient.stream}. */
export interface StreamOptions {
  /**
   * Zero Data Retention flag. Default: `false` (data is NOT stored).
   *
   * Setting this to `true` means the provider is permitted to use the data
   * for model improvement. Keep `false` for sensitive or personal content.
   */
  store?: boolean;
  /**
   * Maximum output tokens. Default: 8192.
   *
   * Anthropic requires this field — a default is always provided if omitted.
   */
  maxTokens?: number;
  /** Sampling temperature, 0–2. Higher values produce more random output. */
  temperature?: number;
  /** Abort signal to cancel the request. */
  signal?: AbortSignal;
}

/**
 * Options for {@link LLMClient.message}, extending {@link StreamOptions} with
 * structured output support.
 */
export interface MessageOptions extends StreamOptions {
  /**
   * When set, the LLM is instructed to return JSON matching this schema.
   *
   * Under the hood the library uses OpenAI's `response_format` or Anthropic's
   * forced tool use, depending on the provider.
   */
  structured?: {
    /** Semantic name used as the tool name (Anthropic) or schema name (OpenAI). */
    name: string;
    /** A JSON Schema object describing the expected output shape. */
    schema: Record<string, unknown>;
    /**
     * Enforce strict adherence to the schema. Default: `true`.
     *
     * When `false`, the library falls back to best-effort JSON extraction
     * (useful for providers that reject strict schema validation).
     */
    strict?: boolean;
  };
}

/** Definition for structured output, used in overloaded signatures. */
export type StructuredDef = NonNullable<MessageOptions["structured"]>;

// ── Config ─────────────────────────────────────────────────────────────────

/**
 * Configuration for creating an {@link LLMClient}.
 *
 * @example
 * ```ts
 * createLLMClient({
 *   provider: "openai",
 *   model: "gpt-4o",
 *   keyProvider: async () => await loadFromOSKeyring(),
 * });
 * ```
 */
export interface LLMClientConfig {
  provider: ProviderKind;
  model: string;
  keyProvider: KeyProvider;
  /**
   * Override the default API base URL.
   *
   * Required for `"openai-compatible"` providers (Ollama, Groq, etc.).
   * Optional for `"openai"` and `"anthropic"`.
   */
  baseUrl?: string;
}

// ── Client ─────────────────────────────────────────────────────────────────

/**
 * A unified interface for sending messages to an LLM and receiving responses.
 *
 * Two modes are available:
 * - **{@link message}** — done-and-forget. Returns the complete response.
 * - **{@link stream}** — long-running. Yields text deltas as they arrive.
 *
 * The client is stateless — conversation history is managed by the caller.
 *
 * @example
 * ```ts
 * const result = createLLMClient({ provider: "openai", model: "gpt-4o", keyProvider });
 * if (!result.ok) return;
 * const llm = result.value;
 * ```
 */
export interface LLMClient {
  /**
   * Sends messages to an LLM and returns a single complete response.
   *
   * Use this when you need the full answer before proceeding — for example,
   * extracting structured data from a transcript, or generating a report.
   *
   * For real-time display, use {@link stream} instead. Streaming cannot provide
   * structured output since valid JSON requires the full response.
   *
   * The returned value is `string` for plain text, or parsed JSON (`unknown`)
   * when `options.structured` is set. Check `result.ok` before accessing.
   *
   * @example
   * ```ts
   * // Simple text
   * const result = await llm.message("What is the capital of France?");
   * if (!result.ok) return handleError(result.error);
   * console.log(result.value); // "Paris"
   * ```
   *
   * @example
   * ```ts
   * // With structured output
   * const result = await llm.message("Extract name from: John is 34", {
   *   structured: {
   *     name: "person",
   *     schema: { type: "object", properties: { name: { type: "string" } } }
   *   }
   * });
   * if (result.ok) console.log(result.value.name); // "John"
   * ```
   */
  message(
    input: MessageInput,
    options?: MessageOptions,
  ): Promise<Result<string | unknown, LLMError>>;

  /**
   * Streams an LLM response as it is generated, yielding text deltas.
   *
   * Use this for real-time UI — displaying the answer word-by-word as the model
   * produces it. This avoids making the user wait for the full response.
   *
   * The returned {@link Result} covers connection and authentication failures.
   * Mid-stream network errors during iteration may still throw and should be
   * guarded with try-catch around the for-await loop for long-running streams.
   *
   * @example
   * ```ts
   * const stream = await llm.stream("Tell me a short story");
   * if (!stream.ok) return handleError(stream.error);
   *
   * for await (const chunk of stream.value) {
   *   process.stdout.write(chunk);
   * }
   * ```
   *
   * @example
   * ```ts
   * // Cancellable stream
   * const controller = new AbortController();
   * const stream = await llm.stream("Long analysis...", { signal: controller.signal });
   *
   * setTimeout(() => controller.abort(), 5000);
   *
   * if (!stream.ok) {
   *   if (stream.error.isAborted) console.log("Cancelled by user");
   *   return;
   * }
   * for await (const chunk of stream.value) { ... }
   * ```
   */
  stream(
    input: MessageInput,
    options?: StreamOptions,
  ): Promise<Result<AsyncIterable<string>, LLMError>>;
}

// ── Error ───────────────────────────────────────────────────────────────────

/**
 * A normalized error from an LLM provider.
 *
 * Never thrown by the library — always returned inside {@link Err}.
 * Not a subclass of `Error` to avoid stack-trace-as-control-flow.
 */
export class LLMError {
  /** The provider that returned the error. */
  readonly provider: ProviderKind;
  /** HTTP status code, if the error came from an HTTP response. */
  readonly statusCode?: number;
  /** Whether the request was cancelled via {@link AbortSignal}. */
  readonly isAborted: boolean;
  /** Human-readable error message. API key patterns have been redacted. */
  readonly message: string;
  /** The original error from the vendor SDK, if available. */
  readonly cause?: unknown;

  constructor(
    message: string,
    provider: ProviderKind,
    options?: {
      statusCode?: number;
      isAborted?: boolean;
      cause?: unknown;
    },
  ) {
    this.provider = provider;
    this.statusCode = options?.statusCode;
    this.isAborted = options?.isAborted ?? false;
    this.message = message;
    this.cause = options?.cause;
  }
}
