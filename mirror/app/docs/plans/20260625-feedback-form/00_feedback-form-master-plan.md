---
created_at: 20260625
plan_slug: feedback-form
target: mirror/app
---

# Feedback Contact Form (NODE-0M) — Master Plan

## Context

The Mirror app currently exposes feedback only as a `mailto:support@nc-750.com` link in
the navigation bar (`src/App.vue`, line 48) and footer (line 55). The goal is to replace
that nav link with a real in-app feedback surface — a **modal**, not a page — that lets the
user submit bug reports or improvement ideas through a few fields (Category, Email, Subject,
Content), accompanied by explanatory text describing what kind of feedback will actually be
processed. The modal opens in place so the user is never pulled away from their current task
and cannot lose in-progress work (e.g. an interview). The category choice prefixes the
composed `mailto:` subject so feedback arriving at `support@nc-750.com` can be classified,
summarized, and counted **mail-side** — a recipient-side convenience only; nothing about the
category is recorded, counted, or transmitted on the user's device (no C2 telemetry). The form is a new layered feature folder
(`src/feedback/`) following the Mirror per-feature architecture, plus a nav entry point that
toggles the modal open. Both load-bearing forks — transport and surface — are now settled
(see Decisions locked); no DECISION NEEDED remains.

The app already has an overlay precedent: `settings/components/ActionStatusModal.vue` is a
`position: fixed`, viewport-anchored panel. Note the contrast that governs Phase 2 — that
panel is a **read-only monitor** (CONVENTIONS 7.6, hosts no input); the feedback modal is the
opposite, an input-hosting dialog, so it is built from **Cells, not a MonitorCell**, with a
focus trap, Escape-to-dismiss, and backdrop, per the Lab dialog contract.

## Decisions locked

- **Transport — `mailto:` handoff (Option A).** Submission composes a pre-filled `mailto:`
  URL from the Email/Subject/Content fields and hands off to the user's mail client. No
  NC-750 server, no transport/service-send/db/CSP layer. Strongest ethos fit: nothing leaves
  the device through NC-750 (C1.1/C1.3), no account (C4.1), `0x00` posture intact.
- **Surface — a modal, not a page.** Feedback is a modal/overlay opened in place, **not** a
  `/feedback` route or page. The user explicitly does not want to be navigated away from
  their current task or risk losing progress. No new router entry; the nav link toggles the
  modal.
- **Category — fixed three-item set, subject-prefix format.** The form carries a category
  selector with exactly three values — **Bug report**, **Suggestion**, **Other** — and the
  composed `mailto:` subject is prefixed per category:
  `Bug report → "[Mirror][Feedback - Bug Report]: <Subject>"`,
  `Suggestion → "[Mirror][Feedback - Suggestion]: <Subject>"`,
  `Other → "[Mirror][Feedback - Other]: <Subject>"`. The set and the prefix strings are
  settled; their exact placement (reference table vs. inline union, and where the prefix
  mapping lives) is a plan-time call, not a fork.

## Phases

### Phase 1 — Feedback domain model + submission factory + category reference set
- **Goal:** Establish the `src/feedback/` feature with its canonical domain model
  (the feedback submission: **category**, email, subject, content) and a total `createEmpty*`
  factory, on the real per-feature layering seam — no UI, no transport. The three categories
  (Bug report / Suggestion / Other) are a fixed lookup/reference set; whether they live in a
  `reference/` table (mirroring `settings/reference/Providers.ts`, the `PROVIDER_OPTIONS`
  precedent) or an inline union — and where the category→subject-prefix strings sit — is left
  to `nc-750-plan`.
- **Depends on:** —
- **Parallel-safe with:** Phase 4 (content/copy is disjoint from the model file)
- **Domain:** frontend
- **Doctrine likely cited:** `mirror/app/CONVENTIONS.md` §1 (1.1–1.3, 1.11 — one canonical
  domain model, total factory, honest fields), **1.2 / 6.10 (lookup/reference data is not a
  domain model — the providers/facets precedent)**; brand/ETHOS.md C1.1 (model holds user
  content, stays local by default).

