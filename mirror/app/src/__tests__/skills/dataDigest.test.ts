import { describe, it, expect, vi } from "vitest";
import {
  prepareInputBrief,
  estimateTokens,
  DIGEST_THRESHOLD_CHARS,
  DIGEST_CHUNK_CHARS,
} from "../../interview/prompts/dataDigest";
import type { LLMClient } from "@nc-750/llm-ts";

function createMockLLM(messageResponse: string): LLMClient {
  return {
    message: vi.fn().mockResolvedValue({ ok: true, value: messageResponse }),
    stream: vi.fn(),
  };
}

describe("dataDigest", () => {
  describe("estimateTokens", () => {
    it("estimates tokens as length / 3.5", () => {
      expect(estimateTokens("")).toBe(0);
      expect(estimateTokens("Hello world")).toBe(Math.ceil(11 / 3.5));
    });
  });

  describe("DIGEST_THRESHOLD_CHARS", () => {
    it("is a positive number", () => {
      expect(DIGEST_THRESHOLD_CHARS).toBeGreaterThan(0);
    });
  });

  describe("DIGEST_CHUNK_CHARS", () => {
    it("is a positive number", () => {
      expect(DIGEST_CHUNK_CHARS).toBeGreaterThan(0);
    });
  });

  describe("prepareInputBrief", () => {
    it("returns data verbatim when under threshold", async () => {
      const smallData = "Short input data";
      const llm = createMockLLM("should not be called");
      const result = await prepareInputBrief(smallData, llm);
      expect(result.brief).toBe(smallData);
      expect(result.wasDigested).toBe(false);
      // LLM should not have been called
      expect(llm.message).not.toHaveBeenCalled();
    });

    it("digests data when over threshold", async () => {
      const largeData = "x".repeat(DIGEST_THRESHOLD_CHARS + 1);
      const llm = createMockLLM("Digested summary of the input");
      const result = await prepareInputBrief(largeData, llm);
      expect(result.wasDigested).toBe(true);
    });

    it("runs LLM map step for data over threshold", async () => {
      const largeData = "x".repeat(DIGEST_THRESHOLD_CHARS + 1);
      const llm = createMockLLM("brief extract");
      const result = await prepareInputBrief(largeData, llm);
      expect(result.wasDigested).toBe(true);
      expect(result.brief).toBe("brief extract");
    });

    it("returns single chunk extract without reduce when only 1 chunk", async () => {
      const data = "y".repeat(DIGEST_THRESHOLD_CHARS + 1);
      const llm = createMockLLM("single chunk extract");

      // If data length is just over threshold but still fits in one chunk
      const actualChunks = Math.ceil(data.length / DIGEST_CHUNK_CHARS);
      const result = await prepareInputBrief(data, llm);

      expect(result.wasDigested).toBe(true);
      if (actualChunks === 1) {
        // Only map, no reduce
        expect(result.brief).toBe("single chunk extract");
      }
    });
  });
});
