import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, RouterLinkStub, type VueWrapper } from "@vue/test-utils";
import { flushPromises } from "@vue/test-utils";
import SettingsPage from "../../settings/pages/SettingsPage.vue";
import ActionStatusModal from "../../settings/components/ActionStatusModal.vue";
import LLMConfigCell from "../../settings/components/LLMConfigCell.vue";
import ConnectionMonitorCell from "../../settings/components/ConnectionMonitorCell.vue";
import DataManagementCell from "../../settings/components/DataManagementCell.vue";
import SystemControlCell from "../../settings/components/SystemControlCell.vue";
import { useSettingsStore } from "../../settings/stores";
import { usePersonaStore } from "../../persona/stores";
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
// Mock the settings db barrel so individual tests can make writeSettings reject
// to drive the save-failure path (settingsStore catches into error, never throws).
vi.mock("../../settings/db", () => ({
    readSettings: vi.fn().mockResolvedValue(null),
    writeSettings: vi.fn().mockResolvedValue(undefined),
    clearSettings: vi.fn().mockResolvedValue(undefined),
}));

import { testConnection } from "../../settings/services";
import { importPersona, deletePersona, syncInterviewAfterImport } from "../../persona/services";
import { writeSettings } from "../../settings/db";

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
        // Re-establish the default mocks that clearAllMocks() resets
        vi.mocked(writeSettings).mockResolvedValue(undefined);
        vi.mocked(syncInterviewAfterImport).mockResolvedValue(undefined);
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

    // ── Modal closed at rest ───────────────────────────────────────────────────

    it("the modal is closed at rest — no false success/error surface before any action", () => {
        const wrapper = mountPage();
        // The ActionStatusModal renders v-if="isVisible" — it must be absent at idle.
        // All three holders start idle, so no data-op status panel should appear.
        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(false);
    });

    // ── Save ──────────────────────────────────────────────────────────────────

    it("a successful save shows a true 'saved' reading in the modal", async () => {
        // writeSettings resolves (default mock) → settingsStore.error stays null.
        const wrapper = mountPage();

        await wrapper.findComponent(LLMConfigCell).vm.$emit("save", validConfig);
        await flushPromises();

        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);
        // Modal should be in success state — label contains "SAVING CONFIG DONE"
        expect(modal.text()).toContain("SAVING CONFIG");
        expect(modal.text()).toContain("DONE");
        // Must not surface error heading
        expect(modal.text()).not.toContain("FAILED");
    });

    it("a failed save shows the real failure in the modal, not a generic one", async () => {
        // Make writeSettings reject so settingsStore catches into settingsStore.error.
        vi.mocked(writeSettings).mockRejectedValue(new Error("disk quota exceeded"));
        const wrapper = mountPage();

        await wrapper.findComponent(LLMConfigCell).vm.$emit("save", validConfig);
        await flushPromises();

        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);
        // Modal must be in error state with the real surfaced store message
        expect(modal.text()).toContain("SAVING CONFIG FAILED");
        // The store wraps the message: "Failed to save settings: disk quota exceeded"
        expect(modal.text()).toContain("disk quota exceeded");
        // ETHOS C7 guard: the real message appears, not a placeholder
        expect(modal.text()).not.toContain("SAVING CONFIG DONE");
    });

    it("a failed save is NOT duplicated in the shared error banner", async () => {
        vi.mocked(writeSettings).mockRejectedValue(new Error("write failure"));
        const wrapper = mountPage();

        await wrapper.findComponent(LLMConfigCell).vm.$emit("save", validConfig);
        await flushPromises();

        // The banner Cell (ERROR // SYS // 0xEE) must not appear for a save failure —
        // the modal owns this failure (no-double-surface invariant, Phase 2 brief).
        // The banner is only shown when displayError is set (pageError — export path only).
        expect(wrapper.text()).not.toContain("ERROR");
        expect(wrapper.text()).not.toContain("0xEE");
    });

    // F2 (ETHOS C7 — stale-error regression guard): a successful save after a prior
    // failed save must show SUCCESS, not the stale FAILED reading.
    //
    // Root cause being guarded: SettingsStore.persist() only sets error.value on failure
    // and never resets it to null on success. Without the pre/post snapshot fix in onSave,
    // settingsStore.error retains the stale message from save #1, so save #2's terminal
    // is incorrectly derived as "failed" — a literally-false reading (ETHOS C7).
    //
    // This test FAILS against the old onSave (which checks `if (settingsStore.error)`
    // unconditionally after the await) and passes with the snapshot fix.
    it("a successful save after a prior failed save shows SUCCESS (stale-error guard, ETHOS C7)", async () => {
        // ── Save #1: fails — settingsStore.error is set ──────────────────────────
        vi.mocked(writeSettings).mockRejectedValue(new Error("transient disk error"));
        const wrapper = mountPage();

        await wrapper.findComponent(LLMConfigCell).vm.$emit("save", validConfig);
        await flushPromises();

        // Confirm save #1 left the store in error state (the precondition for the bug).
        const store = useSettingsStore();
        expect(store.error).not.toBeNull();

        // Dismiss the modal so the holder resets to idle before save #2.
        const modal1 = wrapper.findComponent(ActionStatusModal);
        expect(modal1.exists()).toBe(true);
        expect(modal1.text()).toContain("SAVING CONFIG FAILED");
        await modal1.find("button").trigger("click");
        await flushPromises();

        // ── Save #2: succeeds — settingsStore.error is NOT cleared by the store ──
        // The store still holds the stale error from save #1.
        vi.mocked(writeSettings).mockResolvedValue(undefined);

        await wrapper.findComponent(LLMConfigCell).vm.$emit("save", validConfig);
        await flushPromises();

        // The store's error is still the stale value (store out of scope — not touched).
        // Verify the stale error is still present after the successful write.
        expect(store.error).not.toBeNull(); // stale — the bug's precondition is live

        // onSave MUST show SUCCESS because the save genuinely succeeded, NOT the stale FAILED.
        const modal2 = wrapper.findComponent(ActionStatusModal);
        expect(modal2.exists()).toBe(true);
        expect(modal2.text()).toContain("SAVING CONFIG");
        expect(modal2.text()).toContain("DONE");
        expect(modal2.text()).not.toContain("FAILED");
    });

    // ── Import ────────────────────────────────────────────────────────────────

    // REWRITTEN from the old assertion: the original test expected the failure in the
    // shared error banner ("Import failed: not a persona" in wrapper.text()). Phase 2
    // deliberately moves import failures to the modal. This rewrite asserts the new
    // correct surface — the modal — and that the banner no longer shows it.
    // This is a behavior change, not a regression.
    it("a failed import shows the real error in the modal and NOT in the shared error banner", async () => {
        vi.mocked(importPersona).mockRejectedValue(new Error("not a persona"));
        const wrapper = mountPage();

        const file = new File(["{}"], "p.json", { type: "application/json" });
        await wrapper.findComponent(DataManagementCell).vm.$emit("import", file);
        await flushPromises();

        expect(importPersona).toHaveBeenCalledOnce();

        // Failure must appear in the modal (IMPORTING PERSONA FAILED + real message)
        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);
        expect(modal.text()).toContain("IMPORTING PERSONA FAILED");
        expect(modal.text()).toContain("not a persona");

        // The failure must NOT be in the shared banner — no double-surface.
        // The banner only appears when displayError (pageError) is set.
        // onImportPersona no longer routes its failure to pageError (Phase 2 brief).
        expect(wrapper.text()).not.toContain("Import failed: not a persona");
        // The banner Cell itself must not be visible (no ERROR // SYS // 0xEE heading)
        expect(wrapper.text()).not.toContain("0xEE");
    });

    it("a successful import shows a true 'imported' reading in the modal", async () => {
        vi.mocked(importPersona).mockResolvedValue(undefined);
        vi.mocked(syncInterviewAfterImport).mockResolvedValue(undefined);
        const wrapper = mountPage();

        const file = new File(["{}"], "p.json", { type: "application/json" });
        await wrapper.findComponent(DataManagementCell).vm.$emit("import", file);
        await flushPromises();

        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);
        // success: "IMPORTING PERSONA DONE"
        expect(modal.text()).toContain("IMPORTING PERSONA");
        expect(modal.text()).toContain("DONE");
        expect(modal.text()).not.toContain("FAILED");
    });

    // ── Delete ────────────────────────────────────────────────────────────────

    // Delete-failure assertion is written against the STORE-SEEDED error path, not a
    // rejection. deletePersona is void-returning and never rejects (PersonaLifecycle.ts:72–86).
    // We simulate a clearPersona failure by having the mock set personaStore.error
    // (mirroring what the real PersonaStore.clearPersona() does on a db failure).
    it("a delete failure is surfaced from the store outcome, not a rejection", async () => {
        const wrapper = mountPage();
        // Pinia store is already active; grab the shared instance.
        const personaStore = usePersonaStore();

        // Mock deletePersona to simulate a partial failure: the orchestrator returns void
        // but leaves personaStore.error set (as PersonaStore.clearPersona() would on failure).
        vi.mocked(deletePersona).mockImplementation(async () => {
            personaStore.setError("Failed to clear the persona: IDB error");
        });

        await wrapper.findComponent(DataManagementCell).vm.$emit("delete");
        await flushPromises();

        expect(deletePersona).toHaveBeenCalledOnce();

        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);
        // Must be in error state with the real store message
        expect(modal.text()).toContain("DELETING PERSONA FAILED");
        expect(modal.text()).toContain("Failed to clear the persona: IDB error");
        // Must NOT show success — a try/catch with unreachable catch bug would show DONE here
        expect(modal.text()).not.toContain("DELETING PERSONA DONE");
    });

    it("a successful delete shows a true 'deleted' reading in the modal", async () => {
        // deletePersona resolves without setting any store error → clean outcome.
        vi.mocked(deletePersona).mockResolvedValue(undefined);
        const wrapper = mountPage();

        await wrapper.findComponent(DataManagementCell).vm.$emit("delete");
        await flushPromises();

        expect(deletePersona).toHaveBeenCalledOnce();

        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);
        expect(modal.text()).toContain("DELETING PERSONA");
        expect(modal.text()).toContain("DONE");
        expect(modal.text()).not.toContain("FAILED");
    });

    // ── Dismissal behavior (error persists; success auto-dismisses) ────────────

    it("an error reading persists until dismissed — it is not auto-cleared", async () => {
        // Use fake timers from the start. Under fake timers, use
        // vi.advanceTimersByTimeAsync() instead of flushPromises() — in vitest 3,
        // advanceTimersByTimeAsync flushes the microtask queue between each tick so
        // async chains (including rejected promises) resolve correctly without needing
        // the real-setTimeout-backed flushPromises().
        vi.useFakeTimers();
        vi.mocked(importPersona).mockRejectedValue(new Error("bad file"));
        const wrapper = mountPage();

        const file = new File(["{}"], "p.json", { type: "application/json" });
        wrapper.findComponent(DataManagementCell).vm.$emit("import", file);
        // Flush microtasks + any 0ms timers so the async chain resolves
        await vi.advanceTimersByTimeAsync(0);
        await wrapper.vm.$nextTick();

        // Error modal must be visible
        expect(wrapper.findComponent(ActionStatusModal).exists()).toBe(true);
        expect(wrapper.findComponent(ActionStatusModal).text()).toContain("FAILED");

        // Advance well past the success auto-dismiss constant (2500ms) —
        // error must NOT auto-dismiss; it must stay until the user acts.
        await vi.advanceTimersByTimeAsync(5000);
        await wrapper.vm.$nextTick();

        expect(wrapper.findComponent(ActionStatusModal).exists()).toBe(true);
        expect(wrapper.findComponent(ActionStatusModal).text()).toContain("FAILED");

        vi.useRealTimers();
    });

    it("a success reading auto-dismisses after the view-only delay", async () => {
        // Use fake timers from the start. Under fake timers, use
        // vi.advanceTimersByTimeAsync() instead of flushPromises() — in vitest 3,
        // advanceTimersByTimeAsync flushes the microtask queue between each tick so
        // async chains resolve correctly. This also lets us control the SUCCESS_DISMISS_MS
        // timer that ActionStatusModal.vue sets up in its watch on props.status.
        vi.useFakeTimers();
        vi.mocked(importPersona).mockResolvedValue(undefined);
        vi.mocked(syncInterviewAfterImport).mockResolvedValue(undefined);
        const wrapper = mountPage();

        const file = new File(["{}"], "p.json", { type: "application/json" });
        wrapper.findComponent(DataManagementCell).vm.$emit("import", file);
        // Flush microtasks + 0ms timers so the async chain completes and Vue updates
        await vi.advanceTimersByTimeAsync(0);
        await wrapper.vm.$nextTick();

        // Success modal should be visible initially (SUCCESS_DISMISS_MS not elapsed yet)
        expect(wrapper.findComponent(ActionStatusModal).exists()).toBe(true);
        expect(wrapper.findComponent(ActionStatusModal).text()).toContain("DONE");

        // Advance past the SUCCESS_DISMISS_MS constant (2500ms in the component)
        await vi.advanceTimersByTimeAsync(3000);
        await wrapper.vm.$nextTick();

        // After auto-dismiss, the modal must be gone
        expect(wrapper.findComponent(ActionStatusModal).exists()).toBe(false);

        vi.useRealTimers();
    });

    // ── Keyboard / dismiss control (C8.3) ──────────────────────────────────────

    it("the dismiss control is a real keyboard-operable <button> in error state", async () => {
        vi.mocked(importPersona).mockRejectedValue(new Error("bad file"));
        const wrapper = mountPage();

        const file = new File(["{}"], "p.json", { type: "application/json" });
        await wrapper.findComponent(DataManagementCell).vm.$emit("import", file);
        await flushPromises();

        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);
        // A real <button> must be present (keyboard-operable, focusable — C8.3)
        expect(modal.find("button").exists()).toBe(true);
        expect(modal.find("button").text()).toBe("Dismiss");
    });

    it("pressing Escape on a dismissible (error) state closes the modal", async () => {
        vi.mocked(importPersona).mockRejectedValue(new Error("bad file"));
        const wrapper = mountPage();

        const file = new File(["{}"], "p.json", { type: "application/json" });
        await wrapper.findComponent(DataManagementCell).vm.$emit("import", file);
        await flushPromises();

        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);

        // Trigger Escape key on the panel
        await modal.find(".asm-panel").trigger("keydown", { key: "Escape" });
        await flushPromises();
        await wrapper.vm.$nextTick();

        // The modal must be gone after Escape
        expect(wrapper.findComponent(ActionStatusModal).exists()).toBe(false);
    });

    it("no dismiss button is rendered in the running state (non-dismissible)", async () => {
        // Set importPersona to a never-resolving promise so running state holds
        vi.mocked(importPersona).mockImplementation(() => new Promise(() => {}));
        const wrapper = mountPage();

        const file = new File(["{}"], "p.json", { type: "application/json" });
        // Start the import (don't await — it never resolves)
        wrapper.findComponent(DataManagementCell).vm.$emit("import", file);
        // Give Vue one tick to update
        await wrapper.vm.$nextTick();

        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);
        // In running state the panel must NOT have a dismiss button
        expect(modal.find("button").exists()).toBe(false);
    });

    it("the alert role is present on the modal panel (C8.3 — announced to AT)", async () => {
        vi.mocked(importPersona).mockRejectedValue(new Error("bad file"));
        const wrapper = mountPage();

        const file = new File(["{}"], "p.json", { type: "application/json" });
        await wrapper.findComponent(DataManagementCell).vm.$emit("import", file);
        await flushPromises();

        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);
        // role="alert" makes the region announced on appearance (C8.3)
        const panel = modal.find("[role='alert']");
        expect(panel.exists()).toBe(true);
    });

    // ── Status is not colour-only (C8.3) ──────────────────────────────────────

    it("each rendered state carries a text label — status is never colour-only", async () => {
        // The brief says: "if every branch structurally renders a label, fold this into the
        // per-state assertions." The error and success labels are already asserted by the save,
        // import, and delete tests above. This test pins the structural invariant for the error
        // case explicitly: the .nc-lcd-sub element is always present in a terminal state so
        // the reading is never colour-only (C8.3).
        vi.mocked(importPersona).mockRejectedValue(new Error("bad file"));
        const wrapper = mountPage();
        const file = new File(["{}"], "p.json", { type: "application/json" });
        await wrapper.findComponent(DataManagementCell).vm.$emit("import", file);
        await flushPromises();

        const modal = wrapper.findComponent(ActionStatusModal);
        expect(modal.exists()).toBe(true);
        // The nc-lcd-sub element carries the terminal label text — present and non-empty
        expect(modal.find(".nc-lcd-sub").exists()).toBe(true);
        expect(modal.find(".nc-lcd-sub").text()).toContain("FAILED");
        // The nc-led dot is corroborating, not sole — confirmed by the presence of text
        // alongside it (the text test above already checks: text is not empty).
    });

    // ── Link (onTest) tests unchanged — Out-of-scope wall guard ───────────────

    it("a connection test drives only ConnectionMonitorCell — data-op modal is not opened", async () => {
        vi.mocked(testConnection).mockResolvedValue(42);
        const wrapper = mountPage();

        await wrapper.findComponent(LLMConfigCell).vm.$emit("test", validConfig);
        await flushPromises();

        // ConnectionMonitorCell still shows the link result
        expect(wrapper.findComponent(ConnectionMonitorCell).text()).toContain("LINK ESTABLISHED");

        // The data-op modal must NOT be opened by an onTest call
        // (the linkStatus triple does not route through the modal — Out-of-scope wall)
        expect(wrapper.findComponent(ActionStatusModal).exists()).toBe(false);
    });

    it("a delete calls the deletePersona orchestrator", async () => {
        vi.mocked(deletePersona).mockResolvedValue(undefined);
        const wrapper = mountPage();

        await wrapper.findComponent(DataManagementCell).vm.$emit("delete");
        await flushPromises();

        expect(deletePersona).toHaveBeenCalledOnce();
    });
});
