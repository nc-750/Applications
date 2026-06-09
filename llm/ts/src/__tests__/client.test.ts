import { describe, test, expect } from "bun:test";
import { createLLMClient } from "../client";

const keyProvider = async () => "sk-test-key";

describe("createLLMClient", () => {
  test("creates an OpenAI client", () => {
    const result = createLLMClient({
      provider: "openai",
      model: "gpt-4o",
      keyProvider,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.value.message).toBe("function");
      expect(typeof result.value.stream).toBe("function");
    }
  });

  test("creates an Anthropic client", () => {
    const result = createLLMClient({
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      keyProvider,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.value.message).toBe("function");
      expect(typeof result.value.stream).toBe("function");
    }
  });

  test("rejects unknown provider", () => {
    const result = createLLMClient({
      provider: "unknown" as any,
      model: "test",
      keyProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Unknown provider");
    }
  });

  test("requires baseUrl for openai-compatible", () => {
    const result = createLLMClient({
      provider: "openai-compatible",
      model: "test",
      keyProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("baseUrl");
    }
  });
});
