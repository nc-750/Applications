import { describe, it, expect } from "vitest";
import { createEmptyFeedbackSubmission } from "../../feedback/models";
import { CATEGORY_OPTIONS } from "../../feedback/reference";

describe("createEmptyFeedbackSubmission", () => {
    it("returns a zeroed, unconfigured submission", () => {
        const submission = createEmptyFeedbackSubmission();

        expect(submission.category).toBeUndefined();
        expect(submission.email).toBe("");
        expect(submission.subject).toBe("");
        expect(submission.content).toBe("");
    });

    it("is total — exactly the four expected keys are present", () => {
        const submission = createEmptyFeedbackSubmission();

        expect(Object.keys(submission).sort()).toEqual(
            ["category", "content", "email", "subject"].sort(),
        );
    });
});

describe("CATEGORY_OPTIONS", () => {
    it("contains exactly the three locked categories", () => {
        const values = CATEGORY_OPTIONS.map((o) => o.value);

        expect(values).toHaveLength(3);
        expect(values).toContain("bug_report");
        expect(values).toContain("suggestion");
        expect(values).toContain("other");
    });

    it("each category carries its locked subject-prefix verbatim", () => {
        const byValue = Object.fromEntries(
            CATEGORY_OPTIONS.map((o) => [o.value, o.subjectPrefix]),
        );

        expect(byValue["bug_report"]).toBe("[Mirror][Feedback - Bug Report]: ");
        expect(byValue["suggestion"]).toBe("[Mirror][Feedback - Suggestion]: ");
        expect(byValue["other"]).toBe("[Mirror][Feedback - Other]: ");
    });

    it("each category carries a non-empty human label, pinned verbatim", () => {
        const byValue = Object.fromEntries(
            CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
        );

        // Non-empty guard
        CATEGORY_OPTIONS.forEach((o) => {
            expect(o.label.length).toBeGreaterThan(0);
        });

        // Verbatim pin (N1 — a label typo must not ship green; note casing:
        // "Bug report" label vs "Bug Report" in the subjectPrefix is intentional)
        expect(byValue["bug_report"]).toBe("Bug report");
        expect(byValue["suggestion"]).toBe("Suggestion");
        expect(byValue["other"]).toBe("Other");
    });
});
