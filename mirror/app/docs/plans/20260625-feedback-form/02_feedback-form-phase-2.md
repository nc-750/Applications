---
created_at: 20260625
plan_slug: feedback-form
phase: 2
target: mirror/app
---

# Phase 2 — Feedback modal component (fields + validation state)

- **Goal** — Build the feedback **modal** as a Lab-contract overlay dialog: a `position: fixed`
  backdrop plus a **Cell-based** panel (input-hosting, so a `Cell`, never a `MonitorCell` —
  CONVENTIONS 7.6) that hosts a **Category selector populated from `CATEGORY_OPTIONS`** plus
  **Email / Subject / Content** input fields, with local form + validation state, an `open` prop
  and a `close` emit, binding to the Phase-1 model. The submit control is present but **inert** — it
  performs no `mailto:` composition and dispatches nothing. The dialog honors the Lab dialog
  contract (backdrop, focus management/trap, Escape-to-dismiss, backdrop-click-to-dismiss) and the
  C8.3 accessibility expectations (keyboard-navigable, focus on appearance, reduced-motion-gated
  entrance, never colour-only state). No transport, no nav wiring, no persistence.

- **In scope** —
  1. **`src/feedback/components/FeedbackModalCell.vue`** (greenfield; the feedback feature has no
     `components/` folder yet — confirmed by glob) — the input-hosting overlay dialog.
     - **Shell / overlay.** A `v-if="open"` root that renders a full-viewport **backdrop**
       (`position: fixed`, covering the viewport, beneath the panel) and, above it, a **panel built
       from the Lab `Cell`** component (the light, input-bearing surface — *not* `nc-monitor` /
       `MonitorCell`, which 7.6 forbids from hosting input). Reuse the `position: fixed`,
       z-indexed, reduced-motion-gated entrance pattern established by
       `src/settings/components/ActionStatusModal.vue` (its `.asm-panel` style block and its
       `@media (prefers-reduced-motion: no-preference)` gate are the precedent to mirror) — but
       this surface is the *opposite* role: it hosts input, so it is centered/modal (not a
       corner toast) and it traps focus rather than merely receiving it.
     - **Props / emits (props-down / events-up, CONVENTIONS 2.7 — the view renders, the parent
       owns open/close state).** One prop: `open: boolean`. One emit: `close` (no payload). The
       inert submit does **not** emit anything that a parent could route to transport — see the
       Out-of-scope wall. Per **Decision A** (resolved), the modal owns the draft locally; the
       parent passes only `open` and receives only `close`.
     - **Fields.** Inside the panel `Cell`, a Lab `Form` containing:
       - a **category selector** — a raw `<select class="nc-select">` whose options are rendered
         by iterating `CATEGORY_OPTIONS` (`opt.value` → option value, `opt.label` → option text),
         with a disabled placeholder option for the unchosen state, mirroring the provider-select
         pattern in `LLMConfigCell.vue` (lines 109–114). Use the raw `<select class="nc-select">`,
         **not** the Lab `Select` component: `Select` renders a stray empty `<span>` and exposes
         only a default slot, which makes the disabled-placeholder + `v-for` over `CATEGORY_OPTIONS`
         idiom harder, not easier — `LLMConfigCell`'s raw-select precedent is the one to follow.
         The category set is **never re-declared** in this component — it is read from the Phase-1
         reference table.
         - **Undefined-valued v-model binding (Decision B — category stays
           `FeedbackCategory | undefined`).** The selector is bound to a draft field typed strictly
           `FeedbackCategory | undefined`; do **not** coerce it to a `""` sentinel the way
           `LLMConfigCell` does for `provider` (line 110), because the validation rule below tests
           `category !== undefined` and a `""` would defeat it. So the placeholder option must
           reconcile an `undefined` v-model and still show selected at rest. The builder picks one
           honest binding: a placeholder `<option :value="undefined" disabled>Choose a category…`
           that the `undefined`-valued v-model selects at rest, **or** a small computed bridge that
           maps `undefined ↔ ""` only at the DOM-select boundary while the draft field itself stays
           `FeedbackCategory | undefined`. Either way the stored value is never `""`.
       - an **Email** field rendered as a **raw `<input class="nc-input" type="email">`**, bound to
         `draft.email` — *not* a Lab `TextField`. Grounding: the Lab `TextField` prop union is
         `type: "text" | "url" | "tel" | "password"` (`lab/vue/src/components/TextField.vue`
         line 7), so `<TextField type="email">` is a `vue-tsc` error and would fail this phase's own
         Verify line. The precedent for an off-union input type is `LLMConfigCell.vue` lines
         122–127, which renders a raw `<input class="nc-input" type="url">` for the same reason.
       - a **Subject** field rendered as a Lab `TextField type="text"` (in-union, so the Lab
         component is fine here), bound to `draft.subject`.
       - a **Content** field rendered as the Lab `Textarea` (multi-line), bound to `draft.content`.
       - Each field wrapped in a `FormField` with a label, per the `LLMConfigCell` precedent.
     - **Local form state + validation.** A local draft seeded from
       `createEmptyFeedbackSubmission()` (Phase 1), holding `category | undefined`, `email`,
       `subject`, `content`. A computed **`canSubmit`** that is true only when the form is valid;
       validation rules (per **Decision B**, resolved):
       - **category** must be chosen (not `undefined`),
       - **email** non-empty and containing a minimal `local@domain` shape (an `@` with text
         either side — Decision B; honest, not a heavy regex),
       - **subject** non-empty (after trim),
       - **content** non-empty (after trim).
       Validation drives only **state** (the submit control's enabled/disabled state and any
       per-field invalid indication); it does **not** dispatch. The provider-0-style "explicit
       `!== ""` not falsy" guard from `LLMConfigCell` (lines 33, 52) is the precedent for honest
       emptiness checks; `category` uses an explicit `!== undefined` check (the model's optional is
       `undefined`, never `""`).
     - **Inert submit.** A submit `Button` (`submit` / accent variant) bound `:disabled="!canSubmit"`.
       Its click/submit handler is wired to a **named no-op placeholder** whose body is an explicit
       prose-commented TODO pointing at **Phase 3** (the `mailto:` composition + handoff). It must
       not compose a URL, must not call `window.location`/`mailto:`, must not emit a "submit"/"send"
       event, and must not mutate anything outside the local draft. A reader must see at a glance
       that pressing it does nothing yet **by design**.
     - **Close paths (all emit `close`).** (a) an explicit close control (a real keyboard-operable
       `<button>`, e.g. an "✕"/"Cancel"), (b) **Escape** keydown while the dialog is open and
       dismissible, (c) a **backdrop click** (clicking the backdrop region, not the panel). Closing
       does not clear the user's in-progress draft as an incidental side effect; per Decision A the
       local-owned draft resets on the next open — the modal must not *silently destroy* typed
       content on an incidental close.
     - **Accessibility (ETHOS C8.3).** `role="dialog"` + `aria-modal="true"` on the panel; an
       accessible name (`aria-labelledby` pointing at the panel/Cell title, or `aria-label`);
       **focus moves into the panel on open** (first focusable field or the panel itself) and a
       **focus trap** keeps Tab/Shift-Tab cycling within the panel while open (the contrast with
       `ActionStatusModal`, which only *receives* focus — a form must *trap* it); Escape closes;
       state is never colour-only (invalid fields carry a text/aria cue, not just colour); the
       entrance animation is gated by `prefers-reduced-motion` exactly as `.asm-panel` is.
     - **Naming.** `FeedbackModalCell.vue` — suffixed by its Lab root (`Cell`), per the Lab
       naming rule (CONVENTIONS 7.x; `nc-750-frontend-presentation` naming-after-Lab-root). It is a
       feature Cell under `feedback/components/`, the house location for feature Cells/Bands.
  2. **`src/feedback/components/index.ts`** (greenfield barrel) — re-exports
     `./FeedbackModalCell`, mirroring `src/feedback/models/index.ts` /
     `src/feedback/reference/index.ts`. (Phase 5 will import the modal from here to mount it.)
  3. **One component test file `src/__tests__/feedback/FeedbackModal.test.ts`** — mounts the
     component with `@vue/test-utils` `mount`, mirroring the established component-test pattern in
     `src/__tests__/settings/SettingsPage.test.ts` (same `mount` + `findComponent` + `trigger`
     idiom). The 9 descriptions below map **1:1 to 9 `it()` blocks** — one assertion focus each.
     See Tests-as-descriptions.

  **Component-internal state decision (mine, not a user fork):** the form draft is held as a
  **local `reactive` draft seeded from `createEmptyFeedbackSubmission()`**, exactly as
  `LLMConfigCell.vue` holds a local `reactive` draft (lines 34–39) rather than a store. Rationale:
  the feedback submission is **never persisted** (locked `mailto:` transport — a db-backed store is
  forbidden, and Phase 1 already walls off `feedback/db`/`feedback/stores`), and a single ephemeral
  form that lives and dies with one modal does not need cross-component shared reactive state. The
  in-repo precedent for an input Cell with local validation state is `LLMConfigCell`, which uses a
  local draft and emits — no store. (Phase 1's model comments and the master plan *anticipated* a
  `feedback/stores` reactive store; per **Decision A** (resolved with the user) this phase does
  **not** introduce one — local component state is the chosen pattern.)

