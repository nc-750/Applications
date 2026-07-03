import { describe, it, expect, vi, afterEach } from "vitest";
import {
    composeMailtoUri,
    submitFeedback,
    FeedbackError,
} from "../../feedback/services";
import { CATEGORY_OPTIONS } from "../../feedback/reference";
import type { FeedbackSubmission } from "../../feedback/models";

// A valid complete submission used as a base for most tests.
function makeValid(overrides: Partial<FeedbackSubmission> = {}): FeedbackSubmission {
    return {
        category: "bug_report",
        email: "user@example.com",
        subject: "Crash on save",
        content: "Detailed description here.",
        ...overrides,
    };
}

// ── Pure core: composeMailtoUri ────────────────────────────────────────────────

describe("composeMailtoUri", () => {
    // 1 — Subject carries the locked category prefix (table-driven, not hardcoded)
    it("prefixes the subject with the locked category string sourced from CATEGORY_OPTIONS", () => {
        const bugOpt = CATEGORY_OPTIONS.find((o) => o.value === "bug_report")!;
        const suggOpt = CATEGORY_OPTIONS.find((o) => o.value === "suggestion")!;

        const bugUri = composeMailtoUri(makeValid({ category: "bug_report", subject: "Crash on save" }));
        const decodedBugSubject = new URLSearchParams(bugUri.split("?")[1]).get("subject");
        expect(decodedBugSubject).toBe(`${bugOpt.subjectPrefix}Crash on save`);

        const suggUri = composeMailtoUri(makeValid({ category: "suggestion", subject: "Dark mode" }));
        const decodedSuggSubject = new URLSearchParams(suggUri.split("?")[1]).get("subject");
        expect(decodedSuggSubject).toBe(`${suggOpt.subjectPrefix}Dark mode`);
    });

    // 2 — Recipient is support@nc-750.com
    it("URI begins with mailto:support@nc-750.com?", () => {
        const uri = composeMailtoUri(makeValid());
        expect(uri.startsWith("mailto:support@nc-750.com?")).toBe(true);
    });

    // 3 — Subject and body are URI-encoded
    it("URI-encodes special characters in subject and body", () => {
        const submission = makeValid({
            subject: "A & B",
            content: "Line 1\nLine 2 spaces",
        });
        const uri = composeMailtoUri(submission);
        const qs = uri.split("?")[1];
        const params = new URLSearchParams(qs.replace(/%20/g, "+"));
        const subject = params.get("subject")!;
        const body = params.get("body")!;

        // Decoded values must round-trip back to the originals (verify encoding round-trip)
        const bugOpt = CATEGORY_OPTIONS.find((o) => o.value === "bug_report")!;
        expect(subject).toBe(`${bugOpt.subjectPrefix}A & B`);
        expect(body).toBe("Line 1\nLine 2 spaces");

        // The raw query string must not contain unencoded & or newline in the values
        // (an unencoded & would truncate the parameter at that point)
        const subjectRaw = qs.match(/subject=([^&]*)/)?.[1] ?? "";
        expect(subjectRaw).not.toContain("&");
        expect(subjectRaw).not.toContain("\n");
    });

    // 4 — Body is the user's Content; subject does not leak body
    it("decoded body equals submission content; decoded subject does not contain the body", () => {
        const submission = makeValid({ subject: "My subject", content: "My body content" });
        const uri = composeMailtoUri(submission);
        const qs = uri.split("?")[1];
        const params = new URLSearchParams(qs.replace(/%20/g, "+"));

        const body = params.get("body");
        const subject = params.get("subject");

        expect(body).toBe("My body content");
        expect(subject).not.toContain("My body content");
    });
});

// ── Imperative shell: submitFeedback ──────────────────────────────────────────

describe("submitFeedback", () => {
    // Stub window.location.href assignment via Object.defineProperty.
    // We track the assigned value to assert the correct URI was used.
    let assignedHref: string | undefined;

    afterEach(() => {
        assignedHref = undefined;
        vi.restoreAllMocks();
    });

    function stubWindowLocation() {
        assignedHref = undefined;
        Object.defineProperty(window, "location", {
            value: {
                ...window.location,
                set href(value: string) {
                    assignedHref = value;
                },
                get href() {
                    return assignedHref ?? "";
                },
            },
            writable: true,
            configurable: true,
        });
    }

    // 5 — Valid submission performs exactly one handoff to the composed URI
    it("valid submission assigns window.location.href exactly once to the composed mailto URI", () => {
        stubWindowLocation();

        const submission = makeValid();
        submitFeedback(submission);

        const expected = composeMailtoUri(submission);
        expect(assignedHref).toBe(expected);
    });

    // 6 — Incomplete submission throws FeedbackError; handoff never called
    it("submission with undefined category throws FeedbackError and performs no handoff", () => {
        stubWindowLocation();

        const submission = makeValid({ category: undefined });
        expect(() => submitFeedback(submission)).toThrow(FeedbackError);
        expect(assignedHref).toBeUndefined();
    });
});
