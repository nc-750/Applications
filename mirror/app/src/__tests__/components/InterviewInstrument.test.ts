import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ReadoutPanel from "../../components/interview/ReadoutPanel.vue";
import ProbeCell from "../../components/interview/ProbeCell.vue";
import SessionLogCell from "../../components/interview/SessionLogCell.vue";
import { emptyCoverage } from "../../types/interview";

describe("ReadoutPanel", () => {
  it("renders the dark monitor cavity with five coverage meters", () => {
    const w = mount(ReadoutPanel, {
      props: { coverage: { story: 0.55, strengths: 0.4, hidden: 0.15, growth: 0.1, drivers: 0.25 } },
    });
    expect(w.find(".nc-monitor").exists()).toBe(true);
    expect(w.findAll(".nc-coverage")).toHaveLength(5);
    expect(w.text()).toContain("55%");
  });

  it("shows the probe-signal LED honestly (strong → advancing)", () => {
    const w = mount(ReadoutPanel, { props: { coverage: emptyCoverage(), probeSignal: "strong" } });
    expect(w.find(".nc-led--on").exists()).toBe(true);
    expect(w.text()).toContain("ADVANCING");
  });

  it("thin signal reads as probing deeper", () => {
    const w = mount(ReadoutPanel, { props: { coverage: emptyCoverage(), probeSignal: "thin" } });
    expect(w.find(".nc-led--warn").exists()).toBe(true);
    expect(w.text()).toContain("PROBING DEEPER");
  });

  it("acquiring shows the analysis LED and minimal hides percentages", () => {
    const w = mount(ReadoutPanel, { props: { coverage: emptyCoverage(), acquiring: true, minimal: true } });
    expect(w.find(".nc-led--rec").exists()).toBe(true);
    expect(w.text()).not.toContain("%");
  });
});

describe("ProbeCell", () => {
  it("renders the facet tag and question, emits the answer on submit", async () => {
    const w = mount(ProbeCell, {
      props: { facet: "strengths", question: "What do others rely on you for?" },
    });
    // nc-facet uppercases via CSS; the DOM text node keeps the label casing.
    expect(w.find(".nc-facet").text()).toContain("Strengths");
    expect(w.text()).toContain("What do others rely on you for?");

    await w.find("textarea").setValue("They rely on me to de-risk launches.");
    await w.find("button.nc-btn--accent").trigger("click");
    expect(w.emitted("submit")?.[0]).toEqual(["They rely on me to de-risk launches."]);
  });

  it("shows the acquisition overlay while analysing", () => {
    const w = mount(ProbeCell, { props: { facet: "story", question: "Q", acquiring: true } });
    expect(w.find(".nc-acquire").exists()).toBe(true);
  });
});

describe("SessionLogCell", () => {
  it("pairs each answered probe into one collapsible entry", () => {
    const now = new Date().toISOString();
    const w = mount(SessionLogCell, {
      props: {
        messages: [
          { role: "assistant", content: "Q1?", timestamp: now },
          { role: "user", content: "A1", timestamp: now },
          { role: "assistant", content: "Q2?", timestamp: now }, // unanswered → not logged
        ],
      },
    });
    expect(w.findAll(".nc-log__entry")).toHaveLength(1);
    expect(w.text()).toContain("OBS 01");
  });
});