### Phase 2 — Feedback modal component (fields + validation state)
- **Goal:** Build the feedback **modal** as a Lab-contract overlay dialog (backdrop +
  Cell-based panel, not a MonitorCell) hosting the **Category selector plus** Email / Subject /
  Content input fields with local form/validation state, an `open` prop and `close` emit,
  binding to the model from Phase 1 — with no submit/transport wired yet (button present but
  inert / TODO). *Plan-time fork for `nc-750-plan`: whether a category must be explicitly
  chosen (validation blocks until one is selected) or the selector defaults to one (e.g. "Bug
  report") — a validation-state call, not a decomposition fork.*
- **Depends on:** Phase 1
- **Parallel-safe with:** Phase 4 (modal scaffold vs. the explanatory copy it will host —
  serialize only if Phase 4's text lands inside this modal; see Phase 4 note)
- **Domain:** frontend
- **Doctrine likely cited:** `CONVENTIONS.md` §7 (7.2–7.7 Lab contract, **7.6 a monitor
  never hosts input** — this is a form, use Cells not MonitorCell), §2 (2.7 views render
  only); `lab/DESIGN.md`, `lab/DESIGN_USE.md`; `nc-750-frontend-presentation` (instrument
  stance; input lives in a Cell; modal/overlay dialog contract — backdrop, focus trap,
  Escape dismiss, `position: fixed` per the `ActionStatusModal.vue` precedent); ETHOS.md
  C8.3 (WCAG AA, keyboard-navigable form, focus management, reduced-motion).

### Phase 3 — Submission delivery via `mailto:` handoff
- **Goal:** Wire the inert "submit" action from Phase 2 to a service that composes a
  pre-filled `mailto:` URL (recipient `support@nc-750.com`, **subject prefixed by the selected
  category per the locked format**, Subject + Content from the fields, encoded) and hands off
  to the user's mail client; surface the handoff/validation state in the modal. No NC-750
  endpoint, no `feedback/db`, no CSP change. *Placement note for `nc-750-plan`: the
  category→prefix mapping belongs with the reference/model (alongside the category set), not
  hardcoded in the service.*
- **Depends on:** Phase 2
- **Parallel-safe with:** Phase 5 (delivery service vs. nav entry point touch disjoint
  areas; neither reads the other's output, once Phase 2 lands)
- **Domain:** frontend
- **Doctrine likely cited:** `CONVENTIONS.md` §4 (4.1–4.5 service owns the flow, functional
  core / imperative shell, 4.9 typed errors), §7 (7.16–7.19 error strategy per layer);
  brand/ETHOS.md C1.1/C1.3 (no NC-750 server, fully local handoff), C4.1 (no account).

### Phase 4 — Explanatory text: what feedback gets processed + honest disclosure
- **Goal:** Author the accompanying explanatory copy — what kinds of feedback are actually
  processed, and a plain-words statement that submitting opens the user's own mail client to
  send to `support@nc-750.com` (nothing is transmitted by the app itself) — placed inside the
  feedback modal.
- **Depends on:** the modal slot it fills depends on Phase 2 (placement). (The transport
  fork is now resolved, so the disclosure wording — the `mailto:` handoff — is fixed.)
- **Parallel-safe with:** Phase 1 (disjoint files). Authoring the copy can begin alongside
  Phase 1/2; **placement into the modal serializes after Phase 2.**
- **Domain:** content
- **Doctrine likely cited:** brand/ETHOS.md C1.3 (plain-words disclosure of what is sent and
  where), C7.2/C7.3/C7.5 (docs match shipped reality, over-disclose, claims literally true);
  brand/BRAND.md voice (pragmatic).

### Phase 5 — Navigation Bar entry point opens the modal
- **Goal:** Wire the existing "Feedback" link in the Navigation Bar (`src/App.vue`, line 48)
  to toggle the feedback modal open, replacing its current `mailto:support@nc-750.com`
  `href`; mount the Phase 2 modal in the App shell and bind its open/close state. No router
  change.
- **Depends on:** Phase 2 (the modal must exist to open)
- **Parallel-safe with:** Phase 3 (nav/shell wiring vs. delivery service; disjoint, neither
  reads the other's output, once Phase 2 lands)
- **Domain:** frontend
- **Doctrine likely cited:** `CONVENTIONS.md` §7 (7.2–7.7 Lab contract for the nav cell,
  7.12 replace the dead `mailto:` link rather than parking it); `nc-750-frontend-presentation`
  (nav reads as instrument navigation; the trigger control's open/close state). Note: the
  footer `mailto:support@nc-750.com` (App.vue line 55) is a separate "SUPPORT" link —
  leaving or removing it is a plan-time call for this phase, not a separate phase.

## Dependency graph

```
Phase 1 ─────────────► Phase 2 ─────► Phase 3
                         │
                         ├─────────► Phase 5
                         │
Phase 4 (author) ───────┘ (placement after Phase 2)
```

Explicit edges:
- Phase 1 → Phase 2
- Phase 2 → Phase 3
- Phase 2 → Phase 5
- Phase 4 → (placement) after Phase 2

*(The category field rides the existing P1→P2→P3 chain — model in P1, selector in P2,
subject-prefix in P3 — adding no new edges; the graph is unchanged and remains a DAG.)*

Parallelism (honest):
- **Phase 1 ∥ Phase 4 (authoring)** — disjoint: a model file vs. prose copy.
- **Phase 3 ∥ Phase 5** — both depend on Phase 2 but touch different areas (delivery service
  vs. nav/shell wiring) and neither reads the other's output, so they are honestly
  parallel-safe once Phase 2 lands.
- Everything else serializes.

## Deferred / out of scope

- **File / screenshot attachments on the feedback form** — the goal says "a few fields to
  start"; attachments are the most tempting "while we're in here" addition and are walled
  off. The fileManager already exists, which makes this tempting; resist it. (Also, a
  `mailto:` handoff cannot carry attachments at all.)
- **Extra fields / severity beyond the locked category set** — the form scopes to Category +
  Email/Subject/Content; no severity slider, no additional metadata fields. (Categorization
  itself is now in scope — see Decisions locked.)
- **A feedback inbox, triage, or admin view inside the app** — feedback delivery is one-way
  out; no in-app management surface.
- **Telemetry on form usage** — no counting of submissions or modal opens (would invoke
  C2); explicitly not added.
- **A reusable shared form/error-presentation Cell** — CONVENTIONS lists "a shared
  error-presentation Cell/Band" as still-to-decide; this feature uses local error state and
  does not pre-build a shared abstraction.
- **Removing/redesigning the footer SUPPORT `mailto:` link** — left as-is unless Phase 5's
  plan decides to consolidate it; not a goal of this initiative.
- **Local persistence of submissions / send endpoint / CSP work** — moot under the locked
  `mailto:` transport: no `feedback/db`, no NC-750 endpoint, no spam/rate-limit/captcha, no
  CSP pin. Walled off unless transport is ever revisited.
