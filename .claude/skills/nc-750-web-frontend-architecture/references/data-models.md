# Data models & transforms

How data is modeled and how it crosses layer boundaries — for every feature, new or refactored.
Covers where models live, what they may contain, the domain/DTO/view-model split, transform
functions, Zod's role, and honest model/field names.

> **Binding source:** `mirror/app/CONVENTIONS.md §1`. This file distills those rules with rationale
> and examples; when they disagree, `CONVENTIONS.md` wins.

## Why this exists

Without a rule, models accrete responsibilities and shapes multiply: one concept ends up with two
competing models, `models/` folders fill with non-model data, persistence and view concerns leak into
the domain, and code passes one layer's shape straight into another. Then a DB or UI change forces
edits across unrelated code and "which model is the real one" stops having an answer.

## Rules (binding)

1. **One canonical domain model per feature**, under `<feature>/models/`. A domain model is plain
   data and enums describing the feature's concepts — **no persistence id/key, no behavior, no DB or
   wire (LLM/HTTP) shape.** New features start here; existing features converge to one.
2. **`<feature>/models/` contains only domain types and their factory helpers.** Data that is not a
   domain type — lookup/reference tables, pricing data, prompt text, configuration — lives in a
   service or reference module, never in `models/`, even though it is "data".
3. A domain model may export **factory helpers** that construct it (e.g. `createEmpty<X>()`),
   co-located in the model file. **When the model backs a reactive store** (consumed via `toRefs` and
   replaced via `Object.assign` — see [reactive-persistence.md](reactive-persistence.md)) it must be
   **total**: `createEmpty<X>()` sets *every* field including optionals (`field: undefined`), optional
   fields are typed `field: T | undefined` (not `field?: T`), and a field with a meaningful default is
   filled by its factory (e.g. a `createX()` that defaults a required `isError: boolean` to `false`)
   rather than left to each call site. A partial model silently breaks `toRefs` (no ref minted for an
   absent key) and `Object.assign` resets (a stale value survives).
4. **Every persisted entity has a DTO owned by the DB layer.** The DTO is the only shape the database
   reads or writes; persistence keys/ids live on the DTO, **never** on the domain model.
5. **Data crosses a layer boundary only through a transform function** — never by passing one layer's
   model directly into another.
6. **Transforms live in a per-feature `<feature>/mappers.ts`**, named `to<Target>` / `from<Source>`
   (e.g. `toXxxDTO`/`fromXxxDTO` at the DB boundary, `toXxxView` for a view).
7. **Add a view model only where a view genuinely reshapes or narrows** the domain model (filtering
   fields, regrouping, flattening for display). Declare it under `<feature>/models/` and build it
   with a transform; never reshape the domain model inline in the view/template.
8. **Default to two layers (domain ↔ DTO).** Do not introduce a view model when the view can consume
   the domain model as-is.
9. **Validate with Zod only at untrusted boundaries** — data entering from outside the app (LLM
   output, imported files, external APIs). Define the boundary schema once, `safeParse` the input,
   then transform the validated result into the domain model. Do **not** Zod-validate internal calls
   or trusted reads such as your own database.
10. **Derive a boundary type from its Zod schema via `z.infer`** so schema and type cannot drift.
    Domain models stay hand-written interfaces (never Zod-derived).
11. **A model's name, and each field's name and type, must honestly and completely describe what it
    holds.** A field typed as a different concept's model, a missing identifying field, or a
    misspelled name is a model defect to correct.

## Rationale

Layered models bridged by transforms keep persistence and presentation out of the domain, so a DB or
UI change stays contained. A two-layer default avoids boilerplate that earns nothing, while still
permitting a view model exactly where a view truly reshapes data. One `mappers.ts` per feature gives a
single place to find any boundary crossing. Confining Zod to untrusted edges puts runtime validation
only where TypeScript offers no protection, and `z.infer` makes those schemas pay for themselves by
producing the boundary types. Honest names keep "which model is the real one" answerable.

## Before / After (illustrative — genericize to your code)

### Rule 11 — honest, complete model shape
```ts
// ❌ before — a misspelling, a type reused for a different concept, an entity that can't identify itself
interface Account {
    carreer: Role[],        // misspelled
    personal: Role[],       // "personal activity" is not a career Role
}
interface Skill { category: SkillCategory, level: SkillLevel }   // a skill with no name

// ✅ after — each concept gets a truthful type + its identifying field
interface Account {
    career: Role[],
    personal: NonProfessional[],
}
interface Skill { name: string, category: SkillCategory, level: SkillLevel }
interface NonProfessional { activity: string, skillsRevealed?: Skill[], note?: string }
```

### Rule 2 — non-model data leaves `models/`
```ts
// ❌ before — <feature>/models/index.ts exports a lookup table + accessor
export const RATE_LIMIT: Record<string, number> = { /* … */ };
export function getRateLimit(key: string): number { /* … */ }

// ✅ after — the lookup moves to a reference/service module; models/ holds only domain types
// <feature>/services/RateLimits.ts  (or a reference module)
```

### Rules 5–7 — cross a boundary with a transform / view model
```ts
// ❌ before — a renderer takes a foreign/old persistence shape and reshapes inline
export function render(record: LegacyRecord): string { const p = record.payload; /* reshape here */ }

// ✅ after — a view model built by a transform; the renderer does no reshaping
import type { FooView } from "../models/FooView";   // built by toFooView(foo) in <feature>/mappers.ts
export function render(view: FooView): string { /* view already narrowed + grouped */ }
```

### Rule 4 — DTO at the DB edge, not on the domain model
```ts
// ✅ <feature>/mappers.ts
export function toFooDTO(foo: Foo): FooDTO { return { key: "default", ...serialize(foo) }; }
export function fromFooDTO(dto: FooDTO): Foo { return deserialize(dto); }
// FooDTO (with its key) is declared by the DB layer; the domain Foo carries no persistence id.
```

## Confirmed preferences (and what was rejected)

- **Chosen:** domain + DTO default; view model only when a view reshapes; per-feature `mappers.ts`
  with `to<Target>`/`from<Source>`; factory helpers co-located in the model file; Zod scoped to
  untrusted boundaries only.
- **Rejected:** a single shared model with no DTO (lets persistence id/shape leak into views);
  mandating three layers everywhere (boilerplate with no payoff); Zod on DB reads or internal calls
  (the DB is trusted); dropping Zod entirely (the LLM/import boundary genuinely needs it); transforms
  living in the DB layer or beside the DTO (chose per-feature `mappers.ts`).

## Verify

- `models/` imports only types + factories — grep for any exported `const` table or function with I/O.
- A model backing a reactive store is total: `createEmpty<X>()` sets every field; optionals typed
  `T | undefined`, not `T?`; required-but-defaulted fields filled by a factory.
- Every persisted entity has a DTO in the db layer and a `to`/`from` pair in `mappers.ts`.
- No domain interface carries a persistence key; no view template reshapes a model inline.
- Every Zod schema sits at an untrusted boundary and feeds a `z.infer` type.
