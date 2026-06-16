import { describe, test, expect, mock, beforeEach } from "bun:test";

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockCreate: any = mock((_params: any) =>
  Promise.resolve({ choices: [{ message: { content: "test response" } }] }),
);

const mockParse: any = mock((_params: any) =>
  Promise.resolve({ choices: [{ message: { content: JSON.stringify({ ok: true }) } }] }),
);

mock.module("openai", () => ({
  default: class {
    chat = {
      completions: {
        create: mockCreate,
        parse: mockParse,
      },
    };
  },
}));

import { createLLMClient } from "../client";
import type { Message } from "../types";

const keyProvider = async () => "sk-test-key";

/** Single-user-message conversation carrying one text part. */
const user = (text: string): Message[] => [
  { role: "user", content: [{ type: "text", text }] },
];

function makeClient() {
  const result = createLLMClient({
    provider: "openai",
    model: "gpt-4o",
    keyProvider,
  });
  if (!result.ok) throw new Error("Failed to create client");
  return result.value;
}

beforeEach(() => {
  mockCreate.mockClear();
  mockParse.mockClear();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe("OpenAI message()", () => {
  test("sends correct SDK params", async () => {
    const llm = makeClient();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Paris" } }],
    });

    const result = await llm.message(user("hi"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe("Paris");

    // Verify SDK was called correctly — user content maps to a content-part array.
    const call = mockCreate.mock.calls[0];
    expect(call).toBeDefined();
    const params = call?.[0] as any;
    expect(params.model).toBe("gpt-4o");
    expect(params.messages).toEqual([
      { role: "user", content: [{ type: "text", text: "hi" }] },
    ]);
    expect(params.stream).toBe(false);
    expect(params.store).toBe(false);
  });

  test("system role maps to a plain string content", async () => {
    const llm = makeClient();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "ok" } }],
    });

    await llm.message([
      { role: "system", content: [{ type: "text", text: "Be helpful" }] },
      { role: "user", content: [{ type: "text", text: "hi" }] },
    ]);

    const params = mockCreate.mock.calls[0]?.[0] as any;
    expect(params.messages).toEqual([
      { role: "system", content: "Be helpful" },
      { role: "user", content: [{ type: "text", text: "hi" }] },
    ]);
  });

  test("with structured output uses parse()", async () => {
    const llm = makeClient();
    mockParse.mockResolvedValue({
      choices: [{ message: { content: '{"name":"John"}' } }],
    });

    const result = await llm.message(user("Extract name"), {
      structured: {
        name: "person",
        schema: { type: "object", properties: { name: { type: "string" } } },
      },
    });

    expect(result.ok).toBe(true);
    // Verify parse() was called with response_format
    const call = mockParse.mock.calls[0];
    const params = call?.[0] as any;
    expect(params.response_format).toBeDefined();
    expect(params.response_format.type).toBe("json_schema");
    expect(params.response_format.json_schema.name).toBe("person");
    expect(params.response_format.json_schema.strict).toBe(true);
  });

  test("store defaults to false", async () => {
    const llm = makeClient();

    await llm.message(user("hi"));

    const call = mockCreate.mock.calls[0];
    const params = call?.[0] as any;
    expect(params.store).toBe(false);
  });

  test("store can be overridden to true", async () => {
    const llm = makeClient();

    await llm.message(user("hi"), { store: true });

    const call = mockCreate.mock.calls[0];
    const params = call?.[0] as any;
    expect(params.store).toBe(true);
  });

  test("SDK errors become Err", async () => {
    const llm = makeClient();
    mockCreate.mockRejectedValue(
      Object.assign(new Error("Unauthorized"), { status: 401 }),
    );

    const result = await llm.message(user("hi"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.statusCode).toBe(401);
      expect(result.error.provider).toBe("openai");
    }
  });
});

describe("OpenAI stream()", () => {
  /**
   * Because the OpenAI streaming create() call returns a Stream<ChatCompletionChunk>,
   * we mock it to return an async iterable that yields chunk-shaped objects.
   */
  test("yields text deltas", async () => {
    // When stream: true, create() returns a Stream (AsyncIterable), not a Promise.
    mockCreate.mockImplementation(() => {
      async function* fakeStream(): AsyncIterable<any> {
        yield { choices: [{ delta: { content: "Hello" } }] };
        yield { choices: [{ delta: { content: " world" } }] };
      }
      return fakeStream();
    });

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
