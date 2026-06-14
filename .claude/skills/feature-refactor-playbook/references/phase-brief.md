# Phase-brief template

Each rung of the ladder is captured as one self-contained brief. A session should be able to pick a
single brief, plan against it, implement, verify, and stop — without reading the rest of the plan and
without reaching into another rung. Copy the block below and fill it in for each layer.

```
### Phase <N> — <layer name> `[<feature> | shared]`
- **Goal:** <the one outcome this rung delivers, in a sentence>
- **In scope:** <the concrete artifacts to create/rewrite — files, functions — and the dead or
  duplicate code this rung removes>
- **Out of scope:** <the hard wall — the rung above this one, plus any cross-cutting cleanup flagged
  as a follow-up. This line keeps the refactor bounded.>
- **Conventions:** <which companion-skill rules apply — cite the skill + section; do NOT restate the
  rules: e.g. "vue-feature-architecture › stores", "instrument-design-system › web target">
- **Deliverable:** <the folder/files that exist when this rung is done>
- **Verify:** <this rung's own gate — type-check + the targeted test that proves THIS layer works>
```

## Worked example (the rungs, in order)

The bottom-up ladder, sketched as briefs. Names are illustrative — confirm exact paths against the
real tree.

```
### Phase 1 — Domain model + reference data `[<feature>]`
- Goal: the feature's single canonical domain type, with non-model "data" moved out of models/.
- In scope: <feature>/models/<Feature>.ts (plain data + a create-empty factory; no key, no wire
  shape); move lookup tables / thresholds / constants OUT of models/ into a reference module.
- Out of scope: persistence/DTOs (next rung); prompt wording.
- Conventions: vue-feature-architecture › data-models, naming.
- Deliverable: <feature>/models/<Feature>.ts + a reference module.
- Verify: bunx tsc --noEmit; a tiny test that the create-empty factory returns a zeroed, typed model.

### Phase 2 — DB persistence + mappers `[<feature>]`
- Goal: the db layer is the sole owner of this feature's persistence, crossing the boundary only via
  transforms.
- In scope: <feature>/db/ with the DTO (persistence key lives HERE, never on the domain model) and
  read/write fns against the shared connection; <feature>/mappers.ts (to<Feature>DTO / from<Feature>DTO).
- Out of scope: the store (next rung); any reactive state.
- Conventions: vue-feature-architecture › data-models, layering.
- Deliverable: <feature>/db/ + <feature>/mappers.ts.
- Verify: bunx tsc --noEmit; round-trip test domain → toDTO → write → read → fromDTO equals original.

### Phase 3 — Store `[<feature>]`
- Goal: a real reactive store that is a thin commit layer over the db module.
- In scope: useFeatureStore as a defineStore setup store — flat surface of ref/computed/actions;
  actions assign state + persist via <feature>/db; leaf store (own model + own db only). If the
  store's truth is ONE domain aggregate, prefer reactive<Feature> + toRefs over N hand-synced refs,
  and mind the no-rebind / Object.assign and structured-clone rules.
- Out of scope: any LLM/orchestration logic (services rung); cross-store work.
- Conventions: vue-feature-architecture › stores, layering, reactive-persistence.
- Deliverable: <feature>/stores/.
- Verify: bunx tsc --noEmit; store test (Pinia + fake-indexeddb): actions assign + persist; load rehydrates.

### Phase 4 — Prompts / external-I/O contracts `[<feature>]`   (skip if no external I/O)
- Goal: one obvious place per external-call flow — a pure builder + its co-located boundary schema.
- In scope: one file per flow (pure builder fns, no side effects); the Zod boundary schema next to each;
  factor shared fragments into one helper; delete dead/commented prompt files; add a flow map.
- Out of scope: the orchestration that CALLS these (services rung) — pure inputs/contracts only.
- Conventions: vue-feature-architecture › services (pure helpers), data-models (Zod at boundaries).
- Deliverable: a reorganized prompts/ (pure builders + co-located schemas); dead files gone.
- Verify: bunx tsc --noEmit; per-flow unit tests asserting prompt structure + schema parsing on fixtures.

### Phase 5 — Services / orchestration `[<feature>]`
- Goal: all app logic out of the view into injectable services — functional core + imperative shell.
- In scope: one orchestrator per user flow (sequences pure helpers, does the I/O, commits THROUGH the
  store); pure helpers with explicit args (no store/refs); stores arrive by injection; use the shared
  client factory; log-once-and-throw, remove sentinels and swallowed catches.
- Out of scope: rendering and view wiring (next rung).
- Conventions: vue-feature-architecture › services, layering, structure-and-errors.
- Deliverable: <feature>/services/ with plain-function orchestrators + pure helpers.
- Verify: bunx tsc --noEmit; pure-helper unit tests; orchestrator tests with a mocked client + real
  Pinia store asserting state transitions and that failures throw.

### Phase 6 — View `[<feature>]`
- Goal: rebuild the view to the instrument contract, decomposed, binding store read-only + calling services.
- In scope: one entry page → Bands → Cells/MonitorCells; pick one component where duplicates exist and
  delete the other; name each component after its Lab root; catch service throws into reactive error
  state and render it; remove console.log; no logic/infra/model-mutation in any view.
- Out of scope: global facade deletion and other features (flagged follow-ups).
- Conventions: instrument-design-system › <target> (presentation) + vue-feature-architecture ›
  structure-and-errors, naming.
- Deliverable: a conformant view tree; duplicate and dead components removed.
- Verify: bunx tsc --noEmit; run the app and exercise the feature end-to-end live; bun run build passes;
  the presentation anti-pattern checklist passes; the error path surfaces visibly.
```

## Shared-infra phases come first

If the feature needs infrastructure that does not exist yet — a client factory that owns construction,
the single IndexedDB connection — those are **earlier phases**, below the feature on the dependency
graph, marked `[shared]`. Build them before the feature rungs that depend on them. They follow the
same brief shape; their **Conventions** line cites `vue-feature-architecture › services` (factories)
and `layering` (the one db connection).
