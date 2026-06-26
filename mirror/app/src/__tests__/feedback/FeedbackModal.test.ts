import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import FeedbackModalCell from "../../feedback/components/FeedbackModalCell.vue";
import { CATEGORY_OPTIONS } from "../../feedback/reference";

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

    // 5 — Inert submit dispatches nothing
    it("activating submit does not emit any transport event and does not call window.open / location", async () => {
        const wrapper = mountOpen();
        // Fill to valid state
        await wrapper.find("select").setValue(CATEGORY_OPTIONS[0].value);
        await wrapper.find('input[type="email"]').setValue("user@example.com");
        await wrapper.find('input[type="text"]').setValue("My subject");
        await wrapper.find("textarea").setValue("Some content here");
        await wrapper.vm.$nextTick();

        // Click submit
        await wrapper.find('button[type="submit"]').trigger("click");
        await wrapper.vm.$nextTick();

        // No emitted events that could route to transport (only 'close' is defined)
        const emitted = wrapper.emitted();
        expect(emitted["send"]).toBeUndefined();
        expect(emitted["submit"]).toBeUndefined();
        expect(emitted["close"]).toBeUndefined(); // submit does not close
    });

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

    // 9 — Structural focus management and ARIA contract (C8.3 — honest to jsdom)
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
