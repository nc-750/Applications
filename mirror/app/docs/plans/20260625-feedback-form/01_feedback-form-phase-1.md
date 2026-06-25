---
created_at: 20260625
plan_slug: feedback-form
phase: 1
target: mirror/app
---

# Phase 1 — Feedback domain model + submission factory + category reference set

- **Goal** — Establish the greenfield `src/feedback/` feature with its one canonical domain
  model (the feedback submission: category, email, subject, content), a total
  `createEmptyFeedbackSubmission()` factory, and the fixed three-item category set as a
  `reference/` lookup table carrying each category's display label and locked `mailto:`
  subject-prefix — on the real per-feature layering seam, with no UI, no transport, no db.

- **In scope** — Four new files under a new `src/feedback/` folder (all greenfield; none
  exist today — confirmed by glob):
  1. `src/feedback/models/FeedbackSubmission.ts` — the canonical domain model and its factory.
     - A `FeedbackSubmission` interface, plain data only (no persistence key, no behavior, no
       wire shape), with exactly four fields: `category`, `email`, `subject`, `content`.
     - `category` is typed as the category value type re-exported from the reference module
       (see decision A below) — modelled as the **one optional**: typed `FeedbackCategory |
       undefined` (not `category?:`), because a fixed enum-like set has no natural "empty"
       member and the unset state must be representable for a total factory. This mirrors how
       `Settings.provider` is the lone optional in `src/settings/models/Settings.ts`.
     - `email`, `subject`, `content` are `string`, zeroed to `""` by the factory.
     - `createEmptyFeedbackSubmission(): FeedbackSubmission` co-located in the model file
       (CONVENTIONS 1.3), **total**: every key present, `category: undefined`, the three
       strings `""`. A short comment notes the totality contract (so a future reactive store
       in Phase 2 can seed `reactive` + `toRefs` and reset via `Object.assign` cleanly) —
       written as prose, matching the comment style already in `Settings.ts`.
  2. `src/feedback/reference/Categories.ts` — the fixed three-item category set as reference
     data, **not** a domain model (CONVENTIONS 1.2 / 6.10), mirroring
     `src/settings/reference/Providers.ts` / `PROVIDER_OPTIONS`:
     - A category **value** type — the discriminator stored on the model. Decision A (below)
       resolves this to a small string-literal union (e.g. `"bug_report" | "suggestion" |
       "other"`) exported as a type alias `FeedbackCategory`. (Not a TS `enum`: the providers
       precedent uses a separate enum that lives in a *shared* layer `src/llm/`; here the value
       set is local to this feature and has no shared-type home, so a local string-literal union
       is the honest minimal shape.)
     - A `CategoryOption` interface: `{ value: FeedbackCategory; label: string; subjectPrefix:
       string }` — the exact shape-precedent of `ProviderOption` (`value` + `label` + one extra
       per-row datum), with `subjectPrefix` playing the role `endpoint` plays there.
     - A `CATEGORY_OPTIONS: readonly CategoryOption[]` `as const`-style readonly array with
       exactly three rows, label + locked prefix per the master plan:
       - Bug report → label `"Bug report"`, `subjectPrefix` `"[Mirror][Feedback - Bug Report]: "`
       - Suggestion → label `"Suggestion"`, `subjectPrefix` `"[Mirror][Feedback - Suggestion]: "`
       - Other → label `"Other"`, `subjectPrefix` `"[Mirror][Feedback - Other]: "`
     - The prefix strings are stored as the literal bracketed prefix; the trailing `"<Subject>"`
       placeholder from the master plan is NOT stored — Phase 3 composes `subjectPrefix +
       subject`. Decision B (below) places the prefix here, on the reference row, so the
       mapping is never hardcoded in the Phase 3 service.
  3. `src/feedback/models/index.ts` — barrel re-exporting `./FeedbackSubmission` (mirrors
     `src/settings/models/index.ts`).
  4. `src/feedback/reference/index.ts` — barrel re-exporting `./Categories` (mirrors
     `src/settings/reference/index.ts`).
  - One new test file `src/__tests__/feedback/Feedback.test.ts` (tests live under
    `src/__tests__/<feature>/`, not co-located — confirmed by the existing
    `src/__tests__/settings/Settings.test.ts`).

  **Decision A — category value as a string-literal union, not a separate `reference/` table
  of bare values and not a TS enum.** Chosen against an inline union declared *in the model
  file* (would scatter the set: model would own the discriminator while the reference table
  owns labels/prefixes — two sources of truth for "which categories exist"). The union type is
  declared *in the reference module* alongside `CATEGORY_OPTIONS` and re-exported for the model
  to consume, so the reference module is the single source of the category set. Grounded in the
  `PROVIDER_OPTIONS` precedent (reference module owns the selectable set) and 1.2/6.10
  (reference data is not a domain model).

  **Decision B — the category→subject-prefix mapping lives on the `CategoryOption` row in
  `reference/Categories.ts`.** Chosen against a separate standalone `CATEGORY_SUBJECT_PREFIXES`
  map object and against (per the master plan's explicit note) hardcoding it in the future
  Phase 3 service. Co-locating the prefix with its category row is the direct analogue of
  `ProviderOption.endpoint` carrying per-row config, keeps the set and its prefixes in one
  place, and gives Phase 3 a lookup it reads rather than a mapping it owns.

- **Out of scope** (the wall) —
  - **No db layer / no `feedback/db/`, no DTO, no `src/db/Database.ts` schema change.** The
    locked `mailto:` transport means feedback is never persisted; the most tempting overreach
    here is "scaffold the db module while the feature folder is fresh" — forbidden. (Master
    plan: no `feedback/db` at all.)
  - **No store** (`feedback/stores/`) — that is Phase 2's reactive form state. The model is
    *designed* to be store-ready (total, optional-as-`undefined`) but no `defineStore` is written.
  - **No mappers.ts** — there is no DB or view boundary to transform across in this phase.
  - **No service** (`feedback/services/`), no `mailto:` composition, no subject *composition*
    logic — Phase 3 reads `subjectPrefix` and concatenates; Phase 1 only stores the strings.
  - **No UI / no component / no modal / no validation logic** — Phases 2 and 4.
  - **No nav wiring / no `App.vue` change** — Phase 5. The `mailto:` links at App.vue lines 48
    and 55 are untouched.
  - **No Zod / no boundary schema** — feedback input is internal (typed-in form fields), not an
    untrusted external boundary (CONVENTIONS 1.9); no validation schema in this phase.

- **Doctrine cited** —
  - `mirror/app/CONVENTIONS.md` §1: 1.1 (one canonical domain model, plain data, no key/wire
    shape), 1.2 (reference/lookup data is not a domain model — lives in a reference module),
    1.3 (co-located `createEmpty*`, total model for a reactive store), 1.11 (fields name what
    they hold honestly); §6: 6.10 (folder names tell the truth — `models/` holds the model,
    `reference/` holds the lookup table).
  - `brand/ETHOS.md` C1.1 (the model holds user-authored content and stays local by default —
    no transmission, no persistence introduced here). C2 (no telemetry) is satisfied vacuously:
    nothing in this phase counts, records, or transmits anything, including the category.

- **Tests-as-descriptions** (vitest; repo runs `bun run test`; match the existing
  `src/__tests__/settings/Settings.test.ts` shape) —
  1. **Factory returns a zeroed, unconfigured submission.** Calling
     `createEmptyFeedbackSubmission()` yields `category === undefined`, and `email`, `subject`,
     `content` each `=== ""`. *Catches: a factory that pre-selects a category (which would
     pre-empt Phase 2's validation fork) or seeds a non-empty string.*
  2. **Factory is total — exactly the four expected keys are present.** `Object.keys` of the
     result equals exactly `["category", "email", "subject", "content"]` (order-independent).
     *Catches: a missing key (would break `toRefs`/`Object.assign` in the Phase 2 store) or a
     stray extra field — this is the totality contract 1.3 depends on, not a framework
     guarantee.*
  3. **The category set is exactly the three locked categories.** The `value`s in
     `CATEGORY_OPTIONS` are exactly the three category values, no more and no fewer. *Catches:
     a dropped category, a duplicate, or an accidental fourth — the set is locked by the master
     plan.*
  4. **Each category carries its locked subject-prefix verbatim.** For each of the three rows,
     `subjectPrefix` equals the exact locked string: Bug report → `"[Mirror][Feedback - Bug
     Report]: "`, Suggestion → `"[Mirror][Feedback - Suggestion]: "`, Other → `"[Mirror]
     [Feedback - Other]: "`. *Catches: a typo in the bracketed prefix, wrong casing
     ("Bug report" vs "Bug Report"), a missing trailing space, or a mismatched category→prefix
     pairing — Phase 3's mail classification depends on these being byte-exact.*
  5. **Each category carries a non-empty human label.** Every row's `label` is a non-empty
     string. *Catches: a row shipped with a blank label, which Phase 2's selector would render
     as an empty option.*

  (No test asserts that the model "type-checks" or that a `readonly` array is immutable —
  those are TypeScript/runtime guarantees, not behavior this phase introduces.)

- **Deliverable** — When the phase is done these exist and nothing else changed:
  - `src/feedback/models/FeedbackSubmission.ts`
  - `src/feedback/models/index.ts`
  - `src/feedback/reference/Categories.ts`
  - `src/feedback/reference/index.ts`
  - `src/__tests__/feedback/Feedback.test.ts`
  No other file (notably `App.vue`, `src/db/Database.ts`, the router) is modified.

- **Verify** — This phase's gate plus the global gate:
  - `bunx vue-tsc --noEmit` — clean for the new files; no NEW type errors versus the red
    baseline the implementer establishes at build time (judge per touched file; do not invent
    counts). Use `vue-tsc`, never bare `tsc`.
  - `bun run test` — the new `src/__tests__/feedback/Feedback.test.ts` passes (all five
    descriptions green), and no previously-green test regresses. Report exact pass counts from
    the actual run.
  - Global gate (`env-and-verify.md`): `bun` only (never npm/npx/node); no new
    `console.log`/dead code/silent stub; dependency direction holds (this phase adds only leaf
    files — a model and a reference table — with no upward edge and no import of store/service/
    view/db); the Out-of-scope wall is respected (no db, store, service, mapper, component, or
    `App.vue` touch); every claim in shipped comments is literally true.

---

## DECISION NEEDED

None. The two plan-time calls the master plan delegated to this phase (category set as a
reference table vs. inline union; where the category→subject-prefix mapping lives) are resolved
above as Decision A and Decision B, grounded in the `PROVIDER_OPTIONS` precedent and CONVENTIONS
1.2 / 6.10 — they are this planner's calls to make, not user-facing forks. No genuine
undecided design fork remains for Phase 1.
