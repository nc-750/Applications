import { describe, it, expect, vi } from "vitest";
import { synthesizeHowIWorkBest } from "../../skills/profileSynthesizer";
import { richPersona, minimalPersona } from "../factories/persona";
import type { LLMProvider } from "../../llm/types";

function createMockLLM(completeResponse: string): LLMProvider {
  return {
    streamChat: vi.fn(),
    complete: vi.fn().mockResolvedValue(completeResponse),
    structuredComplete: vi.fn(),
    listModels: vi.fn(),
    healthCheck: vi.fn(),
  };
}

describe("profileSynthesizer", () => {
  describe("synthesizeHowIWorkBest", () => {
    it("returns parsed string array from LLM JSON response", async () => {
      const llm = createMockLLM(
        '["Clear goals with autonomy.", "Deep technical collaboration.", "Environment balancing speed and craftsmanship."]'
      );
      const result = await synthesizeHowIWorkBest(richPersona(), llm);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.length).toBeLessThanOrEqual(4);
    });

    it("caps at 4 items", async () => {
      const llm = createMockLLM(
        '["One", "Two", "Three", "Four", "Five"]'
      );
      const result = await synthesizeHowIWorkBest(richPersona(), llm);
      expect(result.length).toBeLessThanOrEqual(4);
    });
  });

  describe("synthesizeHowIWorkBest — fallback parsing", () => {
    it("falls back to line-based parsing when response is not JSON", async () => {
      const llm = createMockLLM(
        "I work best with clear goals.\nI thrive in autonomous environments.\nI value deep collaboration."
      );
      const result = await synthesizeHowIWorkBest(richPersona(), llm);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(4);
    });

    it("filters lines shorter than 10 characters", async () => {
      const llm = createMockLLM("Short\nA long enough statement about work\nOK");
      const result = await synthesizeHowIWorkBest(richPersona(), llm);
      // "Short" and "OK" are < 10 chars and filtered; only the long line remains
      expect(result.every((s: string) => s.length > 10)).toBe(true);
    });

    it("strips bullet characters from fallback lines", async () => {
      const llm = createMockLLM(
        "- First working style statement\n• Second working style statement"
      );
      const result = await synthesizeHowIWorkBest(richPersona(), llm);
      expect(result[0]).not.toMatch(/^[-•]/);
      expect(result[1]).not.toMatch(/^[-•]/);
    });
  });

  describe("synthesizeHowIWorkBest — input data", () => {
    it("includes persona weaknesses in prompt", async () => {
      const llm = createMockLLM('["Works best with autonomy."]');
      await synthesizeHowIWorkBest(richPersona(), llm);

      const completeCall = (llm.complete as ReturnType<typeof vi.fn>).mock.calls[0];
      const messages = completeCall[0];
      const prompt = messages[0].content as string;
      expect(prompt).toContain("Over-engineering");
      expect(prompt).toContain("Delegation");
    });

    it("includes personality traits in prompt", async () => {
      const llm = createMockLLM('["Works best with autonomy."]');
      await synthesizeHowIWorkBest(richPersona(), llm);

      const completeCall = (llm.complete as ReturnType<typeof vi.fn>).mock.calls[0];
      const prompt = (completeCall[0] as Array<{ content: string }>)[0].content;
      expect(prompt).toContain("Openness");
      expect(prompt).toContain("Conscientiousness");
    });

    it("includes values in prompt", async () => {
      const llm = createMockLLM('["Works best with autonomy."]');
      await synthesizeHowIWorkBest(richPersona(), llm);

      const completeCall = (llm.complete as ReturnType<typeof vi.fn>).mock.calls[0];
      const prompt = (completeCall[0] as Array<{ content: string }>)[0].content;
      expect(prompt).toContain("Craftsmanship");
    });

    it("handles empty weaknesses/traits/values gracefully", async () => {
      const llm = createMockLLM('["Works well independently."]');
      const result = await synthesizeHowIWorkBest(minimalPersona(), llm);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("synthesizeHowIWorkBest — signal", () => {
    it("passes abort signal to the LLM", async () => {
      const llm = createMockLLM('["Works best with autonomy."]');
      const controller = new AbortController();
      await synthesizeHowIWorkBest(richPersona(), llm, controller.signal);

      const completeCall = (llm.complete as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(completeCall[1]).toBe(controller.signal);
    });
  });
});
