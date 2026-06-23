---
name: nc-750-web-frontend-architecture
description: >-
  Binding code-structure doctrine for the NC-750 Mirror app (NODE-0M) and any NC-750 local-first web
  frontend on its stack — Vue 3 + TypeScript + Pinia + IndexedDB behind a Tauri shell: the one-way
  layer graph (view → service → store → db), per-feature domain models + DTOs bridged only by mapper
  transforms, real defineStore setup stores, functional-core/imperative-shell services, a shared
  client/factory layer, Zod only at untrusted boundaries, utilities & cross-cutting placement, honest
  naming, and one error strategy per layer. The canonical numbered rules live in
  `mirror/app/CONVENTIONS.md`; this skill is the navigable spine that cites them. Use this skill
  WHENEVER writing, refactoring, structuring, or reviewing a feature in such a codebase — deciding
  where a piece of code belongs (a query, a store action, business logic, a transform, a
  validation/Zod schema, a helper, a constant), scaffolding a new feature folder, splitting a
  god-component or god-view, fixing a Pinia store that holds logic or isn't a real defineStore,
  deduplicating client/construction copied across views, naming a function / file / boolean / event
  handler, or handling errors across layers. Trigger even when the user never says "architecture" or
  "conventions": any "where should this go", "how should I structure this", "which layer owns this",
  "review my store/service/component", or "this view does too much" situation in a Vue + Pinia +
  IndexedDB project. Do NOT trigger for project/tooling setup (installing or registering Pinia/router
  in main.ts), test-runner or fake-indexeddb mocking config, component CSS / responsive / visual
  styling (that is the `nc-750-frontend-presentation` skill), generic Vue concept questions (ref vs
  reactive, Options-to-script-setup syntax), or LLM model/cost choices.
---

# NC-750 web frontend architecture

A binding code-structure doctrine for the **Mirror** app (NODE-0M) and any NC-750 **local-first** web
frontend on this stack: **Vue 3** (`<script setup>` SFCs) · **TypeScript** (strict) · **Pinia** (setup
stores) · **IndexedDB** (via a wrapper such as `idb`) · a **Tauri** desktop shell. It answers one
question precisely: **given a piece of code, which layer owns it, and what shape must it take?**

> **Binding source — cite, don't restate.** The canonical numbered rules live in Mirror's own
> [`mirror/app/CONVENTIONS.md`](../../../mirror/app/CONVENTIONS.md) (§1 data models, §2 layering,
> §3 stores, §4 services, §5 utilities/cross-cutting, §6 naming, §7 components/duplication/errors,
> §8 verification), with [`mirror/app/CLAUDE.md`](../../../mirror/app/CLAUDE.md) as the stack, the
> `src/` tree map, and the key design decisions. This skill is the **navigable spine** over those
> rules — the principles, the layer graph, the decision table, and the per-layer checklist each point
> at the binding `CONVENTIONS §N`. **When this skill and `CONVENTIONS.md` disagree, `CONVENTIONS.md`
> wins.** Examples cite real Mirror artifacts as *illustration*: the rule is binding, the names are
> not — never copy an example's names verbatim.

## How to read this doctrine

- **The numbered rules (in `CONVENTIONS.md` and distilled in the reference files) are binding.**
  Rationale and examples are support.
- **When a rule and an example seem to disagree, the rule wins.** Examples were captured from real
  code and may not match what you are touching.
- **"After" snippets describe target shapes, not existing files.** Do not assume a module shown in an
  example (`mappers.ts`, `lib/`, `core/`, a factory) already exists — check first, create when the
  work calls for it.
- This is **the structural half** of the system. The *visual* presentation layer — how a screen is
  composed from design-system primitives, the instrument contract — lives in the
  **`nc-750-frontend-presentation`** skill. This skill covers component *structure* (one job per
  component, duplication, extraction, dead code, errors), not visual styling vocabulary.

## The four principles

