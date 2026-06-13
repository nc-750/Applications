---
name: vue-feature-architecture
description: >-
  Binding architecture doctrine for a local-first Vue 3 + TypeScript + Pinia + IndexedDB app: the
  one-way layer graph (view → service → store → db), per-feature domain models + DTOs bridged only by
  mapper transforms, real defineStore setup stores, functional-core/imperative-shell services, a
  shared client/factory layer, Zod only at untrusted boundaries, utilities & cross-cutting placement,
  honest naming, and one error strategy per layer. Use this skill WHENEVER writing, refactoring,
  structuring, or reviewing a feature in such a codebase — deciding where a piece of code belongs (a
  query, a store action, business logic, a transform, a validation/Zod schema, a helper, a constant),
  scaffolding a new feature folder, splitting a god-component or god-view, fixing a Pinia store that
  holds logic or isn't a real defineStore, deduplicating client/construction copied across views,
  naming a function / file / boolean / event handler, or handling errors across layers. Trigger even
  when the user never says "architecture" or "conventions": any "where should this go", "how should I
  structure this", "which layer owns this", "review my store/service/component", or "this view does
  too much" situation in a Vue + Pinia + IndexedDB project. Do NOT trigger for project/tooling setup
  (installing or registering Pinia/router in main.ts), test-runner or fake-indexeddb mocking config,
  component CSS / responsive / visual styling, generic Vue concept questions (ref vs reactive,
  Options-to-script-setup syntax), or LLM model/cost choices — those belong to other skills.
---

# Vue feature architecture

A binding code-structure doctrine for a **local-first** single-page app on this stack: **Vue 3**
(`<script setup>` SFCs) · **TypeScript** (strict) · **Pinia** (setup stores) · **IndexedDB** (via a
wrapper such as `idb`) · optional desktop wrapper (e.g. Tauri). It answers one question precisely:
**given a piece of code, which layer owns it, and what shape must it take?**

> This skill is **stack-generic** — it names no specific product. Apply the *rules* to the code in
> front of you. Examples use placeholder names (`<Feature>`, `FooStore`, `Widget`); never copy an
> example's names verbatim.

## How to read this doctrine

- **The numbered rules in the reference files are binding.** Rationale and examples are support.
- **When a rule and an example seem to disagree, the rule wins.** Examples were captured from real
  code and may not match what you are touching.
- **"After" snippets describe target shapes, not existing files.** Do not assume a module shown in an
  example (`mappers.ts`, `lib/`, `core/`, a factory) already exists — check first, create when the
  work calls for it.
- This is **the structural half** of the system. The *visual* presentation layer (component design
  system / instrument contract — how a screen is composed from design-system primitives) lives in a
  separate design-system skill. This skill covers component *structure* (one job per component,
  duplication, extraction, dead code, errors) but not visual styling vocabulary.

## The four principles

1. **Each layer owns its own data model.** Data crosses a layer boundary only through a transform
   function — never by passing one layer's shape into another.
2. **One dependency direction:** `view → service → store → db`. Views additionally bind to store
   state read-only and call services. **Nothing depends upward.**
3. **Service decides, store commits, db persists, view renders.** App logic lives in services; stores
   hold the live reactive copy of state; the db module owns persistence; views display.
4. **Names, folders, and types tell the truth.** Dead code is deleted, not parked; unfinished code is
   marked `// TODO`, never left a silent stub.

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

## The binding checklist (by layer)

Read the matching reference file before non-trivial work; the one-line reminders below are the spine.

- **Models & transforms** → [references/data-models.md](references/data-models.md)
  - One canonical domain model per feature; plain data + factory helpers only; no key, no behavior,
    no wire/DB shape. Cross every boundary through a `mappers.ts` transform. Zod **only** at untrusted
    boundaries (LLM output, imported files, external APIs), with `z.infer` for the boundary type.

- **Layering & data flow** → [references/layering.md](references/layering.md)
  - One direction `view→service→store→db`. The db module is the **sole** owner of persistence. A
    store action does at most two things: assign reactive state + persist via db. Services own logic
    and receive stores by injection. Views never build infrastructure or mutate a model.

- **Stores** → [references/stores.md](references/stores.md)
  - Every store is a real `defineStore` **setup store** with a **flat** return surface. No store
    aggregates/spreads another (no god-facade). Stores are **leaf** (import only own models + own db).
    Consumers import the specific store they need.

- **Services** → [references/services.md](references/services.md)
  - Plain function modules (not classes), as **functional core + imperative shell**. Pure helpers
    take explicit args (no store/refs). One orchestrator does the I/O and commits **through the
    store**. Shared construction lives in one factory; an app-enum→library-discriminator mapping
    exists exactly once. A composable (`useX()`) is a reactive adapter only — no logic.

- **Utilities & cross-cutting** → [references/utilities.md](references/utilities.md)
  - Foundational modules depend **downward only** — never on a store/service/view. Generic helpers in
    `src/lib/<concern>.ts`; no lateral feature→feature helper imports. Cross-feature lifecycle in
    `src/core/`.

- **Naming** → [references/naming.md](references/naming.md)
  - A name states what a thing **is/does** with no hidden behavior. `get*/is*/has*` have no side
    effects. A boolean reads **true exactly when its condition holds**. Event handlers are `onX`;
    emits are camelCase. Source files PascalCase (`index.ts` is the barrel). Folders/types describe
    their contents truthfully. **Fix wrong names on touch.**

- **Component structure & errors** → [references/structure-and-errors.md](references/structure-and-errors.md)
  - One job → one component; when two exist, promote one and delete the other. Never implement one
    behavior twice (extract shared behavior to a composable, shared markup to a component). Delete
    dead code; mark intentional gaps `// TODO`; no stray `console.log`. **One error strategy per
    layer:** services log-and-throw; the calling edge propagates or catches into reactive error
    state; no sentinels, no log-and-swallow.

## Applying this to a whole feature (bottom-up)

When building or refactoring a feature, work in dependency order so each layer rests on a finished
one: **model → reference data → db + mappers → store → services (+ shared factories) → view.** Each
step has a hard boundary — don't reach up into a layer you haven't built yet. This ordering is the
spine of the companion *feature-refactor playbook* skill.

## Verification gate (every change)

- `bunx tsc --noEmit` is clean. (This stack uses **bun** — `bun run <script>`, `bunx <bin>`; never
  `npm`/`npx`/`node`.)
- The relevant `bun run test` (vitest) suite is green; update tests that referenced old shapes.
- No new `console.log`, dead code, or silent stubs introduced.
- The dependency direction holds: grep your diff for a store importing another store/service, a view
  building a client or calling a db query, or a DTO/`id` field surfacing in a store or view.
- Any name you touched is honest (no `get*` with side effects, no inverted boolean, no misnamed
  folder).
```