- **Out of scope** (the wall) —
  - **No `mailto:` / no transport / no send — THIS IS THE MOST TEMPTING OVERREACH.** A diligent
    builder will want to "just wire the submit while the form is right here." Forbidden: that is
    **Phase 3**. The submit button is inert; it composes no URL, opens no mail client, emits no
    send/submit event, and calls no service. No `feedback/services/`, no subject composition, no
    use of `CategoryOption.subjectPrefix` (Phase 3 reads it — this phase does not).
  - **No nav wiring / no `App.vue` change / no mounting the modal anywhere — that is Phase 5.** This
    phase delivers the component and its barrel only; it does not mount it in the App shell, does
    not touch the `mailto:` links at `App.vue` lines 48/55, and adds no router entry. The `open`
    prop is exercised by the test harness, not by a real trigger.
  - **No explanatory copy authoring — that is Phase 4.** This phase may leave a **named, empty slot
    or clearly-labelled placeholder region** inside the panel where Phase 4's disclosure copy will
    land, but it authors **no** "what gets processed" / "this opens your mail client" wording. A
    placeholder must not assert anything about transport (no premature disclosure claim).
  - **No persistence / no db / no store db-commit.** No `feedback/db`, no `Database.ts` schema
    change, no write of the draft anywhere. (Per Decision A the draft is local component state —
    no store at all, in-memory or otherwise.)
  - **No new shared/abstracted modal or form-error Cell.** Build the one feedback dialog; do not
    extract a reusable `<Modal>`/`<Overlay>` or a shared error-presentation Cell (the master plan
    walls this off). If a tiny local overlay style is needed, it lives in this component's scoped
    style, mirroring `ActionStatusModal`'s scoped `.asm-*` block.
  - **No Zod / boundary schema.** Form fields are internal typed-in input, not an untrusted external
    boundary (CONVENTIONS 1.9); validation here is plain computed state, not schema parsing.
  - **No telemetry.** No counting of opens, submits, or category selections (ETHOS C2).
  - **No draft-reset-on-reopen test.** Per Decision A the local draft resets on the next open, but
    this phase has **no real open/close trigger** (mounting is Phase 5); a reset-on-reopen assertion
    has nothing honest to drive it until then, so it is intentionally **not** tested this phase.