1. **Each layer owns its own data model.** Data crosses a layer boundary only through a transform
   function — never by passing one layer's shape into another. (`CONVENTIONS §1`)
2. **One dependency direction:** `view → service → store → db`. Views additionally bind to store
   state read-only and call services. **Nothing depends upward.** (`CONVENTIONS §2`)
3. **Service decides, store commits, db persists, view renders.** App logic lives in services; stores
   hold the live reactive copy of state; the db module owns persistence; views display.
   (`CONVENTIONS §2–§4`)
4. **Names, folders, and types tell the truth.** Dead code is deleted, not parked; unfinished code is
   marked `// TODO`, never left a silent stub. (`CONVENTIONS §6–§7`)

## The layer graph

```
        ┌─────────┐   binds read-only state ↓   calls services ↓
        │  view   │ ─────────────┬───────────────────────┐
        └─────────┘              │                        │
                                 ▼                        ▼
                           ┌──────────┐  decides    ┌──────────┐
                           │  store   │◀────────────│ service  │  (owns app logic,
                           │ (live    │  commits    │ (plain   │   orchestration,
                           │ reactive │             │ funcs)   │   external I/O e.g. LLM/HTTP)
                           │ state)   │             └──────────┘
                           └────┬─────┘                   │
                   persists via │                         │ construction it shares
                                ▼                         ▼
                           ┌──────────┐            ┌───────────────┐
                           │   db     │            │ shared layer  │
                           │ (DTO +   │            │ src/llm, etc. │
                           │ queries) │            │ (factories)   │
                           └────┬─────┘            └───────────────┘
                                ▼
                        one IndexedDB connection
                        (central schema + version)

  foundational (logging, src/lib helpers, src/core lifecycle): depend DOWNWARD only —
  never on a store, service, or view.
```

Edges that exist: `view→service`, `view→store` (read-only binding + thin action calls),
`service→store`, `store→db`, anything→shared/foundational. **Every other edge is a defect** — most
of all a store importing another store or a service, or a view building infrastructure / mutating a
model.

## "Where does this code go?" — decision table

| You are writing… | It belongs in… | Key rules |
|---|---|---|
| A plain data type describing a feature's concept (no key, no behavior) | `<feature>/models/` (domain model) | 1.1, 1.11 |
| A constant lookup / pricing / reference table / prompt text / config | a service or reference module — **not** `models/` | 1.2, 6.10 |
| The persisted record shape (with its key/id) | the db layer's **DTO** | 1.4, 2.9 |
| Converting between domain ↔ DTO (or domain → view model) | `<feature>/mappers.ts` (`to<Target>`/`from<Source>`) | 1.5, 1.6 |
| A multi-step flow, a decision, an external call (LLM/HTTP) | `<feature>/services/` (orchestrator) | 2.4, 4.1 |
| A pure transform / parse / coerce / predicate / prompt-builder | `<feature>/services/` (pure helper, explicit args) | 4.3, 4.4 |
| Opening the DB, running a query, applying the DTO transform | the db layer **only** | 2.2, 2.8 |
| Assigning reactive state + persisting it | a **thin** store action | 2.3, 3.5 |
| Deciding the next value of state | a **service**, which hands it to a store action | 2.6, 2.7 |
| Work that needs two stores | a service that receives **both** by injection | 3.6, 2.5 |
| Building an LLM/HTTP client from settings (shared construction) | a shared factory layer (e.g. `src/llm/`) | 4.7, 4.8 |
| A generic, feature-agnostic helper (dom, file, platform) | `src/lib/<concern>.ts` — never a catch-all `utils.ts` | 5.4, 5.5 |
| App-wide lifecycle (factory reset, boot wiring) | `src/core/` — composes each feature's own ops | 5.7, 5.8 |
| Foundational state a UI only toggles/displays (debug flag, log buffer) | the foundational module as module-level reactive state | 5.3 |
| Reacting to a DOM event or component emit | a view handler named `onX` | 6.6, 6.8 |
| Rendering, binding state, calling a service | the **view** — no logic, no infra, no model mutation | 2.7, 4.1 |

