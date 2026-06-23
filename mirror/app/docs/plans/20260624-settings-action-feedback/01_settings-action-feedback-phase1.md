---
created_at: 20260624
---

# Settings Action Feedback — Phase 1 Brief

## Phase 1 — Action-status primitive for the Settings page

- **Goal** — Establish one honest, reusable per-action status representation
  (`idle` / `running` / `success` / `error`-with-message) that `SettingsPage.vue` can hold one
  instance of for each of the three actions (save settings, delete data, import data), generalizing
  the existing transient `linkStatus` instrument-state pattern that the Test-Connection action
  already uses (`SettingsPage.vue:39`) — defining the *shape and seam* only, not yet wiring it to the
  handlers or rendering it.

- **In scope** —
  - A single small **composable** under `mirror/app/src/settings/composables/` (a folder that does
    **not** exist yet — this phase creates it, taking its shape from the per-feature `composables/`
    home that CONVENTIONS 4.6 and `mirror/app/CLAUDE.md` prescribe for reactive adapters (not yet
    instantiated in any feature; this phase creates the first)). The exact path is
    `mirror/app/src/settings/composables/<name>.ts` plus a new
    `mirror/app/src/settings/composables/index.ts` barrel. That one module file defines:
    1. An **action-status type** — a discriminated/enumerated state with exactly four cases:
       `idle`, `running`, `success`, and `error`. The `error` case carries a human-readable
       `message: string` (the real surfaced message — never a placeholder). `success` may carry an
       optional human-readable `detail` *only if* a later render genuinely has something true to
       show; if there is no honest detail to display, `success` carries no payload. Default/initial
       state is `idle`. Name the type after what it is (an action's status reading), not after any
       one of the three actions. This type and its factory (below) live in the **same composables
       module file**, NOT in `settings/models/` — CONVENTIONS 1.1–1.3 reserve `models/` for the
       feature's single *persisted* domain aggregate (`settings/models/Settings.ts`); this is
       transient view-layer flow state, which is correctly not a domain model.
    2. A **factory** that returns the initial `idle` state (mirroring `createEmpty…()` construction
       co-location, CONVENTIONS 1.3-style total construction) so every call site starts honestly at
       `idle` rather than hand-constructing the literal. Co-located in the same composables file as
       the type.
    3. A thin **reactive holder** the page can instantiate once per action — a Vue
       `ref`-backed `useX()` composable that, per CONVENTIONS 4.6, is a pure **reactive adapter**:
       it exposes flow state (the reactive status reading) plus the minimal transition affordances
       (`toRunning()`, `toSuccess(detail?)`, `toError(message)`, `reset()`), each a pure synchronous
       state transition with **no business logic, no side effect, no async, no service/store
       reach-down**. (4.6's "only testable by mounting" caveat does not bite: the affordances are
       plain mutators on the returned object, exercised by calling them directly — no component
       mount needed.) This is the view-layer generalization of the three loose `linkStatus` /
       `linkLatencyMs` / `linkMessage` refs, collapsed into one honest holder so Phase 2 can drive
       three of them without three ad-hoc triples.
  - A barrel/index export (`composables/index.ts`) for the new module, consistent with the barrel
    convention every settings *logic* subfolder follows (so `composables/` joins it with its own
    `index.ts`).
  - The module is self-contained: it imports only from Vue (`ref`/`computed`) and its own type. It
    does **not** import any store, service, the page, or any Cell.
  - One new test file at `mirror/app/src/__tests__/settings/<ModuleName>.test.ts` (the canonical
    mirrored test root — see Deliverable/Verify), covering the holder and its transitions.

- **Out of scope (the wall)** —
  - **All of Phase 2.** Do NOT touch the three handlers in `SettingsPage.vue`
    (`onSave`, `onImportPersona`, `onDeletePersona`), do NOT instantiate the holder in the page, do
    NOT pass it as a prop, and do NOT render any running/success/error reading anywhere. The most
    tempting overreach here is wiring even *one* handler ("just to prove it works") or adding the
    `ref` instances into `SettingsPage.vue`'s `<script setup>` — both are Phase 2. Phase 1 produces
    the primitive and stops; nothing in the running app changes behavior yet.
  - **The resolved feedback-surface decision** (MonitorCell label + LED, per the master plan's
    RESOLVED DECISION NEEDED) — that is *where Phase 2 renders* and how it reconciles the
    connection-themed cavity with data-operation results. Phase 1 defines no rendering and takes no
    position on the cavity; it only defines the state these will later read.
  - **The services and stores** (`PersonaTransfer.ts`, `PersonaLifecycle.ts`, `SettingsStore.ts`,
    `PersonaStore.ts`). They already do the real work and surface failures honestly
    (CONVENTIONS 7.16–7.18). No new store field, no error-contract change. The primitive is seeded
    *from* their outcomes at the view in Phase 2; it never reaches down into them.
  - **The existing `linkStatus` triple and `ConnectionMonitorCell`.** This is the precedent being
    generalized, not a target. Do NOT refactor `onTest` / `linkStatus` (`SettingsPage.vue:39`–`69`)
    to consume the new primitive in this phase. The two state vocabularies will deliberately coexist
    after Phase 2 (see the rename note under Doctrine cited); the link triple is **walled off** from
    this refactor. Retrofitting it, if ever wanted, is a separate follow-up — not Phase 1 or Phase 2.
  - **The shared ERROR banner** (`pageError` / `displayError` / the `ERROR // SYS // 0xEE` Cell). Left
    exactly as-is.
  - **Other Settings actions** (export, clear config, factory reset, fetch models, debug toggle) and
    **any new reusable Lab component** in `@nc-750/lab-vue`. The primitive lives in the settings
    feature only; promoting it to the design system is a speculative future the master plan walls off.
  - **Persistence.** The status is transient view state like `linkStatus`; it is never written to
    IndexedDB and gets no DTO/mapper.

- **Doctrine cited** —
  - `nc-750-web-frontend-architecture` → `mirror/app/CONVENTIONS.md`: §2 one-way layer graph
    (`view → service → store → db`; nothing depends upward — the primitive is pure view-layer state
    seeded later from service/store outcomes, never a new store/db field); **4.6 (composable as
    reactive adapter — the holder exposes flow state and holds no business logic, which is exactly
    the new module's contract and its home in `settings/composables/`)**; 7.17–7.18 (one error
    strategy per layer — a caught failure becomes reactive view state for the UI to present; the
    primitive is exactly that "local ref" surface); 1.1–1.3 (total construction via a factory, and
    the rule that `models/` holds only the persisted domain aggregate — which is why this transient
    state lives in `composables/`, not `models/`). 5.3 noted as the *non*-applicable analogue — this
    is per-action transient view state, not foundational module-level state like the debug flag.
  - **Deliberate vocabulary rename (disclosure).** The precedent uses
    `ref<"idle" | "testing" | "ok" | "error">` (`SettingsPage.vue:39`). This primitive deliberately
    renames `testing → running` and `ok → success` to generalize connection-test language to *any*
    action (save/delete/import are not "tests" and do not produce an "ok" the way a link probe does).
    The generalization is sound; the rename is intentional, not an oversight. After Phase 2 the page
    will hold **two vocabularies for the same in-flight/terminal concept** by design — the original
    `linkStatus` triple (untouched) and the new four-case holder — and that coexistence is accepted,
    not a defect to reconcile in this phase.
  - `nc-750-frontend-presentation` → honest instrument state / no fake meters: the four states are a
    literal reading. `running` is a real in-flight signal, not a timed animation; `success`/`error`
    are real terminal outcomes. (Phase 1 defines no visual; this constrains the *shape* so Phase 2
    cannot render a dishonest one. The visual obligations — including **C8.3 WCAG / reduced-motion** —
    are inherited by Phase 2's rendering, not a Phase 1 obligation, since Phase 1 emits no markup or
    animation.)
  - `brand/ETHOS.md` C7 (claims literally true): the type makes a fake "success" structurally
    awkward — `success` is a distinct terminal case reachable only by an explicit `toSuccess()`
    transition, and `error` *requires* a message, so the representation cannot carry an empty or
    invented claim.

- **Tests-as-descriptions** — (test file: `mirror/app/src/__tests__/settings/<ModuleName>.test.ts`)
  - **Initial state is honest idle.** The factory / holder, freshly created, reports `idle` — not
    `success`, not a blank/ambiguous state. Catches a primitive that defaults to a falsely-positive
    or undefined reading. (Behavior, not framework: asserts the contract's default, not that Vue
    refs work.)
  - **`toError(message)` preserves the real message.** After an error transition with a given
    message, the state is the `error` case and exposes that exact message string. Catches a
    representation that drops or replaces the surfaced failure detail (the ETHOS-C7 guard: the error
    reading must be the real one).
  - **`toSuccess()` reaches success only via the explicit transition.** A holder reports `success`
    only after `toSuccess()` is called, and `success` is reachable from `running` (the realistic
    path). Catches an optimistic primitive that could read `success` without an action having
    resolved.
  - **`reset()`/re-arm returns to idle and clears any prior error message.** After an `error` then a
    `reset()`, the state is `idle` and carries no leftover error message. Catches a stale failure
    message bleeding into a fresh action attempt.
  - **Each holder owns a fresh `ref` — instances do not share state.** Two holders created from the
    factory transition independently — moving one to `running`/`error` does not move the other. This
    guards against the specific bug of the holder closing over a **module-level `ref`** (shared
    across all call sites) instead of minting a fresh `ref` per `useX()` call — the failure mode that
    would make the three actions' readings interfere and that justifies one holder *per action*. *If*
    the implementation provably mints a fresh `ref` per call by construction (no module-level state
    is reachable), this test may be cut as a framework-level tautology; keep it only while a
    module-level-`ref` mistake is structurally possible.
  - *Not asserted (and why):* no test that "the page renders X" or "the handler calls toRunning" —
    that behavior does not exist until Phase 2; asserting it here would test unwritten code. No test
    of Vue's ref reactivity itself (framework guarantee).

- **Deliverable** — One new view-layer composable module under
  `mirror/app/src/settings/composables/` (the new `<ModuleName>.ts` plus a new `composables/index.ts`
  barrel) defining: the four-case action-status type, its `idle` factory, and the per-action reactive
  holder with its pure transition affordances; and one new test file at
  `mirror/app/src/__tests__/settings/<ModuleName>.test.ts` (the mirrored canonical test root — tests
  are **not** colocated in this codebase). `SettingsPage.vue` and all Cells are **unchanged**. No
  store, service, db, model, or mapper file is touched. Running-app behavior is identical to before
  this phase.

- **Verify** — Phase gate: `bunx vue-tsc --noEmit` passes for the new module and its consumers with
  no new errors. Run `bun run test` to establish the real baseline — the app test suite is **not**
  empty: it currently holds **28 test files** under `mirror/app/src/__tests__/` (rooted there by
  `vitest.config.ts`, which also marks `src/__tests__/**` as the canonical test root via its coverage
  exclude). State exactly: (a) the count of **new** tests added and that they are **green**, and (b)
  that **no previously-green test regressed** (the full suite stays green). Do **not** invent a
  suite-wide pass count beyond what `bun run test` reports. Global gate (`env-and-verify.md`):
  **bun only** (never npm/npx/node); **`vue-tsc`, not bare `tsc`**, for anything touching `.vue`
  (none here, but the gate stands); **no NEW type errors** judged per touched file against the red
  baseline the implementer establishes at build time; tests green with exact counts; **no new
  `console.log`**, no dead code, no silent stub (the holder is fully implemented, not a TODO);
  **dependency direction holds** — the new module imports nothing upward and nothing from
  store/service/db; **out-of-scope boundary respected** — `SettingsPage.vue`, the Cells, the
  services, the stores, and the `linkStatus` triple are byte-for-byte unchanged; **claims literally
  true** — `error` carries the real message, `success` is reachable only by explicit resolution.

---

### Notes for the orchestrator

No `DECISION NEEDED` checkpoint is raised. The one plausible fork — *inline-in-the-page triple
(exact `linkStatus` mirror) vs. an extracted reusable composable* — is resolved by doctrine, not left
open: the master plan's Phase 1 goal explicitly asks for a *representation the page can hold for each
of the three actions* (three instances), and CONVENTIONS 4.6 (composable as reactive adapter) + 1.3
(total construction via factory) + §2 layering favor one honest, independently-instantiable holder
over three loose refs repeated three times. Generalizing the precedent's *pattern* (transient view
state, four honest states) does not require mirroring its *inline triple shape*, which does not scale
to three actions cleanly. If the user prefers the literal inline-triple mirror instead, that is a
smaller variant of the same phase and can be requested at the approval gate — it does not change the
phase count or the Out-of-scope wall.
