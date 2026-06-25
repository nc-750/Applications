# Master-plan format

The artifact `nc-750-master-plan` emits. It decomposes a goal into **phase stubs** + a dependency graph.
Each stub is the input to `nc-750-plan`. A master plan does **not** contain technical detail — it is
the overview; detail is added per phase by `nc-750-plan`.

## File location & naming (binding — applies to the master plan AND every phase brief)

Plan files live **with the project they target**, grouped per initiative in a dated folder. They do
**not** live at the repo root (`/<repo>/docs/plans/` is too broad — a monorepo holds several
projects).

- **Location** — the **target project's** own `docs/plans/` directory, e.g.
  `mirror/app/docs/plans/`. The target project is the one whose code the goal changes; for a goal
  spanning several, use the project that owns the bulk/root of the work.
- **One folder per initiative**, date-prefixed for chronological ordering:
  `docs/plans/YYYYMMDD-<plan-slug>/` where `YYYYMMDD` is the creation date (the temporal prefix makes
  plans sort and answers "which came when").
- **Files inside, ordered by sequence:**
  - `00_<plan-slug>-master-plan.md` — the master plan (this artifact). Always `00_`.
  - `XX_<plan-slug>-phase-XX.md` — one per phase brief, `XX` = the zero-padded phase number
    (`01_…-phase-1.md`, `02_…-phase-2.md`, …). The numeric prefix orders the briefs under the plan.
- **Frontmatter** — every plan file carries YAML frontmatter with at least
  `created_at: YYYYMMDD`.

## Structure

```markdown
# <Goal name> — Master Plan

## Context
Why this is being done — the problem/need, what prompted it, the intended outcome. (1 short para.)

## Decisions locked
Any forks already settled with the user, one line each. (Omit if none yet.)

## Phases
A table or list of phase STUBS, lowest/earliest first.

## Dependency graph
Explicit edges — which phases block which; which may run in parallel.

## Deferred / out of scope
Named things intentionally not in this plan (with a one-line why).
```

## Phase stub shape (each entry under `## Phases`)

A stub is deliberately thin — it is a promise of a phase, not the phase itself:

- **Id** — `Phase N` (stable label; sub-phases `N.M` allowed).
- **Goal** — the one outcome, one sentence.
- **Depends on** — phase ids that must finish first (or `—` for none).
- **Parallel-safe with** — phase ids it may run alongside (or `—`).
- **Domain** — which implementer will execute it (`frontend` / `backend` /
  `none` for plan-only phases). Drives which `nc-750-build-*` runs in the build gate later.
- **Doctrine likely cited** — the brand/ethos docs this phase will lean on (a hint for `nc-750-plan`).

## Rules

- **Bottom-up / dependency order.** A phase appears only after every phase it depends on. The graph
  must be acyclic.
- **Stubs, not plans.** No file lists, no test descriptions, no code — those belong to
  `nc-750-plan`. If a stub starts specifying *how*, it has overreached.
- **Mark parallelism honestly.** Two phases are parallel-safe only if neither reads the other's
  output and they touch disjoint areas.
- **Sequential|parallel is a recommendation to the orchestrator**, which still gates each phase's
  finalized brief with the user before implementation.
- **Each stub must be expandable by `nc-750-plan` with no reshaping** — if `plan` has to redesign the
  stub's scope to make it buildable, the decomposition was wrong; fix the master plan.

## Round-trip contract

`nc-750-master-plan` output → (user approves decomposition) → for each stub, `nc-750-plan` consumes the stub
→ emits a phase brief (see `phase-plan-format.md`). The stub's **Goal**, **Domain**, and
**Doctrine likely cited** map directly onto the brief's **Goal**, implementer selection, and
**Doctrine cited** lines.