If a piece of code seems to fit two rows, it is probably **two pieces** that should be split.

> **Real Mirror landmarks** (illustrative, confirmed present — the rule is binding, the names are
> not): the shared LLM client factory is `src/llm/factory.ts` (`createClientFromConfig`, the single
> `PROVIDER_KIND` mapping); the shared IndexedDB connection is `src/db/Database.ts` with the
> factory-reset `wipeDatabase()`, composed app-wide from `src/core/Wipe.ts`; per-feature db modules
> like `src/settings/db/SettingsDb.ts`; the single-aggregate reactive-store pattern in
> `src/settings/stores/SettingsStore.ts`, `src/interview/`, and `src/persona/`. `src/profile/` is
> currently a **stub** (per `CLAUDE.md`). Don't copy these names verbatim — apply the rule.

## The binding checklist (by layer)

Read the matching reference file before non-trivial work; each carries the distilled rules and a
pointer to its binding `CONVENTIONS §N`. The one-line reminders below are the spine.

- **Models & transforms** → [references/data-models.md](references/data-models.md) · binding source
  `CONVENTIONS §1`
  - One canonical domain model per feature; plain data + factory helpers only; no key, no behavior,
    no wire/DB shape. Cross every boundary through a `mappers.ts` transform. Zod **only** at untrusted
    boundaries (LLM output, imported files, external APIs), with `z.infer` for the boundary type.

- **Layering & data flow** → [references/layering.md](references/layering.md) · binding source
  `CONVENTIONS §2`
  - One direction `view→service→store→db`. The db module is the **sole** owner of persistence. A
    store action does at most two things: assign reactive state + persist via db. Services own logic
    and receive stores by injection. Views never build infrastructure or mutate a model.

- **Stores** → [references/stores.md](references/stores.md) · binding source `CONVENTIONS §3` (the
  single-aggregate reactive shape is detailed in [references/reactive-persistence.md](references/reactive-persistence.md))
  - Every store is a real `defineStore` **setup store** with a **flat** return surface. No store
    aggregates/spreads another (no god-facade). Stores are **leaf** (import only own models + own db).
    Consumers import the specific store they need.

- **Services** → [references/services.md](references/services.md) · binding source `CONVENTIONS §4`
  - Plain function modules (not classes), as **functional core + imperative shell**. Pure helpers
    take explicit args (no store/refs). One orchestrator does the I/O and commits **through the
    store**. Shared construction lives in one factory; an app-enum→library-discriminator mapping
    exists exactly once. A composable (`useX()`) is a reactive adapter only — no logic.

- **Utilities & cross-cutting** → [references/utilities.md](references/utilities.md) · binding source
  `CONVENTIONS §5`
  - Foundational modules depend **downward only** — never on a store/service/view. Generic helpers in
    `src/lib/<concern>.ts`; no lateral feature→feature helper imports. Cross-feature lifecycle in
    `src/core/`.

- **Naming** → [references/naming.md](references/naming.md) · binding source `CONVENTIONS §6`
  - A name states what a thing **is/does** with no hidden behavior. `get*/is*/has*` have no side
    effects. A boolean reads **true exactly when its condition holds**. Event handlers are `onX`;
    emits are camelCase. Source files PascalCase (`index.ts` is the barrel). Folders/types describe
    their contents truthfully. **Fix wrong names on touch.**

- **Component structure & errors** → [references/structure-and-errors.md](references/structure-and-errors.md)
  · binding source `CONVENTIONS §7`
  - One job → one component; when two exist, promote one and delete the other. Never implement one
    behavior twice (extract shared behavior to a composable, shared markup to a component). Delete
    dead code; mark intentional gaps `// TODO`; no stray `console.log`. **One error strategy per
    layer:** services log-and-throw; the calling edge propagates or catches into reactive error
    state; no sentinels, no log-and-swallow.

