import { describe, it, expect } from "vitest";
import { extractFencedJSON, stripNulls } from "../../../interview/prompts";

describe("extractFencedJSON", () => {
    it("extracts JSON from a fenced code block", () => {
        const text = "```json\n" + JSON.stringify({ hello: "world" }) + "\n```";
        expect(extractFencedJSON(text)).toEqual({ hello: "world" });
    });

    it("falls back to bare JSON when no fences are present", () => {
        expect(extractFencedJSON(JSON.stringify({ hello: "world" }))).toEqual({ hello: "world" });
    });

    it("returns the first parseable fenced block", () => {
        const text = [
            "```json", JSON.stringify({ first: true }), "```",
            "```json", JSON.stringify({ second: true }), "```",
        ].join("\n");
        expect(extractFencedJSON(text)).toEqual({ first: true });
    });

    it("skips an invalid fence and continues", () => {
        const text = [
            "```json", "not valid {{{", "```",
            "```", JSON.stringify({ valid: true }), "```",
        ].join("\n");
        expect(extractFencedJSON(text)).toEqual({ valid: true });
    });

    it("trims before the bare-JSON fallback", () => {
        expect(extractFencedJSON("  \n  " + JSON.stringify({ trimmed: true }) + "  \n  ")).toEqual({ trimmed: true });
    });

    it("returns null when nothing parses", () => {
        expect(extractFencedJSON("just text")).toBeNull();
        expect(extractFencedJSON("")).toBeNull();
    });
});

describe("stripNulls", () => {
    it("drops null-valued keys recursively", () => {
        const cleaned = stripNulls({ a: 1, b: null, c: { d: null, e: "keep" } });
        expect(cleaned).toEqual({ a: 1, c: { e: "keep" } });
    });

    it("drops null array elements", () => {
        expect(stripNulls([1, null, 2])).toEqual([1, 2]);
    });

    it("leaves non-null primitives untouched", () => {
        expect(stripNulls("x")).toBe("x");
        expect(stripNulls(0)).toBe(0);
        expect(stripNulls(false)).toBe(false);
    });
});
