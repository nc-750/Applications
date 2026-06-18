import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, RouterLinkStub, type VueWrapper } from "@vue/test-utils";
import { flushPromises } from "@vue/test-utils";
import SettingsPage from "../../settings/pages/SettingsPage.vue";
import LLMConfigCell from "../../settings/components/LLMConfigCell.vue";
import ConnectionMonitorCell from "../../settings/components/ConnectionMonitorCell.vue";
import DataManagementCell from "../../settings/components/DataManagementCell.vue";
import SystemControlCell from "../../settings/components/SystemControlCell.vue";
import { useSettingsStore } from "../../settings/stores";
import { LLMProvider, type LLMConfig } from "../../llm";

// The view binds the store read-only and calls services — mock the side-effecting
// services so the decomposed view can be exercised without real I/O. The store
// itself is real (drives the keyStore-backed db, which is mocked to the PWA path).
vi.mock("../../settings/services", () => ({ testConnection: vi.fn(), getModels: vi.fn().mockResolvedValue([]) }));
vi.mock("../../persona/services", () => ({
    importPersona: vi.fn(),
    exportPersona: vi.fn(),
    deletePersona: vi.fn(),
    syncInterviewAfterImport: vi.fn(),
}));
vi.mock("../../core/Wipe", () => ({ factoryReset: vi.fn() }));
vi.mock("../../settings/db/keyStore", () => ({
    isTauri: () => false,
    saveApiKey: vi.fn(),
    loadApiKey: vi.fn().mockResolvedValue(null),
    clearApiKey: vi.fn(),
}));

import { testConnection } from "../../settings/services";
import { importPersona, deletePersona } from "../../persona/services";

function mountPage(): VueWrapper {
    return mount(SettingsPage, {
        global: { stubs: { "router-link": RouterLinkStub } },
    });
}

const validConfig: LLMConfig = {
    provider: LLMProvider.OpenAI,
    model: "gpt-4o",
    apiKey: "sk-test",
    endpoint: "https://api.openai.com",
};

describe("SettingsPage (decomposed)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("composes the four Lab cells: config, link monitor, data, system", () => {
        const wrapper = mountPage();
        expect(wrapper.findComponent(LLMConfigCell).exists()).toBe(true);
        expect(wrapper.findComponent(ConnectionMonitorCell).exists()).toBe(true);
        expect(wrapper.findComponent(DataManagementCell).exists()).toBe(true);
        expect(wrapper.findComponent(SystemControlCell).exists()).toBe(true);
    });

    it("renders the config form fields and an idle link readout", () => {
        const wrapper = mountPage();
        expect(wrapper.find("select").exists()).toBe(true);
        expect(wrapper.find('input[type="text"]').attributes("placeholder")).toBe("gpt-4o");
        expect(wrapper.find('input[type="url"]').exists()).toBe(true);
        expect(wrapper.find('input[type="password"]').exists()).toBe(true);
        // Honest readout: no test has been run yet.
        expect(wrapper.findComponent(ConnectionMonitorCell).text()).toContain("AWAITING TEST");
    });

    it("a save from the config cell persists through the store (no llmConfig assignment)", async () => {
        const wrapper = mountPage();
        const store = useSettingsStore();
        expect(store.isLLMConfigured).toBe(false);

        await wrapper.findComponent(LLMConfigCell).vm.$emit("save", validConfig);
        await flushPromises();

        expect(store.provider).toBe(LLMProvider.OpenAI);
        expect(store.model).toBe("gpt-4o");
        expect(store.apiKey).toBe("sk-test");
        expect(store.isLLMConfigured).toBe(true);
    });

    it("a test from the config cell calls the service and shows the measured latency", async () => {
        vi.mocked(testConnection).mockResolvedValue(42);
        const wrapper = mountPage();

        await wrapper.findComponent(LLMConfigCell).vm.$emit("test", validConfig);
        await flushPromises();

        expect(testConnection).toHaveBeenCalledWith(validConfig);
        const monitor = wrapper.findComponent(ConnectionMonitorCell);
        expect(monitor.text()).toContain("LINK ESTABLISHED");
        expect(monitor.text()).toContain("42ms");
    });

    it("a failed test surfaces the error as a link-failed readout", async () => {
        vi.mocked(testConnection).mockRejectedValue(new Error("unreachable"));
        const wrapper = mountPage();

        await wrapper.findComponent(LLMConfigCell).vm.$emit("test", validConfig);
        await flushPromises();

        const monitor = wrapper.findComponent(ConnectionMonitorCell);
        expect(monitor.text()).toContain("LINK FAILED");
        expect(monitor.text()).toContain("unreachable");
    });

    it("an import calls the persona service; a failure renders the error banner", async () => {
        vi.mocked(importPersona).mockRejectedValue(new Error("not a persona"));
        const wrapper = mountPage();

        const file = new File(["{}"], "p.json", { type: "application/json" });
        await wrapper.findComponent(DataManagementCell).vm.$emit("import", file);
        await flushPromises();

        expect(importPersona).toHaveBeenCalledOnce();
        expect(wrapper.text()).toContain("Import failed: not a persona");
    });

    it("a delete calls the deletePersona orchestrator", async () => {
        vi.mocked(deletePersona).mockResolvedValue(undefined);
        const wrapper = mountPage();

        await wrapper.findComponent(DataManagementCell).vm.$emit("delete");
        await flushPromises();

        expect(deletePersona).toHaveBeenCalledOnce();
    });
});
