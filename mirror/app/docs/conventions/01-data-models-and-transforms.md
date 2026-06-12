# 01 — Layered data models & transforms

## Scope
How data is modeled and how it crosses layer boundaries — for every feature, whether new, being
refactored, or being extended. Covers: where models live and what they may contain, the
domain/DTO/view-model split, transform functions, Zod's role, and the requirement that model and
field names describe their contents honestly.

## Problem
Without a rule, models accrete responsibilities and shapes multiply: the same concept ends up with
two competing models, `models/` folders fill with non-model data, persistence and view concerns leak
into the domain, and code passes one layer's shape straight into another. The result is that a change
in the database or a view forces edits across unrelated code, and "which model is the real one" stops
having an answer.

## Current state (examples of what this rule exists to prevent)
- Two persona shapes coexist: the new domain `Persona` (`src/persona/models/Persona.ts`, flat,
  camelCase, enum-based, with `createEmptyPersona()`) and the old snake_case nested `PersonaJSON`.
- `PersonaJSON` lived in `src/types/` which has been **deleted**, yet is still imported (dangling) by
  `src/profile/services/profileRenderer.ts:1`, `src/profile/services/html.ts:1`,
  `src/insight/pages/InsightPage.vue:6`, and `src/interview/components/InterviewInstrument.vue:26`.
- `src/interview/models/index.ts` is named a model but holds `LLM_CONTEXT_WINDOW_LIMIT` +
  `getContextWindowLimit()` — an LLM pricing/context lookup, not a domain type.
- `src/interview/prompts/index.ts:5-21` declares `FacetKey`/`FacetMeta`/`FACETS` (interview domain
  data) under `prompts/`.
- `src/persona/models/Persona.ts`: `PersonaSkill` (`:30`) has no `name`; `carreer` (`:9`) is
  misspelled; `personal` (`:11`) is typed `PersonaCareer[]` though it represents non-professional
  activity, not a career role.
- Zod is dead weight: `src/persona/personaSchemas.ts` is entirely commented out.

## Decision
Every feature organizes its data into layered models bridged only by transform functions. The default
is two layers: a hand-written **domain model** per feature (pure data + factories, no persistence id,
no behavior, no DB/wire shape) and a **DTO** per persisted entity, owned by the DB layer. A **view
model** is added only where a view genuinely reshapes or narrows the domain model. Transforms live in
a per-feature `mappers.ts`, named `to<Target>`/`from<Source>`. Zod is used only to validate untrusted
input at the app's boundaries (LLM output, imported files); everything internal trusts TypeScript.
Models and their fields are named to describe their contents truthfully. These rules apply equally
when building a new feature, refactoring, or extending an existing one.

## Rules
1. Each feature owns exactly one canonical **domain model** under `<feature>/models/`. A domain model
   is plain data and enums describing the feature's concepts — no persistence id/key, no behavior, no
   DB or wire (LLM/HTTP) shape. New features start here; existing features converge to one.
2. `<feature>/models/` contains only domain types and their factory helpers. Data that is not a
   domain type — lookup/reference tables, pricing data, prompt text, configuration — lives in a
   service or reference module, never in `models/`, even though it is "data".
3. A domain model may export factory helpers that construct it (e.g. `createEmpty<X>()`), co-located
   in the model file.
4. Every persisted entity has a **DTO** owned by the DB layer. The DTO is the only shape the database
   reads or writes; persistence keys/ids live on the DTO, never on the domain model.
5. Data crosses a layer boundary only through a **transform function** — never by passing one layer's
   model directly into another.
6. Transforms live in a per-feature `mappers.ts` (`<feature>/mappers.ts`), named `to<Target>` /
   `from<Source>` (e.g. `toXxxDTO`/`fromXxxDTO` at the DB boundary, `toXxxView` for a view).
7. Add a **view model** only where a view reshapes or narrows the domain model — filtering fields,
   regrouping, or flattening for display. Declare it under `<feature>/models/` and build it with a
   transform; never reshape the domain model inline inside the view/template.
8. Default to two layers (domain ↔ DTO). Do not introduce a view model when the view can consume the
   domain model as-is.
9. Validate with **Zod only at untrusted boundaries** — data entering from outside the app (LLM
   output, imported files, external APIs). Define the boundary schema once, `safeParse` the input,
   then transform the validated result into the domain model. Do not Zod-validate internal calls or
   trusted reads such as our own database.
10. Derive a boundary type from its Zod schema via `z.infer` so schema and type cannot drift. Domain
    models remain hand-written interfaces (not Zod-derived).
