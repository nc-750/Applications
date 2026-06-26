---
created_at: 20260626
plan_slug: feedback-form
phase: 4
target: mirror/app
---

# Phase 4 — Explanatory text: what feedback gets processed + honest disclosure

## Placement decision — resolved: Option A

The modal (`src/feedback/components/FeedbackModalCell.vue`, line 224) exposes a named
slot `<slot name="disclosure" />` already wired into the panel above the `<Form>`. Phase 4
fills it via a dedicated `FeedbackDisclosureCell.vue` in `src/feedback/components/` (Option A).

Three options were considered; A was chosen because it is the only one that produces a
concrete, independently testable artifact Phase 5 can mount without both phases landing
together. Option B leaves Phase 4 with no shippable file; Option C discards the slot the
Phase-2 author deliberately left and edits an already-committed component.

> **Phase 5 note (not this phase's work):** Phase 5 will import `FeedbackDisclosureCell` and
> pass it into the `#disclosure` slot when it mounts the modal in `App.vue`. Phase 4 ships the
> cell and does **not** touch `App.vue` or the modal — wiring the slot is Phase 5's edge.

---

## Goal

Author the feedback modal's disclosure copy — (1) what kinds of feedback are useful/processed,
and (2) a plain-words statement that submitting opens the user's *own* mail client to send to
`support@nc-750.com`, and that the Mirror app itself transmits nothing — and ship it as a
content-only Lab Cell (`FeedbackDisclosureCell.vue`) that fills the modal's existing
`#disclosure` slot. The wording must be literally true against the locked `mailto:` transport
(Phase 3): no "we receive", no "sent", no server.

## In scope

- Create `src/feedback/components/FeedbackDisclosureCell.vue`: a presentational, prop-less,
  emit-less Vue SFC (`<script setup lang="ts">`) whose template is a small content region (a
  Lab `Cell` from `@nc-750/lab-vue`, or a plain `div` using `.nc-*` text classes — the
  builder's call within the Lab contract) rendering the disclosure copy below. No inputs, no
  reactive state, no logic.
- The literal copy (see **Disclosure copy** below) — two short blocks: a "what's useful"
  line and a transport-disclosure line, in the pragmatic NC-750 voice.
- The recipient address shown in the copy is `support@nc-750.com`, matching
  `RECIPIENT` in `FeedbackService.ts` (line 18) and the master plan.

## Out of scope (the wall)

- **Mounting the cell / editing `App.vue` or `FeedbackModalCell.vue`.** The most tempting
  overreach is to "just wire it in while I'm here." That is Phase 5's edge (it owns the modal
  mount and the `#disclosure` slot fill). Phase 4 ships the cell and the modal slot stays
  empty until Phase 5 lands. Do not remove or edit the slot.
- **Any transport, service, validation, or model change.** Phase 4 is content only; it reads
  no draft, calls no service, adds no field.
- **A reusable/generic disclosure or banner abstraction.** This is one feature-local cell, not
  a shared component (master plan "Deferred").
- **Touching the footer/nav `mailto:` links** (App.vue lines 48/55) — Phase 5's call.
- **Regenerating or asserting CSP `connect-src`** — moot under `mailto:` (master plan).

## Doctrine cited

- **brand/ETHOS.md C1.3** — plain-words disclosure: name exactly what data goes where and
  why. The copy states the destination (`support@nc-750.com`) and that the path is fully
  local (the user's own mail client; the app transmits nothing).
- **brand/ETHOS.md C7.3** — over-disclose: publish what is sent, where, and why.
- **brand/ETHOS.md C7.2 / C7.5** — claims literally true; copy matches shipped reality. The
  wording must not assert the *app* sends anything or that NC-750 "receives" it as a server;
  the only true claim is the mail-client handoff. Mirrors the modal's existing honest
  "Handed off to your mail client" (FeedbackModalCell line 279) — never "sent".
- **brand/BRAND.md voice** — pragmatic, technical, free of marketing softening; short, direct.
- **CONVENTIONS.md §7** — Lab contract: content-only cell, no input in a monitor cavity (the
  cell hosts no input, so this is trivially satisfied). **§2.7** — view renders; copy is
  composed into the modal via the slot, not authored inside the rendering component.

## Disclosure copy (the literal text to ship)

The cell renders these two blocks. Exact wording is load-bearing (it is what the ethos gate
checks), so it is specified verbatim; the builder owns only the markup/Lab styling around it.

Block 1 — what's useful (a heading-ish label + one line):
> **What helps most:** a clear description of the bug or the idea, and the steps that led to
> it. The more concrete, the more useful.

Block 2 — transport disclosure (the C1.3/C7 statement):
> Sending opens your own email app with a pre-filled message to support@nc-750.com. Mirror
> does not transmit anything itself, and keeps no copy. You review and send the email from
> your own mail client.

Wording constraints the builder must preserve (these are the ethos-critical invariants, not
style suggestions):
- Names the destination address `support@nc-750.com` in plain text.
- States the app/Mirror transmits nothing itself (local-path, C1.3).
- Uses "opens your own email/mail app" framing — never "we send", "we receive", "message
  sent", or "email sent".
- No telemetry/tracking claims of any kind (there are none to disclose; C2 is satisfied by
  silence — do not invent a "we don't track you" line that overstates a guarantee, keep to
  what the transport actually does).

## Tests-as-descriptions

Static copy is mostly not worth unit-testing — asserting that a sentence equals itself only
pins the string and catches no real bug. But two invariants are *behavioral guarantees the
ethos depends on*, and a regression in either would silently ship a false or incomplete
disclosure. Those, and only those, are worth a test. Add them to a new
`src/__tests__/feedback/FeedbackDisclosure.test.ts` (mount idiom mirrors
`FeedbackModal.test.ts`).

1. **Discloses the real destination.** Mounting `FeedbackDisclosureCell` renders text
   containing `support@nc-750.com`. *Bug it catches:* the address drifts from the service's
   `RECIPIENT` (or is dropped), leaving the user with no disclosure of where feedback goes —
   a C1.3 violation. (Right expectation: the literal recipient, not "some email".)

2. **Never claims the app sends or that the message was sent.** The rendered text contains a
   local-handoff phrase (e.g. "your own email" / "your own mail client") and does **not**
   contain the false-claim substrings "message sent" or "email sent" (case-insensitive), nor
   assert the app itself transmits. *Bug it catches:* copy is edited into a "your feedback has
   been sent" style false guarantee — a C7.2/C7.5 violation, the exact failure the modal's
   ack text was written to avoid.

Not tested (deliberately): exact prose of Block 1, heading text, Lab class names, styling,
ordering — these are presentation the builder may adjust without breaking the disclosure
contract, so pinning them would be brittle and coverage-only. The phase introduces no logic,
no props, no state, and no failure mode beyond the two disclosure invariants above; there is
nothing further with a real bug behind it to assert.

## Deliverable

- New: `src/feedback/components/FeedbackDisclosureCell.vue` — content-only Lab cell with the
  two copy blocks above; no props, no emits, no logic.
- New: `src/__tests__/feedback/FeedbackDisclosure.test.ts` — the two disclosure-invariant
  tests above.
- Optional: if `src/feedback/components/` gains a barrel as part of this work, export the new
  cell there; otherwise none is required (Phase 5 can import the SFC directly). No edit to
  `FeedbackModalCell.vue`, `App.vue`, the service, the model, or the reference table.

## Verify

Phase gate:
- `bunx vue-tsc --noEmit` passes for the new `.vue` cell and test (vue-tsc, not bare `tsc`,
  because the deliverable is an SFC) — no NEW type errors attributable to the touched files,
  judged per-file against the implementer's red baseline established at build time.
- `bun run test src/__tests__/feedback/FeedbackDisclosure.test.ts` — the two new tests pass;
  report the exact count. The existing `FeedbackModal.test.ts` (10 tests) and other feedback
  tests remain green and untouched.

Global gate (env-and-verify):
- `bun` only; no npm/npx/node.
- No new `console.log`, no dead code, no silent stub left in the cell.
- Dependency direction holds: the cell imports only the Lab design system (`@nc-750/lab-vue`)
  and, if used, the reference for the address — it reaches up into no store/service/view and
  introduces no new upward edge. (It does not import `FeedbackService`; the recipient string
  is duplicated as display copy, which is acceptable for a literal disclosure sentence —
  importing a service into a presentational cell would be the worse violation.)
- Out-of-scope boundary respected: `App.vue`, `FeedbackModalCell.vue`, the service, model, and
  reference table are unchanged; the `#disclosure` slot remains empty in the committed modal.
- Claims literally true: rendered copy names `support@nc-750.com`, states the app transmits
  nothing, and makes no "sent" claim (C1.3 / C7.2 / C7.5).
