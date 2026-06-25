// Selectable feedback categories for the submission form — labels and their locked
// mailto: subject-line prefixes. Reference data, not a domain model
// (CONVENTIONS 1.2 / 6.10); the category value set is the discriminator stored on
// FeedbackSubmission. Named CATEGORY_OPTIONS to mirror the PROVIDER_OPTIONS precedent.

/** The set of valid feedback category values — the discriminator stored on the model. */
export type FeedbackCategory = "bug_report" | "suggestion" | "other";

export interface CategoryOption {
    value: FeedbackCategory;
    /** Display name shown in the category selector. */
    label: string;
    /**
     * Bracketed prefix prepended to the user's subject when composing the mailto: URI.
     * Stored here so Phase 3's service reads a prefix rather than hardcoding the mapping.
     * Example: "[Mirror][Feedback - Bug Report]: "
     */
    subjectPrefix: string;
}

export const CATEGORY_OPTIONS: readonly CategoryOption[] = [
    {
        value: "bug_report",
        label: "Bug report",
        subjectPrefix: "[Mirror][Feedback - Bug Report]: ",
    },
    {
        value: "suggestion",
        label: "Suggestion",
        subjectPrefix: "[Mirror][Feedback - Suggestion]: ",
    },
    {
        value: "other",
        label: "Other",
        subjectPrefix: "[Mirror][Feedback - Other]: ",
    },
] as const;