11. A model's name, and the name and type of each field, must honestly and completely describe what
    it holds. A field typed as a different concept's model, a missing identifying field, or a
    misspelled name is a model defect to correct.

## Rationale
Layered models bridged by transforms keep persistence and presentation concerns out of the domain, so
a database or UI change stays contained to its layer. For a single maintainer, a two-layer default
avoids boilerplate where it earns nothing, while still permitting a view model exactly where a view
genuinely reshapes data. One `mappers.ts` per feature gives a single obvious place to find any
boundary crossing. Confining Zod to untrusted edges puts runtime validation where data genuinely
cannot be trusted (and TypeScript offers no protection), while `z.infer` makes those schemas pay for
themselves by also producing the boundary types — without spreading a foreign dependency through
internal code. Honest model/field names keep "which model is the real one" answerable.

## Before / After
(Real snippets, used to illustrate the generic rules.)

### Rule 11 — honest, complete model shape
Before (`src/persona/models/Persona.ts:9-11,30`):
```ts
carreer: PersonaCareer[],
personal: PersonaCareer[],
// ...
export interface PersonaSkill {
    category: PersonaSkillCategory,
    level: PersonaSkillLevel,
    source: PersonaSkillSource
}
```
After:
```ts
career: PersonaCareer[],
personal: PersonaNonProfessional[],
// ...
export interface PersonaSkill {
    name: string,
    category: PersonaSkillCategory,
    level: PersonaSkillLevel,
    source: PersonaSkillSource,
}
export interface PersonaNonProfessional {
    activity: string,
    skillsRevealed?: PersonaSkill[],
    note?: string,
}
```

### Rule 2 — non-model data leaves `models/`
Before: `src/interview/models/index.ts` exports `LLM_CONTEXT_WINDOW_LIMIT` + `getContextWindowLimit()`.
After: that lookup moves to a reference/service module (e.g. `src/interview/services/contextWindow.ts`);
`src/interview/models/` holds only interview domain types (and `FacetKey`/`FACETS`, relocated from
`prompts/` per the same rule).

### Rules 5–7 — cross boundaries with a transform / view model
Before (`src/profile/services/profileRenderer.ts:1,10-11`):
```ts
import type { PersonaJSON, Skill, Strength, CareerEntry, NonProfessionalEntry } from "../../types/persona";
export function renderProfile(persona: PersonaJSON, howIWorkBest: string[]): string {
  const p = persona.persona;
```
After:
```ts
import type { ProfileView } from "../models/ProfileView";
// ProfileView is built by toProfileView(persona) in profile/mappers.ts
export function renderProfile(view: ProfileView): string {
  // view exposes only public fields, skills already grouped — no reshaping here
```

### Rule 4 — DTO at the DB edge, not the domain model
Before: a store reads/writes the domain shape straight to IndexedDB (the DB key rides along on it).
After: `src/persona/mappers.ts` exports `toPersonaDTO(persona): PersonaDTO` /
`fromPersonaDTO(dto): Persona`; `PersonaDTO` (with its key) is declared by the DB layer; the domain
`Persona` carries no persistence id.

## Confirmed preferences & rejected alternatives
- Chosen: Domain + DTO default; view model only when a view reshapes.
- Chosen: per-feature `mappers.ts` with `to<Target>`/`from<Source>` naming.
- Chosen: factory helpers co-located in the model file.
- Chosen: Zod scoped to untrusted boundaries (LLM extraction + JSON import) only.
- Chosen: delete `PersonaJSON`; renderers consume the domain model via a view-model transform.
- Rejected: a single shared model with no DTO — lets persistence id/shape leak into views.
- Rejected: mandating three layers everywhere — boilerplate with no payoff for a solo maintainer.
- Rejected: Zod at DB read or on internal calls — boilerplate; the DB is trusted.
- Rejected: dropping Zod entirely — the LLM boundary genuinely needs runtime validation.
- Rejected: resurrecting the old snake_case shape as a view model — it is a former domain model, not
  a clean projection.
- Rejected: transforms in the DB layer or beside the DTO — chose per-feature `mappers.ts`.

## Open / deferred
- Exact DTO field lists and which DB-layer file declares them → Session 2 (layering / where the DB
  layer lives).
- Whether derived/transient fields (e.g. metrics, interview transcript) belong in a persisted DTO →
  deferred.
- How a failed `safeParse` surfaces (throw vs. Result) → Session 4 / Session 7 (error handling).
- Precise view-model field sets (e.g. `ProfileView`/`InsightView`) → renderer-rework detail.
- Broader naming rules beyond model shape (handlers, booleans, honest function names) → Session 6.
