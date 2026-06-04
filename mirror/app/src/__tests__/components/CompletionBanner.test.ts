import { describe, it, expect } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CompletionBanner from "../../components/interview/CompletionBanner.vue";

function clickText(w: VueWrapper, text: string) {
  const btn = w.findAll("button").find((b) => b.text().includes(text));
  if (!btn) throw new Error(`No button containing "${text}"`);
  return btn.trigger("click");
}

describe("CompletionBanner", () => {
  describe("synthesizing state", () => {
    it("shows a default phase label", () => {
      const w = mount(CompletionBanner, { props: { status: "synthesizing" } });
      expect(w.text()).toContain("Building your profile");
    });

    it("shows phase-specific label when synthesisPhase is set", () => {
      const w = mount(CompletionBanner, { props: { status: "synthesizing", synthesisPhase: "extracting" } });
      expect(w.text()).toContain("Extracting facts");
    });

    it("shows analyzing label", () => {
      const w = mount(CompletionBanner, { props: { status: "synthesizing", synthesisPhase: "analyzing" } });
      expect(w.text()).toContain("Analyzing patterns");
    });

    it("shows polishing label", () => {
      const w = mount(CompletionBanner, { props: { status: "synthesizing", synthesisPhase: "polishing" } });
      expect(w.text()).toContain("Writing your professional");
    });
  });

  describe("completed state", () => {
    it("shows checkmark and name", () => {
      const w = mount(CompletionBanner, { props: { status: "completed", personaName: "Alex Chen" } });
      expect(w.text()).toMatch(/Alex Chen.*mirror is ready/);
    });

    it("shows generic message when no name", () => {
      const w = mount(CompletionBanner, { props: { status: "completed" } });
      expect(w.text()).toContain("Mirror ready");
    });

    it("emits goInsight when View Insight is clicked", async () => {
      const w = mount(CompletionBanner, { props: { status: "completed" } });
      await clickText(w, "View Insight");
      expect(w.emitted("goInsight")).toHaveLength(1);
    });

    it("emits goProfile when View Profile is clicked", async () => {
      const w = mount(CompletionBanner, { props: { status: "completed" } });
      await clickText(w, "View Profile");
      expect(w.emitted("goProfile")).toHaveLength(1);
    });

    it("shows Start new interview", () => {
      const w = mount(CompletionBanner, { props: { status: "completed" } });
      expect(w.text()).toContain("Start new interview");
    });
  });

  describe("error state", () => {
    it("shows alert icon and error message", () => {
      const w = mount(CompletionBanner, { props: { status: "error", errorMessage: "identity.name: Required" } });
      expect(w.text()).toContain("Couldn't build your profile");
      expect(w.text()).toContain("identity.name: Required");
    });

    it("shows Try again button", () => {
      const w = mount(CompletionBanner, { props: { status: "error", errorMessage: "Failed" } });
      expect(w.text()).toContain("Try again");
    });

    it("emits retry when Try again is clicked", async () => {
      const w = mount(CompletionBanner, { props: { status: "error", errorMessage: "Failed" } });
      await clickText(w, "Try again");
      expect(w.emitted("retry")).toHaveLength(1);
    });

    it("shows Start over button", () => {
      const w = mount(CompletionBanner, { props: { status: "error", errorMessage: "Failed" } });
      expect(w.text()).toContain("Start over");
    });
  });
});