## Applying this to a whole feature (bottom-up)

When building or refactoring a feature, work in dependency order so each layer rests on a finished
one. The ladder, lowest rung first:

```
   model           the feature's canonical domain type — plain data, no key, no wire shape
     │
   reference data  the lookup tables / constants / config the model and prompts refer to
     │             (moved OUT of models/ — a table is not a domain model)
     │
   db + mappers    the DTO (persistence shape, owns the key) + to/from transforms; the sole
     │             owner of persistence, attached to the one shared connection
     │
   store           a real defineStore setup store: flat surface, thin actions
     │             (assign reactive state + persist via db), leaf (no other store/service)
     │
   prompts /       the external-I/O contracts: one pure builder per flow + its boundary
   contracts       schema co-located; the place a reader changes a given LLM/HTTP behavior
     │             (skip this rung for features with no external I/O — e.g. settings has none;
     │              in Mirror, <feature>/prompts/ exists for interview only)
     │
   services        functional core + imperative shell: pure helpers (explicit args) + one
     │ (+ shared    orchestrator per user flow that does the I/O and commits THROUGH the store;
     │  factories)  stores arrive by injection; log-once-and-throw. The shared client/factory
     │             layer (e.g. src/llm/factory.ts) is a service-layer concern.
     │
   view            the entry page → Bands → Cells; binds store read-only, calls services, never
                   builds infra or mutates a model; styled per nc-750-frontend-presentation
```

**Why bottom-up.** A layer can only be correct if the layer it depends on is already correct. Start at
the model and climb: each rung has a real, tested floor to stand on, and the boundary of "what this
step may touch" is obvious. If you start at the view you end up stubbing everything beneath it and
never finishing. It also means a half-done refactor still leaves the codebase compiling: the lower
layers are done and conformant, the upper ones simply not migrated yet. Each step has a hard boundary
— don't reach up into a layer you haven't built yet.

**Refactor vs. greenfield — same ladder.** Refactoring an existing feature, each rung also *deletes or
rewrites* the non-conformant version it replaces (a god-view's inline logic, a fake store, a lookup
table sitting in `models/`, dead commented files). Building a new feature, the rungs are the same with
nothing to tear down. Either way the discipline is identical, one rung at a time. Git is the history —
delete dead code, don't park it.

> **Sequencing the rungs is the nc-750 map→plan spine's job, not this skill's.** This skill owns the
> *ladder* (which layer rests on which). Decomposing a goal into ordered phases and gating each one is
> `nc-750-map` → `nc-750-plan` (see [`../nc-750/references/phase-brief-format.md`](../nc-750/references/phase-brief-format.md)).
> The ladder is doctrine; the session-by-session process is the spine's.

## Verification gate (every change)

This skill carries **no gate of its own**. The **canonical, whole** gate for every NC-750 build/review
is [`../nc-750/references/env-and-verify.md`](../nc-750/references/env-and-verify.md) — bun-only
(`bun` / `bunx` / `bun run`, never `npm`/`npx`/`node`); **`bunx vue-tsc --noEmit` (never bare `tsc`)**
for any `.vue`; **no NEW** type errors judged per touched file against the standing baseline; tests
green with exact counts; no new `console.log` / dead code / silent stub; dependency direction holds;
claims literally true.

`mirror/app/CONVENTIONS.md §8` (8.1–8.3) is Mirror's **partial** local restatement of only the
type-check-and-design-signal portion of that gate — 8.1 (no-new-errors, per-file attribution),
8.2 (`vue-tsc` not `tsc` for `.vue`), 8.3 (a gate failure on conformant-looking code is a design
signal). It **corroborates** those three clauses but does **not** cover bun-only, dead-code, or
dependency-direction; `env-and-verify.md` is the whole gate, §8 is not a competing or complete one.
