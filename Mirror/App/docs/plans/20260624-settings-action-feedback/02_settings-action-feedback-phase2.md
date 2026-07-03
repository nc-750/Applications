---
created_at: 20260624
---

# Settings Action Feedback — Phase 2 Brief

## Phase 2 — Wire save / delete / import to drive their status, and surface the result in a scroll-proof status modal

- **Goal** — Make each of the three action handlers in `SettingsPage.vue` (`onSave`,
  `onImportPersona`, `onDeletePersona`) drive a per-action `ActionStatus` holder (the Phase 1
  primitive) through `running → success | error` around the real async call, with each terminal
  reading derived from the operation's **genuine outcome** (a thrown error from the persona import
  service; `settingsStore.error` after save; `personaStore.error`/`interviewStore.error` after
  delete), and surface the active data-operation status in a **single feature-local status modal**
  that is visible regardless of scroll position or screen size — so the three today-silent actions
  give a literally-true in-flight/done/failed signal that a mobile single-column collapse cannot
  scroll out of view, reduced-motion- and contrast-honest, without inventing any new state below the
  view. **A modal primitive does not exist anywhere in the codebase** (see the material finding and
  DECISION NEEDED below) — this phase builds a settings-feature-local one; it does not promote a
  generic modal to the Lab.

- **In scope** —
  - **Three holders in `SettingsPage.vue`'s `<script setup>`.** Instantiate `useActionStatus()`
    (from `../composables`, the Phase 1 barrel) once per action — one for save, one for import, one
    for delete — three independent reactive holders (the fresh-ref-per-call guarantee Phase 1
    established). They sit alongside the existing `linkStatus` triple, which is **not** touched (see
    Out of scope).
  - **Wire the three handlers** so each drives its own holder around the real async call it already
    makes, mirroring the `onTest` precedent (`SettingsPage.vue:59–69`). The unifying rule across all
    three: **a terminal reading is derived from the operation's genuine outcome, never assumed from
    "the await returned".** Two of the three orchestrators (save, delete) do **not** reject on
    failure — they surface into a store `error` ref — so a bare `try/catch` would have an
    **unreachable catch** and would render a false success. Each handler reads the correct source of
    truth:
    - `onSave(config)` — call `toRunning()` before `await settingsStore.saveSettings(config)`. The
      store's `saveSettings` does **not** throw on a persistence failure — it catches into its own
      `error` ref (CONVENTIONS 7.17, the store-error contract this phase must not change). So after
      the await the handler reads the store's outcome: if `settingsStore.error` is set,
      `toError(<that message>)`; otherwise `toSuccess()`. The store stays the source of truth for the
      failure; the view seeds its status *from* that outcome (the one-way graph — the view never
      invents a new store field).
    - `onDeletePersona()` — `deletePersona(personaStore, interviewStore)`
      (`mirror/app/src/persona/services/PersonaLifecycle.ts:72–86`) wraps each store clear in its own
      `try/catch` and **returns `void`; it NEVER rejects.** A `clearPersona` failure lands in
      `personaStore.error` and a `clearInterview` failure lands in `interviewStore.error` (each
      `clear*` sets its `error` to `null` on success — `PersonaStore.ts:77–85`,
      `InterviewStore.ts:126–133`). Therefore: `toRunning()` before the await, then **read the store
      outcome after it** — the **delete source of truth is `personaStore.error ?? interviewStore.error`**
      (either store error means the teardown was not clean). If that combined value is set →
      `toError(<that message>)`; otherwise `toSuccess()`. **Do NOT wrap an unchanged `deletePersona()`
      in a `try/catch` and treat the catch as the failure path — that catch is unreachable and would
      render a false "DELETED" success on a real failure (ETHOS C7 violation), masking the very
      silent-failure this bullet fixes.** `deletePersona` itself stays **unchanged** (no
      error-contract change; the orchestrator keeps returning `void`).
    - `onImportPersona(file)` — `importPersona` **does** throw on a bad file, so here a real
      `try/catch` is correct: `toRunning()`, then `try { await importPersona(...); await
      syncInterviewAfterImport(...); toSuccess() } catch (e) { toError(<real message>) }`, reusing
      the message the handler already derives (`e instanceof Error ? e.message : String(e)`). This is
      the one of the three whose failure path is a genuine rejection.
    - Each handler **re-arms** its holder honestly on re-entry: a fresh `toRunning()` at the top of
      the next invocation replaces any prior terminal reading (no stale success/error bleeds into a
      new attempt — the Phase 1 re-arm guarantee, exercised by `toRunning()`).
  - **No-double-surface invariant for ALL THREE actions (save · delete · import).** Today
    `displayError = pageError ?? settingsStore.error ?? personaStore.error` (`SettingsPage.vue:49–51`)
    funnels store errors into the shared `ERROR // SYS // 0xEE` banner. Once save reads
    `settingsStore.error` and delete reads `personaStore.error`/`interviewStore.error`, the *same*
    failure that the modal now reports would **also** light that banner — the exact double-surface the
    brief forbids. The invariant: **a save/delete/import failure is surfaced in the modal and NOT
    simultaneously in the shared banner.** Mechanism: the **modal owns the data-op error**, and
    `displayError` must **stop funnelling the store-error sources these three modal-owned paths now
    drive** — i.e. drop `settingsStore.error` and `personaStore.error` from the `displayError`
    fallback chain so a save/delete failure shows once (in the modal), not twice. *(Note:
    `interviewStore.error` is **not** in the current `displayError` chain (`SettingsPage.vue:50` is
    `pageError ?? settingsStore.error ?? personaStore.error`), so an `interviewStore.error`-only delete
    failure never double-surfaced in the banner — nothing to remove for it, and do not add it.)*
    `pageError` itself
    remains the banner's backing for the actions that still legitimately use it (export — see Out of
    scope), and import likewise stops setting `pageError` (it moves to the modal). The banner Cell and
    its dismiss control are **not removed** (master-plan Deferred wall) — only its *inputs* are
    narrowed so it no longer fights the modal. This satisfies the "modal must not fight the banner"
    line: after this change there is no path on which a single data-op failure renders in both
    surfaces. *(Builder note: `displayError` will, after this, back only export-path `pageError`; if
    the builder finds a store-error source that is NOT one of the three modal-owned paths and still
    wants the banner, that is a flagged follow-up, not a silent re-add.)*
  - **One new feature-local modal component: a status modal.** Create
    `mirror/app/src/settings/components/ActionStatusModal.vue`. It is a read-only status surface
    (CONVENTIONS 7.6 — it reads, it hosts no form input), props-down + one `dismiss` emit only.
    Because there is **no Lab modal primitive to reuse** (material finding below), it is built in the
    settings feature from existing Lab primitives plus a positioned container. Its **reading
    vocabulary** is reused from `ConnectionMonitorCell` (`Acquire` while running, `nc-led` +
    `nc-lcd-sub` for terminal states, `.cmc-error`-style real-message line). Its **positioning is
    NEW** (see the M4 note in the material finding) — `position: fixed`, viewport-anchored,
    page-level. The `.ivw-overlay` precedent contributes **visual vocabulary only** (the Lab
    cover/cavity idiom), NOT its positioning. Its contract:
    - **Visibility independent of scroll/screen size (MUST)** — the modal is **`position: fixed`,
      viewport-anchored** (not an in-flow Band/Cell, and explicitly **not** `position: absolute`
      in-cell), so on a single-column mobile collapse it stays on screen. An `absolute`/in-cell cover
      (the `ivw-overlay` shape) is **rejected** because it would scroll with its container and not
      survive the single-column collapse — which is the entire reason the phase chose a modal.
    - **Props** — it takes the three holders' statuses (or a single page-computed "active data
      operation" derived from them; the page may compute which of the three is non-idle/most-recent —
      builder's choice within this contract) plus whatever the page needs to drive open/closed. The
      page decides *when* the modal is open from the holders' kinds (see honest behavior below); the
      modal renders the supplied status and emits `dismiss`.
    - **Honest state rendering**, structurally mirroring `ConnectionMonitorCell`'s
      `nc-led` + `nc-lcd-sub` + `Acquire`-while-running pattern:
      - `running` → an `Acquire` reading labelled for the operation in flight (e.g. "SAVING CONFIG",
        "IMPORTING PERSONA", "DELETING PERSONA") — honestly naming which operation, driven by the
        real in-flight promise, **not** a timer.
      - `success` → `nc-led--on` + a literally-true terminal label (e.g. "CONFIG SAVED" /
        "PERSONA IMPORTED" / "PERSONA DELETED"). The delete success label renders **only** when the
        store outcome was clean (per the delete wiring above) — never on the strength of the
        orchestrator merely returning. Render the optional `detail` only if genuinely present.
      - `error` → `nc-led--err` + a failure label + the **real** surfaced message (mirroring
        `ConnectionMonitorCell`'s `.cmc-error` line).
    - **Honest dismissal / blocking behavior** (per the resolved DECISION NEEDED): `running` is
      **non-dismissible** (the work is genuinely in flight; the user cannot truthfully "acknowledge"
      an unfinished operation). `error` **stays until the user acknowledges it** (an explicit dismiss
      control) — an error must never silently disappear. `success` for these fast operations
      **auto-dismisses** after a brief, fixed view-only delay (and also offers manual dismiss) so a
      sub-second save does not force a click; the auto-dismiss timer governs only *how long a true
      reading stays visible*, never *whether* the operation succeeded, so it does not manufacture a
      fake state (ETHOS C7). The modal **does not block the whole app** beyond the running operation;
      it is a non-blocking fixed status panel (a corner/inline fixed surface), not a full-screen
      interaction-locking backdrop, since a settings save in flight should not lock the page.
    - **Keyboard & focus (C8.3, MUST).** `.ivw-overlay` is a non-interactive busy mask and offers no
      pattern, so this is specified fresh and is a hard requirement, not an inherited one:
      - The dismiss control is a real, keyboard-operable button (focusable, activatable by Enter/Space
        — a `<button>`, not a click-only element).
      - In a **dismissible** state (`error` or `success`), **Escape dismisses** the modal (same path
        as the dismiss control). In `running` (non-dismissible) Escape does nothing, consistent with
        the dismissal rules above.
      - The reading is exposed through an **accessible alert role** (`role="alert"` / an
        `aria-live`-announced region) **and receives focus when it appears**, so a keyboard / assistive
        -technology user is not left with an unreachable alert. The `error` reading in particular must
        be focusable and announced (it is the state that persists until acknowledged).
      - This is WCAG 2.1 AA keyboard-navigability for the new surface; combined with the
        reduced-motion gate (below) and the not-colour-only rule, it discharges C8.3 for the modal.
  - **Mount the modal once in `SettingsPage.vue`**, driven by the three holders, with its `dismiss`
    wired to reset/close the active reading. It is mounted at the page level (not inside a Band) so
    its fixed positioning is honored and it is not subject to a Band's column collapse.
  - **No new Band or Cell is added** (mobile-conscious, per the user's direction): the modal reuses
    one surface for all three data-operation readings rather than proliferating cavities a
    single-column screen would make costly. `DataManagementCell`, `LLMConfigCell`, and
    `SystemControlCell` are unchanged.
  - **Reduced-motion + contrast (carry-forward C8.3, the Phase 1 forward-point):** the running
    reading uses the Lab `Acquire` component, whose animation is already gated by the global
    `@media (prefers-reduced-motion: reduce)` rules in `lab.css` — both the blanket reduced-motion
    block at **`lab/css/lab.css:683`** and the specific `.nc-acquire__bar { animation: none }` at
    **`lab/css/lab.css:2032`** — so the brief **requires reuse of `Acquire`/`nc-led` rather than a
    hand-rolled animated element**, inheriting that gate. Any modal transition (open/close) the
    builder adds must also be reduced-motion-safe (it falls under the blanket `lab/css/lab.css:683`
    rule only if it animates via CSS that the rule covers; if the builder adds a bespoke transition it
    must gate it the same way, or use none). Status must **never be conveyed by LED colour alone**:
    every state carries a text label (the `nc-led` text + `nc-lcd-sub` label) so the reading survives
    colour-blindness and low contrast (the LED dot is corroborating, not sole). No new `<style>`
    colour token beyond the established `--nc-error` pattern `ConnectionMonitorCell` / `ivw-overlay`
    already use.
  - **Update the existing view test** `mirror/app/src/__tests__/settings/SettingsPage.test.ts` where
    Phase 2 changes observable behavior (the import-failure assertion — see Tests-as-descriptions —
    is **rewritten**, not regressed; the delete-failure assertion is written against the **store-seeded**
    error path, not a rejection), and **add** the new per-action-modal assertions there. The modal's
    per-state rendering may also be covered by a small new test for `ActionStatusModal.vue` under
    `mirror/app/src/__tests__/settings/` (mirrored test root).

- **Out of scope (the wall)** —
  - **The most tempting overreach: building this as, or promoting it to, a reusable Lab modal in
    `@nc-750/lab-vue`.** Because no modal primitive exists, a diligent builder will be tempted to
    "do it properly" and add a generic `Modal`/`Dialog` to the design system so the whole app can
    reuse it (and retrofit the absent delete/factory-reset confirmations). That is a real, valuable
    follow-up — and explicitly **not this phase**. The modal lives in `settings/components/`,
    composed from existing Lab primitives; promoting a generic modal to lab-vue, or wiring it to any
    action beyond the three named, is deferred.
  - **The other Settings actions.** Export, clear-config, factory-reset, fetch-models, and
    debug-toggle stay silent — do **not** add holders for them and do **not** route them through the
    modal. The goal names exactly three actions (save, delete, import). "While the modal is right
    there, also confirm/announce delete-confirmation, export, factory-reset" is a follow-up.
  - **The services and stores** (`PersonaTransfer`/`importPersona`, `PersonaLifecycle`/
    `deletePersona`, `SettingsStore.saveSettings`, `PersonaStore`/`InterviewStore`). No new store
    field, no error-contract change, no making `saveSettings` throw, **no making `deletePersona`
    reject.** This phase **reads** their existing outcomes (a thrown error from `importPersona`;
    `settingsStore.error` from the save path; `personaStore.error`/`interviewStore.error` from the
    delete path) and seeds the view status from them. The store/service error strategy (CONVENTIONS
    7.16–7.18) is unchanged.
  - **The `linkStatus` triple, `onTest`, and `ConnectionMonitorCell`.** The Test action already has
    honest feedback in its dedicated cavity — it is the precedent, not a target. Do **not** retrofit
    it onto a holder, do **not** route `linkStatus` through the modal, and do **not** relabel
    `ConnectionMonitorCell`. The two state vocabularies coexist by design.
  - **The shared ERROR banner Cell** (`pageError` / `displayError` / the `ERROR // SYS // 0xEE`
    Cell). **Do not remove it** (master-plan Deferred wall). Per the no-double-surface invariant
    above, this phase **narrows its inputs** — `displayError` stops funnelling the store-error sources
    the three modal-owned paths now drive (`settingsStore.error`, `personaStore.error`), and
    `onImportPersona` stops setting `pageError` — so the banner no longer duplicates a modal-owned
    failure. `pageError` still backs **export** failures (`onExportPersona` is unchanged), and the
    banner Cell, its `role="alert"` markup, and its dismiss handler remain. **FLAG:** the existing
    `SettingsPage.test.ts` import-error assertion (line 108–118, expecting
    `"Import failed: not a persona"` in the banner) is therefore **rewritten** to assert the modal
    surface — a deliberate behavior change, not a regression. Removing the banner entirely is the
    deferred adjacent UX call — out of scope.
  - **Persistence / history of outcomes.** The reading is transient view state like `linkStatus`;
    nothing is written to IndexedDB, no DTO/mapper. "Last operation" means the last in the current
    session, held in the holders — not a persisted log.
  - **Changing the Phase 1 primitive.** `ActionStatus.ts` and its holder are consumed as-is. If a
    real gap is found, raise it — do not silently edit Phase 1's module.

- **Doctrine cited** —
  - `nc-750-web-frontend-architecture` → `CONVENTIONS.md`: §2 one-way layer graph (the view holds
    action status seeded from service/store outcomes; nothing reaches down to invent a store/db
    field); 6.6 (handlers named `onX`; holder transitions are plain calls *within* the handler); 7.6
    (a monitor/readout reads and hosts no input — the modal emits only `dismiss`, takes no form);
    7.16–7.18 (one error strategy per layer — `importPersona` throws and is caught into the
    view-layer holder; the save path catches into `settingsStore.error` and the view reads that; the
    delete path catches into `personaStore.error`/`interviewStore.error` and the view reads those; no
    double-log, no swallow, **no false-success on a non-rejecting orchestrator**). Props-down/events-up:
    the modal is props-in, one `dismiss` out.
  - `nc-750-frontend-presentation` → honest-reading rule (running is a real in-flight signal via the
    reduced-motion-gated `Acquire`, not a timed fake; success/error are real terminal outcomes, and
    delete-success is contingent on the genuine store outcome); one loud signal (the operable Cell's
    button is the trigger, the modal is the single result surface); the modal as a foreground status
    surface follows the same instrument-state reading vocabulary as `ConnectionMonitorCell`
    (`Acquire`/`nc-led`/`nc-lcd-sub`), not a generic web toast.
  - `brand/ETHOS.md` C7 (claims literally true): "success" renders only after the action genuinely
    resolved without a surfaced error — for delete this means the **store outcome was clean**, not
    merely that the void-returning orchestrator finished; "error" renders the real message; the
    modal's label names the operation it actually reports (data operation), so no readout is literally
    false — and the success auto-dismiss timer governs only *visibility duration*, never *whether* the
    op succeeded. **C8.3 (WCAG 2.1 AA / keyboard / reduced-motion):** status is never colour-only
    (text label always present); the dismiss control is keyboard-operable, Escape dismisses a
    dismissible state, and the alert reading takes focus / is announced on appearance; the only
    animation is the already-reduced-motion-gated `Acquire` (plus any modal transition gated the same
    way or omitted).

- **Tests-as-descriptions** — (view test: `…/__tests__/settings/SettingsPage.test.ts`; optional
  component test: `…/__tests__/settings/ActionStatusModal.test.ts`)
  - **A successful save shows a true "saved" reading in the modal.** Emitting `save` with a valid
    config (the store persists, no error) opens the modal in its success state with the literally-true
    "saved" label. Catches a save that stays silent (the bug this phase fixes) and a reading that
    claims success without the store having persisted. *(Observable in the modal — not an internal
    holder field.)*
  - **A failed save shows the real failure, not a generic one.** When the save path surfaces an error
    (`settingsStore.error` set), the modal enters its error state and shows that exact message.
    Catches a representation that drops the surfaced message or shows a placeholder (ETHOS C7 guard).
  - **A failed import shows the real error in the modal and not in the banner (rewritten existing
    test).** The existing test "an import calls the persona service; a failure renders the error
    banner" is **rewritten**: after `importPersona` rejects with "not a persona", the failure now
    renders in the **modal** ("not a persona" / IMPORT FAILED) and is **not** duplicated in the shared
    `pageError` banner. Catches the double-surface regression (same failure shown twice) and pins the
    relocated surface. *(This is one of the existing assertions Phase 2 deliberately changes.)*
  - **A successful import shows a true "imported" reading.** When `importPersona` and
    `syncInterviewAfterImport` resolve, the modal reaches its success state. Catches a success that
    fires before the sync completes, or an import left silent.
  - **A delete failure is surfaced from the STORE outcome, not a rejection (corrected).** Because
    `deletePersona` returns `void` and never rejects, seed the failure by setting a store error:
    arrange `personaStore.error` (or `interviewStore.error`) to a real message **after** the delete
    resolves (e.g. mock `clearPersona`/the orchestrator to leave `personaStore.error` set), emit
    `delete`, and assert the modal enters its **error** state with that exact store message. **Do NOT
    assert a rejection** — the orchestrator cannot produce one, so a "rejects → modal error" assertion
    would be a wrong-expectation test that the code cannot satisfy honestly. Catches the false-"DELETED"
    -success bug (a try/catch with an unreachable catch) — i.e. it fails if the modal shows success
    while a store error is set.
  - **A successful delete shows a true "deleted" reading.** When both `clearPersona` and
    `clearInterview` succeed and neither store error is set, the modal reaches its success state with
    the "deleted" label. Catches a delete left silent, and (paired with the test above) pins that
    success is contingent on the clean store outcome, not on the void return.
  - **An error reading is not auto-dismissed; a success reading is.** An error modal stays present
    until the user dismisses it (the acknowledge path), whereas a success modal clears on its own
    (the auto-dismiss path) — and `running` cannot be dismissed. Catches an error that silently
    disappears before the user reads it, and a success that wrongly traps the user behind a manual
    click. *(Assert the dismissibility/persistence behavior, not a specific millisecond count or
    timer internal — pin observable presence/absence: the dismiss control's existence per state, that
    an error reading survives a flush while a success one clears. **Build-time pointer:** drive the
    success-auto-dismiss assertion with fake timers — `vi.useFakeTimers()` + `advanceTimersByTime(...)`
    past the view-only constant — rather than a real wall-clock wait; still assert presence→absence,
    never the millisecond value.)*
  - **The modal dismiss control is keyboard-operable and Escape dismisses a dismissible reading
    (C8.3).** In an `error` (or `success`) state the dismiss `<button>` is focusable and activatable
    by keyboard, and pressing Escape dismisses the modal via the same path; in `running` Escape does
    nothing. Where observable, the alert reading exposes its alert role and receives focus on
    appearance. Catches a mouse-only dismiss and an unreachable/unannounced alert (the WCAG 2.1 AA
    keyboard gap C8.3 forbids). *(Assert the observable: a real `<button>` element, the keydown
    handler's effect on visibility, and the alert role / focus target where the test harness can see
    them — not internal focus-management plumbing.)*
  - **The modal is closed at rest.** Before any of the three actions runs, the modal is not shown
    (no false "OK"/success surface sits on the page). Catches a modal that defaults open or to a
    positive reading. *(Mirrors the existing "idle link readout" honesty test.)*
  - **Status is not colour-only (C8.3).** Each rendered state exposes a text label
    (success/error/running each carry their label string), so the reading is legible without LED
    colour. Catches a regression to a colour-only signal. *(If every branch structurally renders a
    label, fold this into the per-state assertions rather than a standalone test; keep it only while
    a colour-only branch is possible.)*
  - **The link readout is unaffected.** A connection test still drives **only**
    `ConnectionMonitorCell` ("LINK ESTABLISHED" / latency) and does **not** open the data-op modal.
    Guards the Out-of-scope wall: the two vocabularies do not cross-wire. *(The existing `onTest`
    tests — lines 83–106 — must remain green unchanged.)*
  - *Not asserted (and why):* no test that `Acquire` animates or that `prefers-reduced-motion`
    disables it — that is a `lab.css` guarantee already covered upstream; this phase asserts only that
    it *uses* `Acquire` (inheriting the gate). No test of Vue ref reactivity or of `fixed`-positioning
    layout itself. No assertion on the exact auto-dismiss duration (a view-only constant the builder
    may tune) — only on the dismiss/persist *behavior*.

- **Deliverable** — `mirror/app/src/settings/pages/SettingsPage.vue` modified: three
  `useActionStatus()` holders added; `onSave`, `onImportPersona`, `onDeletePersona` wired to drive
  them around their existing async calls, each terminal reading derived from the genuine outcome
  (save reads `settingsStore.error`; delete reads `personaStore.error ?? interviewStore.error`;
  import catches the real rejection); the new modal mounted once at page level and driven by the
  holders; `onImportPersona` no longer routes its failure to `pageError`; `displayError` narrowed so
  the banner no longer duplicates a modal-owned save/delete/import failure (export-path `pageError`
  retained). One new component `mirror/app/src/settings/components/ActionStatusModal.vue` (read-only,
  props-in + one `dismiss` emit, **`position: fixed` viewport-anchored** scroll-proof surface,
  label + LED, `Acquire`-while-running, running-non-dismissible / error-acknowledged /
  success-auto-dismiss, keyboard-operable dismiss + Escape + focused/announced alert per C8.3). No
  new Band or Cell. `mirror/app/src/__tests__/settings/SettingsPage.test.ts` updated (the
  import-failure assertion rewritten to the modal surface; the delete-failure assertion written
  against the store-seeded error path; new per-action-modal and keyboard-dismissal assertions added);
  optionally one new `ActionStatusModal.test.ts`. **Unchanged:** the Phase 1 composable
  (`ActionStatus.ts`/`index.ts`), all services and stores (including `deletePersona`, which keeps
  returning `void`), `ConnectionMonitorCell.vue`, the `linkStatus` triple and `onTest`, the shared
  ERROR banner Cell markup, `LLMConfigCell.vue`, `DataManagementCell.vue`, `SystemControlCell.vue`,
  and all of `@nc-750/lab-vue`.

- **Verify** — Phase gate: `bunx vue-tsc --noEmit` passes (this phase touches `.vue` files — use
  `vue-tsc`, not bare `tsc`) with no new errors judged per touched file against the red baseline the
  implementer establishes at build time. Run `bun run test` to establish that baseline and report:
  (a) the existing `SettingsPage.test.ts` stays green with the import-failure assertion **rewritten**
  (it changes meaning — the import failure now asserts the modal surface, not the banner) and the
  delete assertion now driving the **store-seeded** error path rather than a rejection — call both out
  explicitly so the critic does not read a changed assertion as a broken one; (b) the count of
  **new** tests added and that they are green; (c) that no **other** previously-green test regressed
  (the `onTest` link tests in particular unchanged and green). Do **not** invent a suite-wide pass
  count beyond what `bun run test` reports (confirm the real number at build time). Global gate
  (`env-and-verify.md`): **bun only** (never npm/npx/node); **`vue-tsc`, not bare `tsc`**; tests
  green with exact counts; **no new `console.log`**, no dead code, no silent stub (the modal is fully
  implemented — every state renders honestly, the dismissal behavior is real, and no handler has an
  unreachable catch masquerading as error handling); **dependency direction holds** —
  `SettingsPage.vue` reads store/service outcomes and holds view state, the modal imports only from
  `@nc-750/lab-vue` and the `ActionStatus` type, nothing reaches down to invent a store/db field;
  **out-of-scope boundary respected** — services, stores (including the unchanged void-returning
  `deletePersona`), the Phase 1 module, the `linkStatus` triple, `ConnectionMonitorCell`, the shared
  banner Cell markup, and all of `@nc-750/lab-vue` are unchanged (the banner is **not** removed; no
  Lab modal is added); **claims literally true** — `success` renders only on a genuinely resolved
  action (delete-success contingent on a clean store outcome, not the void return), `error` shows the
  real surfaced message and is not auto-cleared, the modal is labelled for the data operation it
  reports, and no single data-op failure double-surfaces (modal + banner).

---

### MATERIAL FINDING — no modal primitive exists anywhere; the only overlay precedent is in-cell `absolute`, not viewport-`fixed`

Grounding the user's modal direction against the real code: **there is no modal / dialog / overlay
component or pattern to reuse** — not in the Lab, not in Mirror.

- `@nc-750/lab-vue`'s barrel (`lab/vue/src/index.ts`) exports no `Modal`, `Dialog`, `Overlay`, or
  `Popover` — its surfaces are `Cell` / `MonitorCell` / `Band` / `Chassis*`, all in-flow.
- `lab/css/lab.css` has no modal/dialog/backdrop class; its only "overlay" is `nc-acquire` (a busy
  waveform) and the term "overlay" otherwise refers to a CSS grain texture.
- Mirror has **no confirm dialog** for any destructive action — `onDeletePersona` and
  `onFactoryReset` fire immediately with no confirmation, and there is no `window.confirm`. So there
  is not even an established app-level confirm pattern to mirror.
- The **only** existing full-cover overlay precedent is feature-local CSS in `InterviewPage.vue`
  (`.ivw-overlay`, `InterviewPage.vue:314–324`) — and it is **`position: absolute; width/height:100%`
  INSIDE a `<Cell>`** (the cover sits at `InterviewPage.vue:290`, scoped to that cell's box), holding
  `nc-acquire`. The analogous busy mask in `ProbePanel.vue` is the same shape. **Neither is a
  viewport-anchored fixed surface, and neither is a dismissible modal with terminal states.** So the
  `ivw-overlay` precedent supplies **visual vocabulary only** (the Lab cover/cavity idiom). The
  modal's positioning is **NEW** — `position: fixed`, viewport-anchored, page-level — and copying
  `position: absolute` would NOT be scroll-proof (it would scroll with / be clipped by its container
  and fail the single-column collapse, which is the whole point of the phase). The genuine reuse here
  is `ConnectionMonitorCell`'s **reading vocabulary** (`Acquire` / `nc-led` / `nc-lcd-sub` / the
  `.cmc-error` real-message line), not the overlay's positioning.

Consequence for the phase: the modal is **greenfield**. The brief above scopes it as a small
**settings-feature-local** component built from existing Lab primitives, taking its **reading
vocabulary** from `ConnectionMonitorCell` and its cover **idiom** (not positioning) from
`ivw-overlay`, with **new viewport-`fixed` positioning** — explicitly **not** a new Lab primitive.
That keeps the phase inside the master-plan wall ("no new reusable Lab component") while honoring the
user's modal direction. This is raised as a finding because it materially enlarges Phase 2 relative to
the prior cavity-only brief, and it surfaced a build-vs-reuse fork the user settled below.

### DECISION NEEDED — confirm the feature-local modal, its blocking behavior, and the cavity question

> **RESOLVED (2026-06-24, user):** all three sub-decisions confirmed to the recommended answers —
> **(1) feature-local `ActionStatusModal.vue`** (no new Lab primitive), **(2) modal only** (no second
> page-status cavity), **(3) non-blocking fixed panel** (running non-dismissible, error persists until
> acknowledged, success auto-dismisses). The brief as written above already reflects these; this
> section is retained as the rationale record.

Three linked sub-decisions. The brief above is written to the recommended answer for each; surfacing
them because each is a genuine fork the doctrine does not settle outright.

1. **Feature-local modal vs. a new Lab modal primitive (build-vs-reuse).**
   - **Option A (recommended; what this brief specifies):** build a settings-feature-local
     `ActionStatusModal.vue` from existing Lab primitives. Smallest honest change; stays inside the
     master-plan "no new Lab component" wall; ships the user's scroll-proof modal now.
   - **Option B:** add a generic `Modal`/`Dialog` to `@nc-750/lab-vue` and consume it here. More
     reusable (and would seed the absent delete/factory-reset confirmations), but it breaks the
     master-plan wall, widens the phase into the design system, and designing a generic modal API is a
     separate concern. **Not recommended for this phase** — capture it as a follow-up.
   - **Recommendation: A.** Build local now; let a future, dedicated phase promote a Lab modal if a
     second consumer appears (YAGNI).

2. **Modal-only vs. modal + a generalized page-status MonitorCell.** The user said a single
   page-level status cavity is *acceptable, not required*.
   - **Recommendation: modal only.** The modal already delivers the at-a-glance last-state reading
     *and* the transient attention, scroll-proof on mobile — which was the whole reason for choosing
     it. Adding a second always-present cavity duplicates the same status in two places, costs a
     surface on a single-column screen (against the user's mobile-conscious direction), and re-opens
     the ETHOS C7 honesty problem of a connection-themed cavity reading data ops. A second surface is
     only warranted if the user wants a *persistent* last-result readout that survives modal dismissal
     — if so, raise it; otherwise the modal alone suffices (YAGNI). **If the user does want both,**
     the honest form is a *new* `DataOpStatusMonitorCell` (truthfully labelled "DATA STATUS"), never a
     relabeled `ConnectionMonitorCell` — but the brief above deliberately omits it.

3. **Blocking vs. non-blocking modal.**
   - **Recommendation: non-blocking** (a fixed-positioned status panel, not a full-screen
     interaction-locking backdrop). These operations are fast; locking the whole settings page behind
     a sub-second save is more annoying than helpful and risks a "running" state that outstays its
     welcome. `running` is non-dismissible (you cannot truthfully acknowledge unfinished work),
     `error` persists until acknowledged, `success` auto-dismisses after a brief view-only delay. **If
     the user prefers a classic centered blocking dialog with a backdrop,** that is a small variation
     on the same component — flag it and the builder adjusts positioning + a backdrop element, keeping
     the identical honest state rules.

The orchestrator should confirm these with the user before build — particularly sub-decision 1 (the
build-vs-reuse fork the missing primitive forces) and sub-decision 2 (whether the modal alone is the
single surface, which the user left open).
