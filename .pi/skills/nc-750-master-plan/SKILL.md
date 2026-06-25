---
name: nc-750-master-plan
description: Takes one goal (a feature, refactor or initiative too big for one single phase) and decompose it into a MASTER PLAN, an ordered set of phase to be planned and implemented.
---

# NC-750-Master-Plan

Your job is to decompose a task into an ordered set of phase that will be further planned by the `nc-750-plan` skill. You decide *which* phase exists and in *what* order. You NEVER specify *how* a phase is implemented. Technical details and description is the role of `nc-750-plan`.

Your output is the input of several other agents and skills.

You DO NOT specify a phase's technical detail (that is `nc-750-plan` or the user), DO NOT critique your own decomposition (that is `nc-750-review` or the user), and DO NOT implement anything (that is `nc-750-build-*` or the user). You emit the master plan and stop.

## Input and Output

- **Input:** One **goal**: a new feature, refactor, update of a feature, removal of part of the code or documents, any other task that requires a multi-step implementation process. This goal is described by the user or router from `/nc-750 master-plan <goal>`.
- **Output:** One master plan in the exact shape of  [`../nc-750/references/master-plan-format.md`](../nc-750/references/master-plan-format.md).

## How to decompose a goal well

First check if the goal is actually multiple goals stated as one. In case of ambiguity ask the user for clarification. Your role is 1 goal = 1 master-plan.

If it is clear that you have been provided a single goal or the user decides to continue with the presented goal then follow the information below:

- **Stubs, not plans — ever.** A stub is a *promise* of a phase: its one-sentence goal and its place
  in the order. No file lists, no function names, no test descriptions, no code. The moment a stub
  starts saying *how* a phase is built, it has stolen `nc-750-plan`'s job — cut it back to the
  outcome and the edges. If a reader could start coding from a stub, it is over-specified.
- **Ground the decomposition in the real codebase.** Read the layers, modules, and seams this goal
  touches *before* you draw phase boundaries. Phases should fall on real boundaries (a layer, a
  module, a data contract), not on invented ones. A decomposition that assumes a structure the code
  does not have will not expand into buildable briefs — it will force `plan` to redesign the scope,
  which means the master plan was wrong. **For a greenfield goal** (the feature's own code does not exist
  yet) there are no files to read for it — its seams come from the governing architecture/layer
  doctrine (the one-way layer graph each phase will cite in `Doctrine likely cited`) applied to the
  host app's real structure. Read the adjacent existing code *and* that doctrine; do not return
  `needs-info` just because the feature's files are not there yet, and do not invent seams the
  doctrine does not give you.
- **Bottom-up, dependency order, acyclic.** A phase appears only after every phase it depends on. No
  phase may reach *up* into a layer an earlier phase has not yet built. Order by runtime need: build
  what is depended upon before what depends on it (model → data → store → service → view, or the
  goal's equivalent). The dependency graph must be a DAG — a cycle is a decomposition error, not a
  scheduling note.
- **Mark parallelism only when it is honestly true.** Two phases are `Parallel-safe with` each other
  **only** if neither reads the other's output *and* they touch disjoint areas. When in doubt, serialize
  — a false parallel claim is worse than a conservative sequence, because the orchestrator may act on
  it. Most phases in a layered refactor are *not* parallel-safe; say so.
- **Right-size the phases.** Each phase is one coherent, independently buildable, independently
  verifiable unit of work — typically one layer or one self-contained slice, sized to run in a single
  build session. Too coarse (a phase that secretly spans three layers) hides dependencies and can't be
  gated; too fine (a phase per file) drowns the plan in ceremony. Aim for the smallest set of phases
  that each cross a real seam.
- **The Deferred section is a wall, and it must name the most tempting overreach.** State the adjacent
  work, the "while we're in here" cleanup, and the speculative future that a diligent reader would
  *want* to fold into this goal — and put it out of scope with a one-line why. A master plan with no
  Deferred section is almost always hiding scope it has silently swallowed.
- **Forks are checkpoints, not silent choices.** If the decomposition has a genuine fork no doctrine
  prescribes — where a boundary falls, whether two concerns are one phase or two, which of two valid
  orders to take — list the options, give a recommendation, and mark it `DECISION NEEDED`. The
  orchestrator gates it with the user (discovery → decision → convention). Do not pick silently to
  keep the plan tidy.
- **Name doctrine as a hint, do not restate it.** `Doctrine likely cited` points `plan` at the
  brand/ethos/design sections a phase will lean on (by file + id). It is a pointer for the planner,
  not an audit — the formal compliance gate is the critic's job.