import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import FeedbackDisclosureCell from "../../feedback/components/FeedbackDisclosureCell.vue";

// Mirror the FeedbackModal.test.ts mount idiom — no store, no router, no services.
// The cell is prop-less and emit-less; mount with no options.

function mountCell() {
    return mount(FeedbackDisclosureCell);
}

describe("FeedbackDisclosureCell", () => {
    // 1 — Discloses the real destination address (ETHOS C1.3 guard).
    //     Bug it catches: address drifts from the service's RECIPIENT or is dropped,
    //     leaving the user with no disclosure of where feedback goes.
    it("rendered text contains the recipient address support@nc-750.com", () => {
        const wrapper = mountCell();
        expect(wrapper.text()).toContain("support@nc-750.com");
    });

    // 2 — Never claims the app sends or that the message was sent (ETHOS C7.2/C7.5 guard).
    //     Bug it catches: copy is edited into a "your feedback has been sent" style
    //     false guarantee — the exact failure the modal ack text was written to avoid.
    it("rendered text uses local-handoff framing and does not contain false-send claims", () => {
        const wrapper = mountCell();
        const text = wrapper.text();
        const lower = text.toLowerCase();

        // Must contain a local-handoff phrase
        const hasLocalHandoff =
            lower.includes("your own email") || lower.includes("your own mail client");
        expect(hasLocalHandoff).toBe(true);

        // Must NOT contain false-send substrings (case-insensitive)
        expect(lower).not.toContain("message sent");
        expect(lower).not.toContain("email sent");
        expect(lower).not.toContain("we send");
        expect(lower).not.toContain("we receive");
    });
});
