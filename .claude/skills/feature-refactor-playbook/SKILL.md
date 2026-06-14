---
name: feature-refactor-playbook
description: >-
  The repeatable process for refactoring an existing feature into conformance, or building a new one
  from scratch, in a layered local-first app (Vue 3 + TypeScript + Pinia + IndexedDB, optional Tauri).
  Turns "make this feature conform" or "add this feature" into an ordered, bottom-up plan: one phase
  per layer in dependency order (model → reference data → db + mappers → store → prompts/contracts →
  services → view), each phase a self-contained brief with explicit in-scope / out-of-scope / convention
  / deliverable / verify lines, run one-per-session so work never reaches up into an unbuilt layer. It
  is the PROCESS skill — it sequences and gates the work and points at its two companions for the
  actual rules: vue-feature-architecture for code structure and instrument-design-system for visual
  presentation. Use this skill WHENEVER the task is to refactor, restructure, modernize, or rebuild a
  whole feature to fit the conventions; to scaffold a brand-new feature end to end; to plan or
  sequence multi-layer work ("where do I start", "break this into phases", "what order do I build the
  model / store / service / view in", "this feature predates our conventions, bring it in line"); or
  to author or follow a phased master plan for such work. Trigger even when the user never says
  "refactor" or "playbook": any "rebuild / clean up / bring into conformance / lay out the work for
  this whole feature" request, or any ask to decompose a god-feature spanning several layers into
  staged steps. Do NOT trigger for a single-layer "where does THIS one piece of code go / review this
  store / name this function" question (that is vue-feature-architecture), for purely visual "how
  should this screen look" work (that is instrument-design-system), for project/tooling setup, or for
  a one-file bugfix that does not restructure a feature across layers.
---

# Feature-refactor playbook

The **process** for taking a whole feature from where it is to where the conventions want it — whether
that feature is a tangled god-view that predates the rules, or a greenfield folder that does not exist
yet. It answers one question: **in what order do I build or rebuild a feature's layers, and how do I
run each step so it stays correct and bounded?**

> This skill owns **sequencing and gating**, not the rules themselves. The substance lives in two
> companions; this playbook tells you *when* to consult each and *in what order* to do the work. Do
> not restate their rules here — link to them and move.

## The two companions this skill drives

| When you are deciding… | Consult | It owns |
|---|---|---|
| Where a piece of code goes, what shape a layer takes, how data crosses a boundary, how a store/service/mapper is built, how errors flow, how things are named | **`vue-feature-architecture`** | the **code-structure** axis — layering `view → service → store → db`, models + DTOs + mappers, stores, services, naming, dead-code/duplication, per-layer error strategy |
| How a screen looks and reads, what surface a control/readout/diagram sits on, which design-system element owns it, whether a reading is honest | **`instrument-design-system`** | the **presentation** axis — Chassis → Band → Cell, the instrument stance, the per-target visual contract |

Every phase below leans on one or both. The playbook's job is to make sure you do them **bottom-up,
one layer at a time, with a hard boundary on each step** — which is exactly what stops a "refactor"
from sprawling into a rewrite of the whole tree.

## The core idea: build along the dependency graph, bottom-up

The architecture is a one-way graph (`view → service → store → db`, with shared/foundational modules
underneath). A layer can only be correct if the layer it depends on is already correct. So you build
**from the bottom of the graph upward**, finishing and verifying each rung before standing on it:

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
     │             (skip this rung for features with no external I/O)
     │
   services        functional core + imperative shell: pure helpers (explicit args) + one
     │             orchestrator per user flow that does the I/O and commits THROUGH the store;
     │             stores arrive by injection; log-once-and-throw
     │
   view            the entry page → Bands → Cells; binds store read-only, calls services,
                   never builds infra or mutates a model; styled per instrument-design-system
```

**Why bottom-up.** If you start at the view you end up stubbing everything beneath it and never
finishing; if you start at the model and climb, each rung has a real, tested floor to stand on, and
the boundary of "what this step may touch" is obvious. It also means a half-done refactor still leaves
the codebase compiling: the lower layers are done and conformant, the upper ones are simply not
migrated yet.

## Refactor vs. greenfield — same ladder

- **Refactoring** an existing feature: the rungs are the same, but each phase also **deletes or
  rewrites** the non-conformant version it replaces (a god-view's inline logic, a fake store, a
  lookup table sitting in `models/`, dead commented files). Git is the history — delete dead code,
  don't park it.
- **Building** a new feature: the rungs are the same; there is just nothing to tear down. Scaffold
  each layer fresh.

Either way the discipline is identical: **one rung per session, finished and verified before the
next.**

## How to run it when triggered

When asked to refactor or build a whole feature, **produce an ordered phase plan first** — do not
start editing. The plan is a ladder of self-contained briefs, lowest rung first:

1. **Scope the feature.** Read its current tree. Name every layer that exists and every one missing.
   Note the shared infra it needs (a client factory, the db connection) — if that infra does not
   exist yet, those are **earlier, separate phases** (shared infra is below the feature on the graph).
2. **Map current state to the ladder.** For each rung, decide: build new, rewrite, or already fine.
   Identify the dead/duplicate code each rung will remove.
3. **Emit one brief per rung**, in bottom-up order, each using the brief shape below. Cite which
   companion skill governs that rung (structure, presentation, or both) — do **not** inline their
   rules.
4. **Run one brief per session.** A session takes the lowest incomplete rung, plans against its
   brief, implements, verifies, stops. Later rungs may assume earlier ones are done; **no rung reaches
   up into a later rung's area.**

> If a master plan already exists for this feature, you are *executing* it, not re-authoring it: pick
> the lowest incomplete phase, honor its **Out of scope** line as a hard wall, and verify against its
> gate.

## The per-phase brief shape

Every phase — whether you are authoring the plan or executing one step — is described by the same six
lines. The full copy-paste template is in [references/phase-brief.md](references/phase-brief.md);
the spine:

- **Goal** — the one outcome this rung delivers, in a sentence.
- **In scope** — the concrete artifacts to create/rewrite (files, functions, the dead code removed).
- **Out of scope** — the hard boundary. What this rung must **not** touch — typically the rung above
  it and any cross-cutting cleanup. This line is what keeps a refactor bounded; treat it as a wall.
- **Conventions** — which companion-skill rules apply (cite the skill + section; don't restate).
- **Deliverable** — the folder/files that exist when the rung is done.
- **Verify** — the rung's own gate (type-check + the targeted test that proves this layer works).

## Boundary discipline (what keeps this from becoming a rewrite)

- **One rung per session.** Finish and verify a layer before building on it. A session that "just
  also" fixes the view while doing the store has broken the boundary and is now unreviewable.
- **Never reach up.** A lower phase may not import, anticipate, or stub a higher phase's code. The
  model phase does not know the store exists; the store phase does not know the view exists.
- **Out of scope is a wall, not a suggestion.** Cross-cutting work you notice mid-phase (a global
  facade to delete, a sibling feature's defect, an export composer) gets **flagged as a follow-up**,
  not done now. Note it; leave it.
- **Touch-to-fix names, not to-fix scope.** Fix a wrong name on a line you are already editing (per
  `vue-feature-architecture` naming rules). Do not go hunting through untouched files for more.
- **The presentation rung is deferred to the end and to the other skill.** Do not style as you go.
  Layout and visual contract are the last rung and are governed entirely by
  `instrument-design-system` — the lower rungs are structure-only.
- **Pre-convention tests are outdated, not the spec.** A feature that predates the conventions usually
  ships tests that *pin the rejected shape* — a god-store `record`, a `Result`-object surface, an old
  `db/schema` path, business logic the new layer must not hold. Derive the layer's API from the
  **rules**, then **delete-and-replace** the stale test against the new shape. Never bend the new
  design to make an outdated test pass — shaping conformant code to a pre-convention test is the most
  common way a refactor silently re-imports the very pattern it was meant to remove. (Updating a test
  to a new shape is not "deleting coverage" — replace it, don't leave it red.)

## Verification gate

Each rung carries its own **Verify** line — satisfy it before the rung is done. On top of that, the
**global gate applies to every phase** (this is the `vue-feature-architecture` gate; honor it as-is):

- `bunx tsc --noEmit` is clean. (This stack uses **bun** — `bun run <script>`, `bunx <bin>`; never
  `npm`/`npx`/`node`.)
- The relevant `bun run test` (vitest) suite is green; update tests that referenced old shapes rather
  than leaving them red or deleted-without-replacement.
- **Read a gate failure as a possible design signal, not just a coding slip.** A `tsc` or test failure
  on new code often means the *shape* is wrong, not that the test needs appeasing — run the gate
  *before* declaring a rung done, and when it fails on conformant-looking code, re-examine the design
  before forcing it green (a wrong reactive/persistence shape, a leaky boundary type, an inverted
  contract surface this way).
- No new `console.log`, dead code, or silent stub was introduced; any dead code the rung replaced is
  gone (git is the history).
- The dependency direction holds — grep the diff for an upward edge (a store importing another
  store/service, a view building a client or running a db query, a DTO/key field surfacing in a store
  or view).
- The phase's **Out of scope** boundary was respected — nothing in the diff belongs to a later rung
  or a flagged follow-up.
- The **final (view) rung additionally** passes the `instrument-design-system` presentation gate
  (the anti-pattern checklist; honest readings; the per-target contract) and is exercised live
  end-to-end, not just type-checked.
