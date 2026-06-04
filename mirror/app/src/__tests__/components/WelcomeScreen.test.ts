import { describe, it, expect } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import WelcomeScreen from "../../components/interview/WelcomeScreen.vue";
import { usePersonaStore } from "../../stores/personaStore";
import { useLicenseStore } from "../../stores/licenseStore";
import { minimalPersona } from "../factories/persona";

function clickText(w: VueWrapper, text: string) {
  const btn = w.findAll("button").find((b) => b.text().includes(text));
  if (!btn) throw new Error(`No button containing "${text}"`);
  return btn.trigger("click");
}

function setExistingPersona() {
  usePersonaStore().$patch({
    persona: {
      id: "default",
      data: minimalPersona(),
      derived: { how_i_work_best: [] },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    loaded: true,
  });
}

describe("WelcomeScreen", () => {
  describe("no existing persona", () => {
    it("shows Welcome heading", () => {
      const w = mount(WelcomeScreen);
      expect(w.text()).toContain("Welcome to Persona");
    });

    it("shows Start interview button", () => {
      const w = mount(WelcomeScreen);
      expect(w.text()).toContain("Start interview");
    });

    it("emits start when the button is clicked", async () => {
      const w = mount(WelcomeScreen);
      await clickText(w, "Start interview");
      expect(w.emitted("start")).toHaveLength(1);
    });

    it("shows Import persona.json button", () => {
      const w = mount(WelcomeScreen);
      expect(w.text()).toContain("Import persona.json");
    });

    it("shows free tier nudge when not pro", () => {
      const w = mount(WelcomeScreen);
      expect(w.text()).toContain("Free interview");
    });

    it("shows privacy note for first-time users", () => {
      const w = mount(WelcomeScreen);
      expect(w.text()).toContain("All data stays on your device");
    });
  });

  describe("existing persona", () => {
    it("shows Run a new interview heading", () => {
      setExistingPersona();
      const w = mount(WelcomeScreen);
      expect(w.text()).toContain("Run a new interview");
    });

    it("mentions existing persona name", () => {
      setExistingPersona();
      const w = mount(WelcomeScreen);
      expect(w.text()).toContain("Jane Doe");
    });

    it("shows New interview button instead of Start interview", () => {
      setExistingPersona();
      const w = mount(WelcomeScreen);
      expect(w.text()).toContain("New interview");
    });

    it("hides privacy note when persona exists", () => {
      setExistingPersona();
      const w = mount(WelcomeScreen);
      expect(w.text()).not.toContain("All data stays on your device");
    });
  });

  describe("pro user", () => {
    it("hides free tier nudge for pro users", () => {
      useLicenseStore().$patch({ isPro: true, isActivated: true, loaded: true });
      const w = mount(WelcomeScreen);
      expect(w.text()).not.toContain("Free interview");
    });
  });
});
