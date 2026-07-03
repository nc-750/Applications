---
created_at: 20260626
plan_slug: feedback-form
phase: 3
target: mirror/app
---

# Phase 3 — Submission delivery via `mailto:` handoff

## Grounding (what exists now vs. what this phase adds)

- `src/feedback/models/FeedbackSubmission.ts` — `FeedbackSubmission { category: FeedbackCategory | undefined; email; subject; content }` + `createEmptyFeedbackSubmission()`. (exists)
- `src/feedback/reference/Categories.ts` — `FeedbackCategory` union, `CategoryOption { value; label; subjectPrefix }`, `CATEGORY_OPTIONS` readonly array; `subjectPrefix` already holds the locked bracket strings. (exists)
- `src/feedback/components/FeedbackModalCell.vue` — full dialog; `onSubmit()` is the inert no-op placeholder with a TODO pointing at Phase 3; `draft` is a local `reactive<FeedbackSubmission>`; `canSubmit` computed; `categoryBridge` keeps `draft.category` as `FeedbackCategory | undefined`. (exists)
- `src/__tests__/feedback/FeedbackModal.test.ts` — 9 tests. **Test 5 pins the Phase-2 inert behaviour and will be falsified by this phase.** It must be deleted-and-replaced (CONVENTIONS 8.3).
- `src/settings/services/SettingsService.ts` — service-layer precedent: plain function module, logs once + throws a typed error on failure, no `Result` propagated up (4.9/4.10/7.16).
- **Does NOT exist yet (to be created):** `src/feedback/services/` (no folder).

## Goal

Make the feedback modal's submit action actually hand off the composed feedback to the user's mail client. A new feedback **service** composes a `mailto:` URI — recipient `support@nc-750.com`, subject = the selected category's `subjectPrefix` + the user's Subject, body = the user's Content (all URI-encoded) — and performs the handoff. The modal calls the service on submit and surfaces honest handoff/error state. Nothing is persisted, no NC-750 endpoint is contacted, no CSP changes.

## In scope

