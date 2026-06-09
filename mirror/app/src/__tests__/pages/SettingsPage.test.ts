import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { useMirrorStore } from "../../stores/mirror";
import SettingsPage from "../../pages/SettingsPage.vue";

// Mock keyStore — SettingsPage indirectly uses it via the store
const mockLoadApiKey = vi.fn();
const mockSaveApiKey = vi.fn();
const mockClearApiKey = vi.fn();
const mockIsTauri = vi.fn(() => false);

vi.mock("../../lib/keyStore", () => ({
  loadApiKey: (...args: unknown[]) => mockLoadApiKey(...args),
  saveApiKey: (...args: unknown[]) => mockSaveApiKey(...args),
  clearApiKey: (...args: unknown[]) => mockClearApiKey(...args),
  isTauri: () => mockIsTauri(),
}));

// Mock the old settingsStore (still referenced by interviewStore) to avoid
// Vite/Rollup parse errors on the .ts.old extension.
vi.mock("../../stores/settingsStore.ts.old", () => ({
  useSettingsStore: vi.fn(() => ({
    provider: "openai",
    model: "gpt-4o",
    apiKey: "",
    endpoint: "",
  })),
}));

/** Helper: trigger a click on the first button whose text contains the given string. */
async function clickButton(w: VueWrapper, text: string) {
  const btn = w.findAll("button").find((b) => b.text().includes(text));
  if (!btn) throw new Error(`No button containing "${text}"`);
  await btn.trigger("click");
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadApiKey.mockResolvedValue(null);
    mockIsTauri.mockReturnValue(false);
  });

  describe("renders form fields", () => {
    it("renders provider select, model input, endpoint input, API key input, and Save button", () => {
      const wrapper = mount(SettingsPage);

      // Provider select
      expect(wrapper.find("select").exists()).toBe(true);

      // Model input
      const modelInput = wrapper.find<HTMLInputElement>('input[type="text"]');
      expect(modelInput.exists()).toBe(true);
      expect(modelInput.attributes("placeholder")).toBe("gpt-4o");

      // Endpoint input
      const endpointInput = wrapper.find<HTMLInputElement>('input[type="url"]');
      expect(endpointInput.exists()).toBe(true);

      // API key input (rendered via TextField as <input type="password">)
      const apiKeyInput = wrapper.find<HTMLInputElement>('input[type="password"]');
      expect(apiKeyInput.exists()).toBe(true);
      expect(apiKeyInput.attributes("placeholder")).toBe("sk-XXXX-XXXX-XXXX");

      // Save button (Button with submit prop renders <button type="submit">)
      const saveBtn = wrapper.find('button[type="submit"]');
      expect(saveBtn.exists()).toBe(true);
      expect(saveBtn.text()).toContain("Save");
    });
  });

  describe("form pre-fills from store config", () => {
    it("shows saved values when llmConfig is set on mount", async () => {
      const store = useMirrorStore();
      store.llmConfig = {
        provider: "anthropic",
        model: "claude-4-6-sonnet",
        apiKey: "sk-pre-fill",
        endpoint: "https://api.anthropic.com",
      };
      // Allow reactivity to settle before mounting
      await nextTick();

      const wrapper = mount(SettingsPage);
      await nextTick();

      // Provider select should reflect the saved value
      const select = wrapper.find("select").element as HTMLSelectElement;
      expect(select.value).toBe("anthropic");

      // Model input
      const modelInput = wrapper.find<HTMLInputElement>('input[type="text"]');
      expect(modelInput.element.value).toBe("claude-4-6-sonnet");

      // Endpoint input
      const endpointInput = wrapper.find<HTMLInputElement>('input[type="url"]');
      expect(endpointInput.element.value).toBe("https://api.anthropic.com");

      // API key input
      const apiKeyInput = wrapper.find<HTMLInputElement>('input[type="password"]');
      expect(apiKeyInput.element.value).toBe("sk-pre-fill");
    });
  });

  describe("Save button persists config", () => {
    it("updates mirrorStore.llmConfig when form is filled and Save is clicked", async () => {
      const wrapper = mount(SettingsPage);
      const store = useMirrorStore();

      // Initially not configured
      expect(store.llmConfig).toBeNull();

      // Fill in form fields — order matters: set API key, model and endpoint
      // AFTER the select (which clears model/apiKey/endpoint via onAIProviderSelected).
      const select = wrapper.find("select");
      await select.setValue("openai");
      await nextTick();

      const modelInput = wrapper.find<HTMLInputElement>('input[placeholder="gpt-4o"]');
      await modelInput.setValue("gpt-4o-mini");
      await nextTick();

      const endpointInput = wrapper.find<HTMLInputElement>('input[type="url"]');
      await endpointInput.setValue("https://api.openai.com");
      await nextTick();

      const apiKeyInput = wrapper.find<HTMLInputElement>('input[type="password"]');
      await apiKeyInput.setValue("sk-test-save");
      await nextTick();

      // Verify values are reflected in the DOM
      expect((select.element as HTMLSelectElement).value).toBe("openai");
      expect((modelInput.element as HTMLInputElement).value).toBe("gpt-4o-mini");
      expect((endpointInput.element as HTMLInputElement).value).toBe("https://api.openai.com");
      expect((apiKeyInput.element as HTMLInputElement).value).toBe("sk-test-save");

      // Submit the form
      await wrapper.find("form").trigger("submit");

      // Wait for async store operations to settle
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify store was updated
      expect(store.llmConfig).not.toBeNull();
      expect(store.llmConfig!.provider).toBe("openai");
      expect(store.llmConfig!.model).toBe("gpt-4o-mini");
      expect(store.llmConfig!.apiKey).toBe("sk-test-save");
      expect(store.llmConfig!.endpoint).toBe("https://api.openai.com");
      expect(store.isLLMConfigured).toBe(true);
    });
  });

  describe("Clear LLM Config resets form", () => {
    it("clears llmConfig and resets form fields", async () => {
      // Pre-populate the store with a config
      const store = useMirrorStore();
      store.llmConfig = {
        provider: "anthropic",
        model: "claude-4-6-sonnet",
        apiKey: "sk-clear-test",
        endpoint: "https://api.anthropic.com",
      };
      await nextTick();

      const wrapper = mount(SettingsPage);
      await nextTick();

      // Verify form is pre-filled
      expect(
        (wrapper.find<HTMLInputElement>('input[type="text"]').element as HTMLInputElement).value,
      ).toBe("claude-4-6-sonnet");

      // Click "Clear LLM Config" button
      await clickButton(wrapper, "Clear LLM Config");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Store should be cleared
      expect(store.llmConfig).toBeNull();
      expect(store.isLLMConfigured).toBe(false);

      // Form fields should be reset to empty
      const select = wrapper.find("select").element as HTMLSelectElement;
      expect(select.value).toBe("");

      const modelInput = wrapper.find<HTMLInputElement>('input[type="text"]').element as HTMLInputElement;
      expect(modelInput.value).toBe("");

      const endpointInput = wrapper.find<HTMLInputElement>('input[type="url"]').element as HTMLInputElement;
      expect(endpointInput.value).toBe("");

      const apiKeyInput = wrapper.find<HTMLInputElement>('input[type="password"]').element as HTMLInputElement;
      expect(apiKeyInput.value).toBe("");
    });
  });
});
