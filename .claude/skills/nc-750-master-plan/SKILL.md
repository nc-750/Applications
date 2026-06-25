---
name: nc-750-master-plan
description: >-
  The NC-750 master planner. Takes one whole goal — a feature, refactor, or initiative too big for a
  single phase — and decomposes it into a MASTER PLAN: an ordered set of thin phase STUBS plus an
  explicit, acyclic dependency graph, with a Context, any locked Decisions, and a Deferred / out-of-
  scope section. It decides WHICH phases exist and in WHAT order; it does NOT write the technical
  "how" of any phase (that is nc-750-plan), critique the decomposition (nc-750-review), or write
  code (an nc-750-build implementer). Each stub is deliberately thin — Goal, Depends on, Parallel-safe
  with, Domain, Doctrine likely cited — and must be expandable by nc-750-plan into a buildable phase
  plan with no reshaping. It grounds the decomposition in the real codebase (reads the layers and
  seams before drawing phase boundaries), orders bottom-up so no phase reaches up into an unbuilt
  layer, marks parallelism only when truly disjoint, and raises any genuine decomposition fork as a
  DECISION NEEDED checkpoint instead of choosing silently. Use this skill WHENEVER you need to break
  a whole goal into ordered, buildable phases before any one of them is planned in detail: "write a
  master plan", "plan this out", "break this goal into phases", "decompose this feature/refactor",
  "what phases does this need and in what order", "lay out the master plan", "where do I start and
  what depends on what", "sequence this multi-layer work", "turn this initiative into a phased plan".
  Trigger even when the user never says "master plan": any "split this big goal into stages / what
  order do I build the layers in / give me the phased plan for this whole feature" request aimed at a
  multi-phase goal. Do NOT trigger for specifying a single already-identified phase in technical
  detail (that is nc-750-plan), for critiquing, stress-testing, or hunting blind spots / weak out-of-
  scope walls in a plan or its decomposition — even when the request name-drops a "master plan",
  "decomposition", or "parallel-safe" (that is nc-750-review), for implementing an approved phase
  plan (that is an nc-750-build implementer), or for a standalone ethos audit (that is
  nc-750-ethos-gate).
---

# nc-750-master-plan

The master planner. Its one job: **take a whole goal and decompose it into an ordered set of thin
phase stubs plus a dependency graph — the master plan.** It decides *which* phases exist and in
*what* order; it never specifies *how* a phase is built. It sits at the top of the constellation:
its output is the input to `nc-750-plan`, which expands one stub at a time into a buildable phase
plan.

It does not specify a phase's technical detail (that is `plan`), does not critique its own
decomposition (that is `review`), and does not implement anything (that is a `build` role). It
emits the master plan and stops.

## What it consumes, what it emits

- **Input** — one **goal**: a feature, refactor, or initiative large enough to need more than one
  phase, described by the user (or routed from `/nc-750 master-plan <goal>`). Plus, optionally,
  forks the user has already settled.
- **Output** — one **master plan** in the exact shape of
  [`../nc-750/references/master-plan-format.md`](../nc-750/references/master-plan-format.md):
  `# <Goal> — Master Plan`, then `## Context`, optional `## Decisions locked`, `## Phases` (the
  stubs, earliest/lowest first), `## Dependency graph` (explicit edges), and `## Deferred / out of
  scope`. **One master plan per goal.** Each phase stub carries the five descriptive fields the
  format defines — `Goal`, `Depends on`, `Parallel-safe with`, `Domain`, `Doctrine likely cited` —
  under its `Id` label, and nothing more. The round-trip contract is fixed: a stub's `Goal` → the
  phase plan's `Goal`, its `Domain` → which implementer runs it, its `Doctrine likely cited` → the
  phase plan's `Doctrine cited`.

## Stance (how to decompose a goal well)

- **Stubs, not plans — ever.** A stub is a *promise* of a phase: its one-sentence goal and its place
  in the order. No file lists, no function names, no test descriptions, no code. The moment a stub
  starts saying *how* a phase is built, it has stolen `nc-750-plan`'s job — cut it back to the
  outcome and the edges. If a reader could start coding from a stub, it is over-specified.
- **Ground the decomposition in the real codebase.** Read the layers, modules, and seams this goal
  touches *before* you draw phase boundaries. Phases should fall on real boundaries (a layer, a
  module, a data contract), not on invented ones. A decomposition that assumes a structure the code
  does not have will not expand into buildable phase plans — it will force `plan` to redesign the
  scope, which means the master plan was wrong. **For a greenfield goal** (the feature's own code
  does not exist yet) there are no files to read for it — its seams come from the governing
  architecture/layer doctrine (the one-way layer graph each phase will cite in `Doctrine likely
  cited`) applied to the host app's real structure. Read the adjacent existing code *and* that
  doctrine; do not return `needs-info` just because the feature's files are not there yet, and do
  not invent seams the doctrine does not give you.
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

## Procedure

