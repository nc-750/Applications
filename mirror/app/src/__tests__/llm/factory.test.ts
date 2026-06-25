import { describe, it, expect, beforeEach, vi } from "vitest";
import type { LLMClient } from "@nc-750/llm-ts";
import {
    createClientFromConfig,
    LLMClientError,
} from "../../llm/factory";
import { LLMProvider } from "../../llm/types";
import type { LLMConfig } from "../../llm/types";

// Mock the library so we can inspect the wire config it receives and control
// the Result it returns.
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
        models: vi.fn().mockResolvedValue({ ok: true, value: [] }),
        ...overrides,
    };
}

describe("createClientFromConfig", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCreateLLMClient.mockReturnValue({ ok: true, value: fakeClient() });
    });

    it.each([
        [LLMProvider.OpenAI, "openai"],
        [LLMProvider.Anthropic, "anthropic"],
        [LLMProvider.CustomRemoteOpenAI, "openai-compatible"],
        [LLMProvider.CustomLocalOpenAI, "openai-compatible"],
    ])("maps provider %s to ProviderKind %s", (provider, kind) => {
        createClientFromConfig(makeConfig({ provider, endpoint: "https://x" }));

        expect(mockCreateLLMClient).toHaveBeenCalledTimes(1);
        expect(mockCreateLLMClient.mock.calls[0][0]).toMatchObject({
            provider: kind,
            model: "gpt-4o",
        });
    });

    it("passes the api key through keyProvider and undefined baseUrl when endpoint is empty", async () => {
        createClientFromConfig(makeConfig({ apiKey: "sk-secret", endpoint: "" }));

        const wire = mockCreateLLMClient.mock.calls[0][0];
        expect(wire.baseUrl).toBeUndefined();
        await expect(wire.keyProvider()).resolves.toBe("sk-secret");
    });

    it("forwards a non-empty endpoint as baseUrl", () => {
        createClientFromConfig(
            makeConfig({ provider: LLMProvider.CustomLocalOpenAI, endpoint: "http://localhost:11434" }),
        );
        expect(mockCreateLLMClient.mock.calls[0][0].baseUrl).toBe("http://localhost:11434");
    });

    it("returns the unwrapped client on success", () => {
        const client = fakeClient();
        mockCreateLLMClient.mockReturnValue({ ok: true, value: client });
        expect(createClientFromConfig(makeConfig())).toBe(client);
    });

    it("throws LLMClientError (not a sentinel) on a failed Result", () => {
        mockCreateLLMClient.mockReturnValue({
            ok: false,
            error: { message: "baseUrl required" },
        });
        expect(() => createClientFromConfig(makeConfig())).toThrow(LLMClientError);
        expect(() => createClientFromConfig(makeConfig())).toThrow("baseUrl required");
    });
});