- **Doctrine cited** —
  - `mirror/app/CONVENTIONS.md` §7: 7.2–7.7 (Lab visual contract — Chassis/Band/Cell, the panel is
    a `Cell`), **7.6 (a monitor never hosts input — this is a form, so a `Cell`, not a
    `MonitorCell`)**; §2: 2.7 (views render and emit only — open/close state is the parent's, props
    down / events up). Naming a feature component after its Lab root (`*ModalCell`).
  - `nc-750-frontend-presentation` (web): the instrument stance, input-lives-on-a-light-Cell (never
    in a monitor cavity), and the overlay/dialog contract — backdrop, focus trap, Escape dismiss,
    `position: fixed`, reduced-motion-gated entrance — with `ActionStatusModal.vue` as the in-repo
    `position: fixed` precedent (note: that one is read-only; this one hosts input and traps focus).
  - `lab/DESIGN.md`, `lab/DESIGN_USE.md` (Cell vs MonitorCell; which `.nc-*` class for select /
    input / textarea / button vs Tailwind layout utilities — `.nc-select`/`.nc-input` and the Lab
    `Form`/`FormField`/`TextField`/`Textarea`/`Button` components, with Tailwind only for layout,
    per `CLAUDE.md`). Note the `TextField` type union is `text | url | tel | password`
    (`lab/vue/src/components/TextField.vue` line 7) — `email` is off-union, hence the raw
    `<input type="email">` for the Email field.
  - `brand/ETHOS.md` C8.3 (WCAG AA: keyboard-navigable form, focus management/trap on a modal,
    reduced-motion, never colour-only state); C2 (no telemetry — nothing counts the form); C1.1
    (the draft holds user-authored content and stays local — never transmitted or persisted in this
    phase).

