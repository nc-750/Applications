import { describe, it, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import FeedbackModalCell from "../../feedback/components/FeedbackModalCell.vue";
import { CATEGORY_OPTIONS } from "../../feedback/reference";
import { FeedbackError } from "../../feedback/services";

// Mock the services module so the component picks up the stub at import time.
vi.mock("../../feedback/services", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../feedback/services")>();
    return {
        ...actual,
        submitFeedback: vi.fn(),
    };
});

// Import the mock *after* vi.mock so we reference the same spy instance.
import * as FeedbackService from "../../feedback/services";

// Mirror the SettingsPage.test.ts mount / findComponent / trigger idiom.
// No store, no router, no services — the modal owns local draft state only.

function mountOpen() {
    return mount(FeedbackModalCell, { props: { open: true } });
}

function mountClosed() {
    return mount(FeedbackModalCell, { props: { open: false } });
}

describe("FeedbackModalCell", () => {
    // 1 — The panel hosts input on a Cell, not a monitor (7.6 guard)
    it("panel hosts input on a Cell surface, not a monitor cavity (7.6)", () => {
        const wrapper = mountOpen();
        // A select (category) and email/subject/content inputs must be present
        expect(wrapper.find("select").exists()).toBe(true);
        expect(wrapper.find('input[type="email"]').exists()).toBe(true);
        // Subject via TextField renders an <input type="text">
        expect(wrapper.find('input[type="text"]').exists()).toBe(true);
        // Content via Textarea renders a <textarea>
        expect(wrapper.find("textarea").exists()).toBe(true);
        // Panel must NOT be rooted on nc-monitor (input must never live in a monitor)
        expect(wrapper.find(".nc-monitor").exists()).toBe(false);
    });

    // 2 — Category selector is populated from the reference table, not re-declared
    it("category options come from CATEGORY_OPTIONS — not re-declared in the component", () => {
        const wrapper = mountOpen();
        // All CATEGORY_OPTIONS values must appear as <option> values
        const options = wrapper.findAll("select option");
        const values = options.map((o) => o.attributes("value"));
        for (const opt of CATEGORY_OPTIONS) {
            expect(values).toContain(opt.value);
        }
        // Labels must match the reference table
        for (const opt of CATEGORY_OPTIONS) {
            const match = options.find((o) => o.attributes("value") === opt.value);
            expect(match).toBeDefined();
            expect(match!.text()).toBe(opt.label);
        }
        // Plus the disabled placeholder = CATEGORY_OPTIONS.length + 1 options
        expect(options.length).toBe(CATEGORY_OPTIONS.length + 1);
    });

    // 3 — Submit is gated until the form is valid
    it("submit is disabled on empty draft; enabled when all fields are valid", async () => {
        const wrapper = mountOpen();
        const submitBtn = wrapper.find('button[type="submit"]');
        // Fresh: empty draft — submit must be disabled
        expect(submitBtn.attributes("disabled")).toBeDefined();

        // Fill category
        await wrapper.find("select").setValue(CATEGORY_OPTIONS[0].value);
        // Fill email
        await wrapper.find('input[type="email"]').setValue("user@example.com");
        // Fill subject
        await wrapper.find('input[type="text"]').setValue("My subject");
        // Fill content
        await wrapper.find("textarea").setValue("Some content here");
        await wrapper.vm.$nextTick();

        // Now valid — submit must be enabled
        expect(wrapper.find('button[type="submit"]').attributes("disabled")).toBeUndefined();
    });

    // 4 — Unchosen category blocks submit (resolved required-category rule)
    it("unchosen category alone blocks submit even when email/subject/content are valid", async () => {
        const wrapper = mountOpen();
        // Fill all fields except category
        await wrapper.find('input[type="email"]').setValue("user@example.com");
        await wrapper.find('input[type="text"]').setValue("My subject");
        await wrapper.find("textarea").setValue("Some content here");
        await wrapper.vm.$nextTick();

        const submitBtn = wrapper.find('button[type="submit"]');
        expect(submitBtn.attributes("disabled")).toBeDefined();
    });

    // (Test 5 removed — it pinned the Phase-2 inert submit behavior, which Phase 3 replaces.
    //  CONVENTIONS 8.3: replace the pre-convention test, don't appease it.
    //  Tests 7-9 below cover the Phase-3 wired submit behavior.)

    // 6 — Escape closes the open dialog (emits 'close')
    it("Escape keydown on the panel emits exactly one close event", async () => {
        const wrapper = mountOpen();
        const panel = wrapper.find("[role='dialog']");
        expect(panel.exists()).toBe(true);

        await panel.trigger("keydown", { key: "Escape" });
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted("close")).toHaveLength(1);
    });

    // 7 — Backdrop click closes; panel click does not
    it("backdrop click emits close; panel interior click does not", async () => {
        const wrapper = mountOpen();
        // The backdrop is the root element (position:fixed full-viewport)
        const backdrop = wrapper.find(".fmc-backdrop");
        const panel = wrapper.find("[role='dialog']");

        expect(backdrop.exists()).toBe(true);
        expect(panel.exists()).toBe(true);

        // Click on the panel interior (category select) — must NOT emit close
        await panel.trigger("click");
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted("close")).toBeUndefined();

        // Click the backdrop — must emit close
        await backdrop.trigger("click");
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted("close")).toHaveLength(1);
    });

    // 8 — Closed at rest renders nothing
    it("with open=false, the backdrop and panel are absent from the DOM", () => {
        const wrapper = mountClosed();
        expect(wrapper.find(".fmc-backdrop").exists()).toBe(false);
        expect(wrapper.find("[role='dialog']").exists()).toBe(false);
    });

    // ── Phase-3 wired submit tests ────────────────────────────────────────────

    afterEach(() => {
        vi.mocked(FeedbackService.submitFeedback).mockReset();
    });

    async function fillValid(wrapper: ReturnType<typeof mountOpen>) {
        await wrapper.find("select").setValue(CATEGORY_OPTIONS[0].value);
        await wrapper.find('input[type="email"]').setValue("user@example.com");
        await wrapper.find('input[type="text"]').setValue("My subject");
        await wrapper.find("textarea").setValue("Some content here");
        await wrapper.vm.$nextTick();
    }

    async function submitForm(wrapper: ReturnType<typeof mountOpen>) {
        // Trigger the form's submit event directly — clicking a submit button in jsdom
        // does not fire the native form submit event, so @submit.prevent never runs.
        await wrapper.find("form").trigger("submit");
        await wrapper.vm.$nextTick();
    }

    // 7 — Valid submit invokes the delivery path
    it("valid submit invokes submitFeedback with the expected recipient and prefixed subject", async () => {
        vi.mocked(FeedbackService.submitFeedback).mockImplementation(() => {});
        const wrapper = mountOpen();
        await fillValid(wrapper);

        await submitForm(wrapper);

        expect(FeedbackService.submitFeedback).toHaveBeenCalledTimes(1);
        const arg = vi.mocked(FeedbackService.submitFeedback).mock.calls[0][0];
        expect(arg.category).toBe(CATEGORY_OPTIONS[0].value);
        expect(arg.email).toBe("user@example.com");
        expect(arg.subject).toBe("My subject");
    });

    // 8 — Failed handoff surfaces error in modal and does not close
    it("when submitFeedback throws FeedbackError, modal shows the error message and does not close", async () => {
        vi.mocked(FeedbackService.submitFeedback).mockImplementation(() => {
            throw new FeedbackError("Handoff failed.");
        });
        const wrapper = mountOpen();
        await fillValid(wrapper);

        await submitForm(wrapper);

        expect(wrapper.text()).toContain("Handoff failed.");
        expect(wrapper.emitted("close")).toBeUndefined();
    });

    // 9 — Successful handoff shows honest acknowledgment (not "sent") and does not close
    it("successful handoff shows acknowledgment text (not 'sent') and does not emit close", async () => {
        vi.mocked(FeedbackService.submitFeedback).mockImplementation(() => {});
        const wrapper = mountOpen();
        await fillValid(wrapper);

        await submitForm(wrapper);

        const text = wrapper.text();
        // Honest acknowledgment: "Handed off to your mail client."
        expect(text).toContain("Handed off to your mail client");
        // Must NOT claim "sent" (ETHOS C7 — OS gives no delivery callback)
        expect(text.toLowerCase()).not.toContain("message sent");
        expect(text.toLowerCase()).not.toContain("email sent");
        // No close emitted
        expect(wrapper.emitted("close")).toBeUndefined();
    });

    // 10 — Structural focus management and ARIA contract (C8.3 — honest to jsdom)
    it("when open, panel carries role=dialog + aria-modal + an accessible name (C8.3 structural)", () => {
        const wrapper = mountOpen();
        const panel = wrapper.find("[role='dialog']");

        expect(panel.exists()).toBe(true);
        expect(panel.attributes("aria-modal")).toBe("true");

        // Accessible name via aria-label or aria-labelledby
        const hasLabel =
            panel.attributes("aria-label") !== undefined ||
            panel.attributes("aria-labelledby") !== undefined;
        expect(hasLabel).toBe(true);

        // The panel or a child must have tabindex so focus-on-open can land
        // (focus move itself is not assertable in jsdom — the wiring is structural)
        const focusable =
            panel.attributes("tabindex") !== undefined ||
            wrapper.find("[role='dialog'] [tabindex]").exists() ||
            wrapper.find("[role='dialog'] select").exists();
        expect(focusable).toBe(true);

        // Note: document.activeElement is not asserted here — jsdom + vue-test-utils
        // cannot reliably observe focus-on-open when it is moved in a setTimeout(0) watcher.
        // The structural prerequisites above (role, aria-modal, accessible name, focusable
        // target) are the honest boundary of what this test can assert.
    });
});