1. **New `src/feedback/services/FeedbackService.ts`** (plain function module, 4.2), structured as functional core + imperative shell (4.3):
   - **Pure core — `composeMailtoUri(submission: FeedbackSubmission): string`**: builds the `mailto:` URI from a `FeedbackSubmission`. Resolves the category's `subjectPrefix` from `CATEGORY_OPTIONS` (the mapping lives in reference, never hardcoded in the service). Prefixes the user's Subject. URI-encodes subject and body via `encodeURIComponent`. Assembles `mailto:support@nc-750.com?subject=...&body=...`. Pure, no side effects, no DOM, fully unit-testable (4.4). Recipient `support@nc-750.com` is a module-level constant in this service.
   - **Imperative shell — `submitFeedback(submission: FeedbackSubmission): void`**: guards that `category` is set and required text fields are non-empty (defence-in-depth behind the modal's `canSubmit`). Calls `composeMailtoUri`, then assigns `window.location.href`. On a thrown/failed handoff logs once via the project logger and throws a typed `FeedbackError` (4.9/7.16). Returns `void` on success.
2. **`FeedbackError extends Error`** co-located in the service module. Carries a human-readable message the view surfaces. No sentinel returns (7.19).
3. **New barrel `src/feedback/services/index.ts`** re-exporting `submitFeedback`, `composeMailtoUri`, `FeedbackError`.
4. **Wire `FeedbackModalCell.vue`'s `onSubmit`**: replace the inert no-op body. Two local refs — `submitError: Ref<string | null>` and `handoffAck: Ref<boolean>`. `onSubmit` calls `submitFeedback(toRaw(draft))`; on `FeedbackError` sets `submitError.value`; on success sets `handoffAck.value = true`. Does not emit `close` on either path (failure keeps modal open for retry; success leaves mail client in foreground).
5. **Handoff acknowledgment + error state in the modal**: `submitError` renders as plain error text; `handoffAck` renders "Handed off to your mail client." — honest about what happened, never "sent" (ETHOS C7/C1.3).

## Out of scope (the wall)

- **No `feedback/db`, no `feedback/store`, no persistence.** Tempting — resist. Ephemeral by design.
- **No NC-750 send endpoint, no HTTP, no CSP change, no retry/queue.**
- **No "message sent" success claim.** The OS gives no callback; "sent" would be a false claim (ETHOS C7).
- **No reusable shared error-presentation Cell/Band.** Master plan deferred; use local error state only.
- **No changes to nav/footer `mailto:` links in `App.vue`.** That is Phase 5.
- **No new disclosure/explanatory copy.** That is Phase 4.
- **No clipboard-copy fallback or "mail client didn't open?" recovery flow.** Follow-up, not this phase.
- **No attachments** (`mailto:` cannot carry them anyway).
- **No telemetry / counting of submits or category selections** (ETHOS C2).

## Doctrine cited

- `CONVENTIONS.md` §4 — 4.1 (`<feature>/services/`), 4.2 (plain function module), 4.3/4.4 (functional core / imperative shell; pure helpers take explicit args), 4.9 (throw typed errors, no sentinels).
- `CONVENTIONS.md` §7 error strategy — 7.16 (service logs once + throws typed error), 7.17 (view catches into reactive error state), 7.18 (view does not double-log), 7.19 (one function, one strategy).
- `CONVENTIONS.md` §2 — 2.4/2.7 (behavior in service; view calls service, holds no app logic).
- `CONVENTIONS.md` §8 — 8.2 (`.vue` touched ⇒ `vue-tsc`), 8.3 (replace pre-convention Test 5, don't appease it).
- `CONVENTIONS.md` §6 — 6.6 (`onSubmit` handler naming kept), 6.10 (category→prefix mapping stays in `reference/`).
- `brand/ETHOS.md` — C1.1/C1.3 (no NC-750 server; fully local handoff; plain-words about what happens), C4.1 (no account), C7 (claims literally true — "handed off", never "sent").

## Decisions resolved

- **(1) Handoff mechanism — `window.location.href`** over `window.open`. Reliable in Tauri WebView and PWA without popup-block risk or a blank `about:blank` tab.
- **(2) Surfaced state — handoff acknowledgment + error only; no loading spinner.** The assignment is synchronous; the OS gives no callback; a spinner would be dishonest about the flow.
- **(3) Service return type — `void` + throw `FeedbackError`** over `Result`. Matches `SettingsService` precedent (4.9/7.16/4.10).

## Tests-as-descriptions

**`src/__tests__/feedback/FeedbackService.test.ts`** (6 new tests):

Pure-core (`composeMailtoUri`):
1. **Subject carries the selected category's locked prefix.** Given `category: "bug_report"` + subject "Crash on save", decoded subject equals `[Mirror][Feedback - Bug Report]: Crash on save`. Repeat for `"suggestion"` to prove table-driven, not a single hardcoded string. Catches wrong/missing prefix and drift from the reference table.
2. **Recipient is `support@nc-750.com`.** Composed URI starts with `mailto:support@nc-750.com?`. Catches a typo'd recipient.
3. **Subject and body are URI-encoded.** Given subject/content containing `&`, spaces, and a newline, the URI query components are percent-encoded such that decoding returns the originals. Catches unencoded chars corrupting the mail client's subject/body.
4. **Body is the user's Content; subject does not leak body.** Decoded `body` equals `submission.content`; decoded `subject` contains only prefix + subject. Catches field-mapping swap.

Imperative shell (`submitFeedback`) — `window.location` seam stubbed:
5. **Valid submission performs exactly one handoff to the composed URI.** Assigns `window.location.href` once to the value `composeMailtoUri` would produce. Catches a no-op submit and a double-handoff.
6. **Incomplete submission (undefined category) throws `FeedbackError`, no handoff.** `submitFeedback` throws `FeedbackError`; the handoff seam is never touched. Catches the service trusting the caller; proves defence-in-depth behind `canSubmit`.

**`src/__tests__/feedback/FeedbackModal.test.ts`** — amend:
- **Delete Test 5** (pins Phase-2 inert behavior — now false; CONVENTIONS 8.3).
- Add tests 7–9 (suite count stays at 11):

7. **Activating submit on a valid draft invokes the delivery path.** With the handoff seam stubbed, filling the form valid and clicking submit causes exactly one handoff with the expected recipient + prefixed subject. Catches the wiring left inert.
8. **A failed handoff surfaces an error in the modal and does not close it.** With the service made to throw `FeedbackError`, submitting shows the local error message and emits no `close`. Catches a swallowed error (7.17) and incorrect close-on-failure.
9. **A successful handoff shows the honest acknowledgment, not a "sent" claim, and does not close.** After a stubbed-successful submit, the modal shows the handoff acknowledgment text and emits no `close`. Catches a false "message sent" claim (ETHOS C7) and over-eager auto-close.

Note: tests assert up to the `window.location.href` assignment seam — the OS mail client opening is unobservable (mirrors the Test-9 focus-on-open honesty caveat already in the suite).

## Deliverable

- New `src/feedback/services/FeedbackService.ts`
- New `src/feedback/services/index.ts`
- Edited `src/feedback/components/FeedbackModalCell.vue`
- New `src/__tests__/feedback/FeedbackService.test.ts`
- Edited `src/__tests__/feedback/FeedbackModal.test.ts`

Not touched: `App.vue`, router, `Database.ts`, Phase-1 model/reference files.

## Verify

Phase gate:
- `bunx vue-tsc --noEmit` — no NEW type errors per touched file vs. the standing red baseline.
- `bun run test` — modal suite 11 passing (8 survivors + 3 new after removing Test 5); service suite 6 passing.

Global gate:
- `bun`/`bunx` only (never npm/npx/node).
- No new `console.log`, no dead code, no parked TODO (Phase-2 `onSubmit` TODO is replaced, not parked).
- Dependency direction holds: service → reference/model + logger; view → service; no upward edge.
- Out-of-scope wall respected: no db/store/endpoint/CSP/nav/disclosure-copy changes.
- Claims literally true: modal says "Handed off to your mail client.", never "sent".
