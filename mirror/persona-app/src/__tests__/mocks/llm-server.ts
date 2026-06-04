import { http, HttpResponse } from "msw";

// ── SSE stream factories ─────────────────────────────────────────────────────

const encoder = new TextEncoder();

/** Build an OpenAI-compatible SSE stream from a list of content deltas. */
export function createOpenAIStreamChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const lines = chunks.map(
    (c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`
  );
  lines.push("data: [DONE]\n\n");
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  });
}

/** Build an Anthropic SSE stream yielding text_delta events. */
export function createAnthropicStreamChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const lines = chunks.map((text) => {
    const event = {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text },
    };
    return `data: ${JSON.stringify(event)}\n\n`;
  });
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  });
}

// ── Response factories ────────────────────────────────────────────────────────

export function createCompletionResponse(content: string) {
  return HttpResponse.json({
    choices: [{ message: { content } }],
  });
}

export function createAnthropicContentResponse(text: string) {
  return HttpResponse.json({
    id: "msg_01",
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    model: "claude-sonnet-4-6",
    stop_reason: "end_turn",
  });
}

export function createAnthropicToolUseResponse(input: unknown) {
  return HttpResponse.json({
    id: "msg_01",
    type: "message",
    role: "assistant",
    content: [
      { type: "tool_use", id: "tu_01", name: "emit_persona", input },
    ],
    model: "claude-sonnet-4-6",
    stop_reason: "tool_use",
  });
}

export function createSchemaRejection() {
  return HttpResponse.json(
    { error: { message: "json_schema is not supported", type: "invalid_request_error" } },
    { status: 400 }
  );
}

export function createAPIError(status: number, message: string) {
  return HttpResponse.json(
    { error: { message } },
    { status }
  );
}

// ── MSW handlers ──────────────────────────────────────────────────────────────

export interface LLMServerOptions {
  /** Base URL to intercept. Default: "https://api.openai.com/v1" */
  baseUrl?: string;
  /** SSE content chunks for streaming requests. */
  streamChunks?: string[];
  /** Static text for non-streaming complete(). */
  completionText?: string;
  /** Structured output: json_schema mode response (JSON-stringified). */
  structuredJSON?: string;
  /** Structured output: Anthropic tool_use input object. */
  toolUseInput?: unknown;
  /** If true, json_schema mode returns 400 → fallback to json_object. */
  rejectSchema?: boolean;
  /** Model list IDs to return. Default: ["gpt-4o", "gpt-4o-mini"]. */
  modelIds?: string[];
  /** HTTP error status to return for all requests (0 = no error). */
  errorStatus?: number;
  /** Error message for error responses. */
  errorMessage?: string;
}

/**
 * Creates MSW handlers for an OpenAI-compatible endpoint (OpenAI, Mistral,
 * openai-compatible). Handles streaming, non-streaming, structured output
 * (json_schema → json_object fallback), and model listing.
 */
export function createOpenAIHandlers(opts: LLMServerOptions = {}) {
  const base = (opts.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const streamChunks = opts.streamChunks ?? ["Hello", " ", "world"];
  const completionText = opts.completionText ?? "Non-streaming response";
  const structuredJSON = opts.structuredJSON ?? JSON.stringify({ result: "ok" });
  const modelIds = opts.modelIds ?? ["gpt-4o", "gpt-4o-mini"];

  return [
    // Chat completions
    http.post(`${base}/chat/completions`, async ({ request }) => {
      if (opts.errorStatus) {
        return createAPIError(opts.errorStatus, opts.errorMessage ?? "Error");
      }

      const body = (await request.json()) as Record<string, unknown>;

      // Streaming
      if (body?.stream) {
        return new HttpResponse(createOpenAIStreamChunks(streamChunks), {
          headers: { "Content-Type": "text/event-stream" },
        });
      }

      const responseFormat = body?.response_format as { type?: string } | undefined;

      // Structured output: json_schema
      if (responseFormat?.type === "json_schema") {
        if (opts.rejectSchema) return createSchemaRejection();
        return createCompletionResponse(structuredJSON);
      }

      // Structured output: json_object
      if (responseFormat?.type === "json_object") {
        return createCompletionResponse(structuredJSON);
      }

      // Plain completion
      return createCompletionResponse(completionText);
    }),

    // Model listing
    http.get(`${base}/models`, () => {
      if (opts.errorStatus) {
        return createAPIError(opts.errorStatus, opts.errorMessage ?? "Error");
      }
      return HttpResponse.json({
        data: modelIds.map((id) => ({ id })),
      });
    }),
  ];
}

/**
 * Creates MSW handlers for the Anthropic API. Handles streaming (SSE text_delta),
 * non-streaming, structured output (tool_use), and model listing.
 */
export function createAnthropicHandlers(opts: LLMServerOptions = {}) {
  const base = (opts.baseUrl ?? "https://api.anthropic.com/v1").replace(/\/$/, "");
  const streamChunks = opts.streamChunks ?? ["Hello", " ", "world"];
  const completionText = opts.completionText ?? "Anthropic response";
  const toolUseInput = opts.toolUseInput ?? { result: "ok" };
  const modelIds = opts.modelIds ?? ["claude-sonnet-4-6", "claude-haiku-4-5"];

  return [
    // Messages — streaming
    http.post(`${base}/messages`, async ({ request }) => {
      if (opts.errorStatus) {
        return createAPIError(opts.errorStatus, opts.errorMessage ?? "Error");
      }

      const body = (await request.json()) as Record<string, unknown>;

      // Streaming
      if (body?.stream) {
        return new HttpResponse(createAnthropicStreamChunks(streamChunks), {
          headers: { "Content-Type": "text/event-stream" },
        });
      }

      // Structured output (tool_use)
      if (body?.tools && Array.isArray(body.tools) && body.tools.length > 0) {
        return createAnthropicToolUseResponse(toolUseInput);
      }

      // Plain completion
      return createAnthropicContentResponse(completionText);
    }),

    // Model listing
    http.get(`${base}/models`, () => {
      if (opts.errorStatus) {
        return createAPIError(opts.errorStatus, opts.errorMessage ?? "Error");
      }
      return HttpResponse.json({
        data: modelIds.map((id) => ({ id })),
      });
    }),
  ];
}
