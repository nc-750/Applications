import { describe, it, expect, beforeEach, vi } from "vitest";
import type { LLMClient } from "@nc-750/llm-ts";
import { testConnection } from "../../settings/services/testConnection";
import { LLMClientError, LLMProvider } from "../../llm";
import type { LLMConfig } from "../../llm";

// Mock the library so we can control the Result the client returns. The settings
// service builds the client through the shared factory, so mocking the library
// covers both the construction and probe paths.
const mockCreateLLMClient = vi.fn();
vi.mock("@nc-750/llm-ts", () => ({
    createLLMClient: (...args: unknown[]) => mockCreateLLMClient(...args),
}));

function makeConfig(overrides: Partial<LLMConfig> = {}): LLMConfig {
    return {
        provider: LLMProvider.OpenAI,
        model: "gpt-4o",
        apiKey: "sk-test",
        endpoint: "",
        ...overrides,
    };
}

function fakeClient(overrides: Partial<LLMClient> = {}): LLMClient {
    return {
        message: vi.fn().mockResolvedValue({ ok: true, value: "ok" }),
        stream: vi.fn(),
        ...overrides,
    };
}

describe("testConnection", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("resolves to the round-trip latency (a number) when the probe succeeds", async () => {
        mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeClient() });

        const latencyMs = await testConnection(makeConfig());

        expect(typeof latencyMs).toBe("number");
        expect(latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("rejects with LLMClientError (not a sentinel) when client construction fails", async () => {
        mockCreateLLMClient.mockReturnValue({
            ok: false,
            error: { message: "bad config" },
        });

        await expect(testConnection(makeConfig())).rejects.toThrow(LLMClientError);
    });

    it("rejects with LLMClientError when the probe message fails", async () => {
        mockCreateLLMClient.mockReturnValue({
            ok: true,
            value: fakeClient({
                message: vi.fn().mockResolvedValue({
                    ok: false,
                    error: { message: "401 unauthorized" },
                }),
            }),
        });

        await expect(testConnection(makeConfig())).rejects.toThrow("401 unauthorized");
    });
});