- **Tests-as-descriptions** (vitest + `@vue/test-utils` `mount`; repo runs `bun run test`; mirror
  the `src/__tests__/settings/SettingsPage.test.ts` `mount`/`findComponent`/`trigger` shape; the 9
  descriptions are 9 `it()` blocks) —
  1. **The panel hosts input on a Cell, not a monitor (7.6 guard).** When mounted with `open: true`,
     the dialog renders the category `<select>` and the email / subject / content input controls,
     and the panel root is **not** an `nc-monitor`/`MonitorCell` surface. *Catches: a regression
     that builds the input surface as a monitor cavity (violating 7.6), or drops a field.*
  2. **The category selector is populated from the reference table, not re-declared.** The rendered
     category options correspond exactly to `CATEGORY_OPTIONS` — three options whose values are the
     three locked category values and whose visible text is each row's `label`, plus the disabled
     unchosen placeholder. *Catches: a hardcoded/divergent category list, a dropped or renamed
     option, or labels that don't track the reference data — the locked set must come from Phase 1.*
  3. **Submit is gated until the form is valid.** With a freshly opened modal (empty draft, category
     unchosen), the submit control is disabled; after a valid category is selected and email /
     subject / content are filled with valid values, the submit control becomes enabled. *Catches:
     a submit that is always enabled (would let an empty/categoryless submission through in Phase 3)
     or never enables.*
  4. **An unchosen category blocks submit (the resolved required-category rule).** With email,
     subject, and content all valid but **no category chosen**, the submit control stays disabled.
     *Catches: a default-selected category sneaking in (contradicting Phase 1's `category:
     undefined` factory and Decision B), or category being treated as optional.*
  5. **The inert submit dispatches nothing.** Filling the form to a valid state and activating the
     submit control does **not** emit any send/submit-style event, does **not** call any
     `mailto:`/navigation API, and does **not** mutate anything observable beyond the local draft.
     (Assert via: no emitted transport event; if the build spies on `window.location`/`open`, it is
     never invoked.) *Catches: Phase 3 work leaking forward — the single most likely overreach.*
  6. **Escape closes the open dialog (emits `close`).** With `open: true`, an Escape keydown on the
     panel emits exactly one `close` event. *Catches: a missing/incorrect Escape handler — a Lab
     dialog-contract requirement, and the C8.3 keyboard-dismiss path.*
  7. **A backdrop click closes the dialog (emits `close`); a panel click does not.** Clicking the
     backdrop region emits `close`; clicking inside the panel (e.g. focusing a field) does **not**
     emit `close`. *Catches: a backdrop that swallows all clicks (can never dismiss) or one that
     closes on every interior click (would discard the user's in-progress feedback on a stray
     click) — the exact misbehavior the modal-over-page decision exists to prevent.*
  8. **Closed at rest renders nothing.** With `open: false`, the dialog (backdrop + panel) is absent
     from the DOM — no false overlay before it is opened. *Catches: a modal that renders its
     backdrop/panel while closed, blocking the underlying UI (mirrors the `SettingsPage.test.ts`
     "closed at rest" invariant).*
  9. **The dialog is structurally focus-managed and announced (C8.3 — honest to jsdom).** When
     opened, the panel carries `role="dialog"` + `aria-modal="true"`, an accessible name
     (`aria-label`/`aria-labelledby`), a focusable target (`tabindex`/a focusable first field), and
     the focus-on-open wiring is present. **jsdom + `@vue/test-utils` cannot honestly assert
     `document.activeElement` for focus-on-open** — the focus is moved on the next tick (the
     `ActionStatusModal` precedent uses `setTimeout(…, 0)`), so a bare `mount` cannot observe it.
     The test therefore asserts the **structural prerequisites** above (role, aria-modal, accessible
     name, the focus-moving wiring exists) and states plainly that activeElement is not asserted in
     jsdom. *(If the builder prefers, it may instead `mount(..., { attachTo: document.body })`,
     flush the focus timer, and then assert `document.activeElement` is inside the panel — but it
     must pick one and not claim more than it actually runs.)* *Catches: an unlabelled or
     un-focus-managed modal that strands keyboard/AT users — a binding C8.3 requirement, not a
     framework guarantee.*

  (No test asserts that `reactive`/`v-model` two-way binding works, that a `readonly` array is
  immutable, or that Vue re-renders on prop change — those are framework guarantees, not behavior
  this phase introduces. The focus-**trap** cycling behavior is asserted only to the extent
  `@vue/test-utils` can observe focus in jsdom; if the build finds jsdom cannot meaningfully assert
  Tab-cycling, it states so and pins the structural prerequisites — `aria-modal`, focus-on-open,
  the trap wiring — rather than padding with a framework-dependent assertion. The same jsdom honesty
  caveat applies to focus-**on-open** in Test 9 above.)

- **Deliverable** — When the phase is done these exist and nothing else changed:
  - `src/feedback/components/FeedbackModalCell.vue`
  - `src/feedback/components/index.ts`
  - `src/__tests__/feedback/FeedbackModal.test.ts`
  - (Per **Decision A** = local component state: **no** `feedback/stores` files are produced.)
  No other file is modified — notably `App.vue` (lines 48/55 untouched), the router,
  `src/db/Database.ts`, and the Phase-1 model/reference files are all unchanged. (The Phase-1
  barrels and the `FeedbackSubmission`/`CATEGORY_OPTIONS` exports are *imported*, not edited.)

- **Verify** — This phase's gate plus the global gate:
  - `bunx vue-tsc --noEmit` — clean for the new `.vue` + `.ts` files; no NEW type errors versus the
    red baseline the implementer establishes at build time (judge per touched file; do not invent
    counts). Use `vue-tsc`, never bare `tsc` (it skips `.vue`). In particular the Email field is a
    raw `<input type="email">`, not a `TextField type="email"` (off-union, would not type-check).
  - `bun run test` — the new `src/__tests__/feedback/FeedbackModal.test.ts` passes (all descriptions
    green) and no previously-green test regresses. Report exact pass counts from the actual run.
  - Global gate (`env-and-verify.md`): `bun` only (never npm/npx/node); no new
    `console.log`/dead code/silent stub (the inert submit is a *documented* TODO placeholder, not a
    silent stub — its no-op-ness is explicit and tested); dependency direction holds (a feature
    component imports only the Phase-1 model/reference leaves and Lab components — no upward edge to
    a service/db, and no transport); the Out-of-scope wall is respected (no `mailto:`, no nav/
    `App.vue` touch, no Phase-4 copy, no db/persist); every claim in shipped comments is literally
    true (especially any TODO/placeholder pointing at Phases 3/4).

---

## Decisions resolved (locked with the user, 2026-06-25)

**A — Form state: LOCAL COMPONENT STATE (not a store).** The draft is a local `reactive` seeded
from `createEmptyFeedbackSubmission()` inside `FeedbackModalCell.vue`, exactly like
`LLMConfigCell.vue` — no `feedback/stores`, no db. The user confirmed the planner's recommendation:
a store earns its place only when state is shared across components or persisted, and neither holds
for a single ephemeral, never-persisted form. (This overrides the store the Phase-1 comments and
master plan *anticipated*; no `feedback/stores` files are produced this phase.)

**B — Validation strictness.**
- **Category — REQUIRED.** Submit is blocked until the user explicitly chooses one; the selector
  shows a disabled "Choose a category…" placeholder and **does not** default to "Bug report".
  Grounded in Phase 1's factory deliberately setting `category: undefined` so the form can
  distinguish "not chosen" from "chosen"; a defaulted category would silently mis-classify
  mail-side. The selector stays bound to a `FeedbackCategory | undefined` field — never coerced to
  a `""` sentinel (see the undefined-valued v-model binding note in In scope).
- **Email — MINIMAL `@`-SHAPE CHECK.** Submit enables only when email is non-empty and contains a
  basic `local@domain` shape (an `@` with text either side). The user confirmed the planner's
  recommendation over a stricter regex (dishonest precision for a `mailto:` handoff) or non-empty
  only (lets a malformed reply address through). The real validity test is whether the user's mail
  client accepts it.
