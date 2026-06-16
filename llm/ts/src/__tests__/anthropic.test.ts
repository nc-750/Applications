import { describe, test, expect, mock, beforeEach } from "bun:test";

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockCreate = mock((_params: any) =>
  Promise.resolve({
    content: [{ type: "text", text: "test response" }],
  }),
);

const mockStream = mock((_params: any) => {
  async function* fakeEventStream(): AsyncIterable<any> {
    yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hello" } };
    yield { type: "content_block_delta", delta: { type: "text_delta", text: " world" } };
  }
  return fakeEventStream();
});

mock.module("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: mockCreate,
      stream: mockStream,
    };
  },
}));

import { createLLMClient } from "../client";
import type { Message } from "../types";

const keyProvider = async () => "sk-ant-test-key";

/** Single-user-message conversation carrying one text part. */
const user = (text: string): Message[] => [
  { role: "user", content: [{ type: "text", text }] },
];

function makeClient() {
  const result = createLLMClient({
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    keyProvider,
  });
  if (!result.ok) throw new Error("Failed to create client");
  return result.value;
}

beforeEach(() => {
  mockCreate.mockClear();
  mockStream.mockClear();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Anthropic message()", () => {
  test("extracts system (from text parts) to top-level param", async () => {
    const llm = makeClient();
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "I can help" }],
    });

    // System content arrives as a content-part array (the only supported shape).
    // This locks in the fix: array content must NOT collapse to an empty system.
    const result = await llm.message([
      { role: "system", content: [{ type: "text", text: "Be helpful" }] },
      { role: "user", content: [{ type: "text", text: "hi" }] },
    ]);

    expect(result.ok).toBe(true);
    const call = mockCreate.mock.calls[0];
    const params = call?.[0] as any;
    // System prompt extracted to top-level — non-empty.
    expect(params.system).toBe("Be helpful");
    // Only user messages remain, carrying their content-part array.
    expect(params.messages).toEqual([
      { role: "user", content: [{ type: "text", text: "hi" }] },
    ]);
  });

  test("with structured output uses tool_use", async () => {
    const llm = makeClient();
    mockCreate.mockResolvedValue({
      content: [{ type: "tool_use", name: "person", input: { name: "John" } }],
    } as any);

    const result = await llm.message(user("Extract name"), {
      structured: {
        name: "person",
        schema: { type: "object", properties: { name: { type: "string" } } },
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ name: "John" });

    const call = mockCreate.mock.calls[0];
    const params = call?.[0] as any;
    expect(params.tools).toBeDefined();
    expect(params.tools[0].name).toBe("person");
    expect(params.tool_choice).toEqual({ type: "tool", name: "person" });
  });

  test("max_tokens defaults to 8192", async () => {
    const llm = makeClient();

    await llm.message(user("hi"));

    const call = mockCreate.mock.calls[0];
    const params = call?.[0] as any;
    expect(params.max_tokens).toBe(8192);
  });

  test("max_tokens can be overridden", async () => {
    const llm = makeClient();

    await llm.message(user("hi"), { maxTokens: 512 });

    const call = mockCreate.mock.calls[0];
    const params = call?.[0] as any;
    expect(params.max_tokens).toBe(512);
  });
});

describe("Anthropic stream()", () => {
  test("yields text deltas", async () => {
    const llm = makeClient();

    const result = await llm.stream(user("Tell me a story"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const chunks: string[] = [];
    for await (const chunk of result.value) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(["Hello", " world"]);
  });
});

describe("Anthropic error handling", () => {
  test("SDK errors sanitize API key", async () => {
    const llm = makeClient();
    // Simulate an error whose message contains an API key pattern
    mockCreate.mockRejectedValue(
      new Error("Request failed with key sk-ant-test1234567890abcdef in body"),
    );

    const result = await llm.message(user("hi"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      // The key pattern must not appear in the normalized error
      expect(result.error.message).not.toContain("sk-ant-test1234567890abcdef");
      expect(result.error.message).toContain("[REDACTED]");
    }
  });

  test("abort produces isAborted error", async () => {
    const llm = makeClient();
    const controller = new AbortController();
    controller.abort();
    // The SDK may throw a DOMException or its own abort error
    mockCreate.mockRejectedValue(
      new DOMException("The operation was aborted", "AbortError"),
    );

    const result = await llm.message(user("hi"), { signal: controller.signal });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.isAborted).toBe(true);
    }
  });
});
