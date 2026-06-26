// Feedback submission service — mailto: handoff (CONVENTIONS 4.1–4.5).
//
// Functional core / imperative shell:
//   composeMailtoUri — pure; builds the URI, fully unit-testable.
//   submitFeedback   — impure; performs the OS handoff, logs + throws on failure.
//
// The category→subjectPrefix mapping lives in reference/Categories.ts (CATEGORY_OPTIONS),
// not here. ETHOS C1.1/C1.3: nothing leaves the device through NC-750; the handoff
// opens the user's own mail client. C4.1: no account required. C7: the modal says
// "handed off to your mail client" — never "sent".

import type { FeedbackSubmission } from "../models";
import { CATEGORY_OPTIONS } from "../reference";
import { logger } from "../../logger";

// ── Recipient ─────────────────────────────────────────────────────────────────

const RECIPIENT = "support@nc-750.com";

// ── Typed error (CONVENTIONS 4.9 / 7.16) ─────────────────────────────────────

export class FeedbackError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FeedbackError";
    }
}

// ── Pure core ─────────────────────────────────────────────────────────────────

/**
 * Builds a pre-filled `mailto:` URI from a completed feedback submission.
 *
 * Pure — no side effects, no DOM access, fully unit-testable (CONVENTIONS 4.4).
 * The category→subjectPrefix mapping is sourced from CATEGORY_OPTIONS; nothing
 * is hardcoded in this function (master-plan placement note for Phase 3).
 *
 * @throws {FeedbackError} if the submission has no category (should not happen
 *   when called from submitFeedback, which guards first, but the function is
 *   defensive so it can be tested in isolation).
 */
export function composeMailtoUri(submission: FeedbackSubmission): string {
    const option = CATEGORY_OPTIONS.find((o) => o.value === submission.category);
    if (!option) {
        throw new FeedbackError("Cannot compose mailto: URI — no category selected.");
    }

    const subject = `${option.subjectPrefix}${submission.subject}`;
    const params = new URLSearchParams();
    params.set("subject", subject);
    params.set("body", submission.content);

    // URLSearchParams uses application/x-www-form-urlencoded encoding (spaces → +).
    // RFC 2368 mailto: expects percent-encoding. Replace + back with %20 so mail
    // clients receive clean text rather than literal plus signs.
    const encoded = params.toString().replace(/\+/g, "%20");
    return `mailto:${RECIPIENT}?${encoded}`;
}

// ── Imperative shell ──────────────────────────────────────────────────────────

/**
 * Validates the submission, composes the `mailto:` URI, and hands it off to the
 * OS mail client by assigning `window.location.href`.
 *
 * Returns `void` on success. On validation failure or a thrown handoff error logs
 * once and re-throws a `FeedbackError` so the view can catch and surface the
 * message (CONVENTIONS 7.16/7.17). The view must not double-log (7.18).
 *
 * `window.location.href` assignment is chosen over `window.open`:
 *   — reliable in both the Tauri WebView and the browser PWA,
 *   — no popup-block risk,
 *   — does not leave a blank about:blank tab (mailto: does not navigate the page).
 */
export function submitFeedback(submission: FeedbackSubmission): void {
    // Defence-in-depth guard — mirrors the validation in canSubmit but the service
    // does not trust the caller (CONVENTIONS 4.3).
    if (
        submission.category === undefined ||
        submission.email === "" ||
        !/^[^@]+@[^@]+$/.test(submission.email) ||
        submission.subject.trim() === "" ||
        submission.content.trim() === ""
    ) {
        const msg = "Cannot submit: feedback form is incomplete.";
        logger.error("feedback", msg);
        throw new FeedbackError(msg);
    }

    const uri = composeMailtoUri(submission);
    window.location.href = uri;
}
