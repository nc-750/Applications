# Phase-plan format

The canonical artifact `nc-750-plan` emits. It is consumed by `nc-750-review` (plan mode) and,
once approved, by an `nc-750-build-*` implementer. **One phase plan per phase.** A phase plan
specifies *how* a phase is done in technical detail **without writing the code** — code is the
implementer's job.

## File location & naming

A phase plan is **not** a standalone file — it lives in the same dated initiative folder as its
master plan, named `XX_<plan-slug>-phase-XX.md` (zero-padded phase number) with `created_at`
frontmatter. The full convention (target-project `docs/plans/`, `YYYYMMDD-<plan-slug>/` folder) is
single-sourced in [`master-plan-format.md`](master-plan-format.md) → *File location & naming*.

## The seven lines (the spine)

```markdown
## <Phase id> — <short title>

- **Goal** — the one outcome this phase delivers, in a sentence.
- **In scope** — the concrete artifacts to create/change: files, functions, modules, the dead code
  removed. Specific enough to implement, not so specific it is the code.
- **Out of scope** — the hard wall. What this phase must NOT touch (typically adjacent phases and
  cross-cutting cleanup). Treat as a wall, not a suggestion; work noticed here is flagged as a
  follow-up, not done.
- **Doctrine cited** — which brand/ethos/design docs govern this phase, by file + section. Cite;
  do not restate. (e.g. `ETHOS.md C1.3, C3.1`; `BRAND.md §1 pillars`.)
- **Tests-as-descriptions** — each test as **description + expected result, NO code**. State what
  behavior is exercised and what the expected outcome is. (Omit the section only for phases with
  genuinely nothing to assert — say so explicitly.)
- **Deliverable** — the files/folders that exist (or are gone) when the phase is done.
- **Verify** — this phase's own gate: the type-check + the targeted test(s) that prove the layer
  works, plus the global gate from `env-and-verify.md`.
```

## Rules for `nc-750-plan` when emitting a phase plan

- **No code.** Function/file names and signatures-as-prose are fine; implementations are not. If a
  reader could copy a block straight into a source file, it is too detailed.
- **Tests are descriptions, and they must survive the reviewer.** Each test description should be
  able to answer, before it is written: *Is it narrow (one behavior, not a sweep of many
  functions)? Is it real-world-meaningful if absent, or only there to lift a coverage number?* (See
  `challenge-report-format.md` for how `nc-750-review` interrogates these.)
- **Out of scope is mandatory** and must name the most tempting overreach for this phase.
- **Surface design forks as a checkpoint**, not a silent choice. If the phase has a genuine fork
  that no doctrine prescribes (a shape, a boundary, a pattern), the phase plan lists the options +
  a recommendation and marks it `DECISION NEEDED` so the orchestrator can gate it with the user
  before implementation (discovery → decision → convention).
- **Pragmatic, not dogmatic.** Plan the simplest design that fully meets the goal; do not pre-build
  for hypothetical futures (YAGNI applied pragmatically), but do not strip complexity the goal
  genuinely needs. The test: a single human can understand both *what* the code will do and *why*.

## Round-trip contract

`nc-750-plan` emits the phase plan → `nc-750-review` (plan mode) returns a review report → loop
until `pass` (or user override) → user approves the finalized phase plan → `nc-750-build-*`
implements strictly within **In scope**, honoring **Out of scope** as a wall, satisfying **Verify**.
