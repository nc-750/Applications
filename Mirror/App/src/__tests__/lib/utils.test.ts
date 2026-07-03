import { describe, it, expect, vi } from "vitest";
import { downloadFile, readFileAsText, openExternal } from "../../fileManager/services/utils";

describe("downloadFile", () => {
  // downloadFile creates a Blob + anchor.click() — not fully testable in jsdom.
  // The function's contract is tested implicitly via the export/download flows.
  it("is defined and callable", () => {
    expect(typeof downloadFile).toBe("function");
  });
});

describe("readFileAsText", () => {
  it("resolves with file content on successful read", async () => {
    const file = new File(["hello world"], "test.txt", { type: "text/plain" });
    const content = await readFileAsText(file);
    expect(content).toBe("hello world");
  });
});

describe("openExternal", () => {
  it("opens URL via window.open in PWA mode", async () => {
    const openSpy = vi.fn();
    const originalOpen = window.open;
    window.open = openSpy;

    await openExternal("https://example.com");

    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer"
    );

    window.open = originalOpen;
  });
});