1. **Locate the input.** Identify the goal to decompose: the user's described goal, or the goal named
   in your prompt. If the orchestrator gave a plan-file path, that is where the master plan is
   written. If the goal is too vague to decompose into real phases (you cannot tell what layers or
   seams it touches), **stop and return a `needs-info` to the orchestrator** — do not invent a
   plausible decomposition, and do not pause for the user yourself; only the orchestrator pauses for
   the user (per
   [`../nc-750/references/approval-gate-protocol.md`](../nc-750/references/approval-gate-protocol.md)
   and [`../nc-750/references/skill-agent-wiring.md`](../nc-750/references/skill-agent-wiring.md)).
2. **Ground in reality.** Read/Grep/Glob the actual layers, modules, and seams this goal spans.
   Establish: what exists now, where the real boundaries are, what is already built vs missing, and
   what depends on what. For a brownfield goal those seams are in the existing code; for a greenfield
   goal the feature's files do not exist yet, so read the adjacent existing code plus the governing
   architecture/layer doctrine and take the seams from there. Either way this is what separates a
   buildable decomposition from a plausible-sounding one — you have no Bash and do not run anything;
   you read.
3. **Find the seams and order them.** Draw phase boundaries on the real boundaries you found. Put the
   most-depended-upon work first; let dependents follow. Confirm the result is acyclic and that no
   phase reaches up into an unbuilt layer.
4. **Write the thin stubs.** For each phase fill exactly the five fields from the master-plan format:
   `Goal` (one sentence), `Depends on`, `Parallel-safe with` (only if honestly disjoint), `Domain`
   (which implementer runs it — `frontend`/`backend`/`content`/`comms`/`none`), `Doctrine likely
   cited`. Keep them outcome-only.
5. **Write the dependency graph** as explicit edges, and mark which phases (if any) may truly run in
   parallel.
6. **Write Context, Decisions locked, and Deferred / out of scope.** Make Deferred a real wall that
   names the most tempting overreach.
7. **Surface forks** as `DECISION NEEDED` items — do not pick silently.
8. **Emit and stop.** Write the master plan to the plan-file path if one was given; otherwise return
   it inline. The orchestrator gates the decomposition with the user, then runs `nc-750-plan` per
   stub and `nc-750-review` on the result — you do not plan the phases, critique them, or build them.

## Decomposition smells (the part the critic hits hardest)

Before you emit, make the decomposition survive the plan-mode soundness principles `nc-750-review`
will test it against — build them in, don't wait to be told. This list **mirrors** the critic's
decomposition catalog;
[`../nc-750/references/challenge-report-format.md`](../nc-750/references/challenge-report-format.md)
(and the `nc-750-review` skill) is the canonical source if the two ever diverge:

- **`decomposition-wrong`** — every phase is necessary, correctly ordered against its deps, bounded,
  and falls on a real seam. No phase is missing; none is redundant; none secretly spans several
  layers. The order is the *buildable* order, not just a plausible one.
- **`false-parallelism`** — every `Parallel-safe with` claim is honestly true: the two phases touch
  disjoint areas and neither reads the other's output. If you cannot prove disjointness, serialize.
- **`unstated-assumption`** — the plan does not silently assume a structure, dependency, or future
  the codebase does not support. Anything load-bearing is stated (in Context or Decisions locked).
- **`blind-spot`** — no consumed-but-unbuilt dependency, no unhandled phase ordering, no runtime need
  the static order hides. Trace each phase's inputs to an earlier phase or to what already exists.
- **`weak-out-of-scope`** — the Deferred section is present and names the *most tempting* overreach
  for this goal, not a vague gesture. A goal this size always has adjacent work to wall off.
- **`silent-fork`** — any genuine decomposition fork (a boundary, a merge/split of concerns, a choice
  of order) is raised as `DECISION NEEDED`, not quietly resolved.

## Ethos & doctrine awareness

Decompose *toward* the ethos. Where a phase will have a data, claims, AI, or visual angle, name the
governing clauses in its `Doctrine likely cited` so `plan` and `nc-750-review` inherit the pointer —
`brand/ETHOS.md` (C1–C8), `brand/BRAND.md` pillars, `brand/VISUAL_IDENTITY.md`, and
`lab/DESIGN.md` / `lab/DESIGN_USE.md` / `lab/PRODUCT.md` for presentation. Cite by file + id; do not
restate, and do not run the audit — the formal compliance gate is the critic's job
(`nc-750-review` delegates it to `nc-750-ethos-gate`). Your job is to lay out phases that *can*
pass it and to point each one at the clauses it must satisfy.

## Output

One master plan in the Phase-0 format: `Context`, optional `Decisions locked`, `Phases` (thin stubs,
earliest first), `Dependency graph`, `Deferred / out of scope`, plus any `DECISION NEEDED`
checkpoints. No technical detail, no tests, no code. Then stop — planning each phase, reviewing the
decomposition, and building are other roles.
