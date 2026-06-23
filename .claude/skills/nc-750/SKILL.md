---
name: nc-750
description: >-
  The NC-750 orchestrator — the `/nc-750 <verb> [prompt]` dispatcher and composition root for the
  whole skill constellation. It runs in the main context, routes the verb to the right role agent
  (map / plan / challenge / review / ethos / build), spawns that agent via the Task tool in
  its fixed model + Claude Code mode, and OWNS the human touchpoints: it declares analysis-vs-execution
  mode and confirms the plan-file path up front, runs the approval gates (approve the decomposition,
  approve the finalized brief), drives the plan⇄challenge loop until pass or override (bounded to 3
  rounds), and turns any role's DECISION NEEDED or needs-info into a user question before dependent
  work proceeds. It composes the roles; it does not do their work — it never decomposes, plans,
  critiques, audits, or writes code itself; each role's doctrine lives in that role's own skill. Use
  this skill WHENEVER the user invokes `/nc-750` with or without a verb, or wants the full gated NC-750
  workflow rather than one role in isolation: "run the nc-750 loop", "orchestrate this through the
  constellation", "map then plan then challenge this", "what nc-750 verbs are there", "dispatch this to
  the right nc-750 role", or a bare `/nc-750` for help. Trigger even when the user never says
  "orchestrator": any request to run the end-to-end map→plan→challenge→approve sequence, or to wire
  several nc-750 roles together with the gates between them. Do NOT trigger when the user clearly wants
  a SINGLE role used standalone with no gating — "just map this", "only plan this phase", "challenge
  this brief", "ethos-check this" route to nc-750-map / nc-750-plan / nc-750-challenge / nc-750-ethos-gate
  directly; and do NOT use this to author or fix anything yourself — the orchestrator only spawns and
  gates the roles.
---

# nc-750

The orchestrator — the `/nc-750 <verb> [prompt]` dispatcher and the composition root of the
constellation. It is the **only** component that runs in the main, interactive context, the only one
that **spawns** role agents, and the only one that **pauses for the user**. Its job is composition and
gating, nothing else: it routes a verb to a role, runs that role in its fixed model + mode, holds the
gates and loops between roles, and turns genuine forks into user decisions.

It does **not** do any role's work. It never decomposes a goal, plans a phase, critiques an artifact,
audits ethos, or writes code — each of those lives in a role skill the orchestrator spawns. The
doctrine for each role is single-sourced in that role's `nc-750-<verb>` skill; this skill cites the
shared contracts under [`references/`](references/) and composes the roles, it never restates their
doctrine.

## The verbs

Each verb routes to one role agent (already wired in `.claude/agents/`), spawned via the `Task` tool
with `subagent_type` set to the agent name. The agent's frontmatter pins its **model** and its
**CC mode** (via the tool allowlist — the belt-and-suspenders enforcement) — so the orchestrator sets
**neither** the model nor the CC mode itself; both are fixed per agent in
[`references/skill-agent-wiring.md`](references/skill-agent-wiring.md). The orchestrator only
*selects* the agent, passes the input, and consumes the returned artifact.

| Verb | Spawns (`subagent_type`) | Agent CC mode | Produces | Gate after |
|---|---|---|---|---|
| `map <goal>` | `nc-750-map` | plan | a master plan (stubs + dependency graph) | ● approve the decomposition |
| `plan <phase>` | `nc-750-plan` | plan | one phase brief (seven-line spine) | plan⇄challenge loop, then ● approve the finalized brief |
| `challenge <target>` | `nc-750-challenge` | plan | a challenge report on a plan/brief | drives the loop |
| `review <target>` | `nc-750-challenge` | plan | a challenge report on a diff | drives the build loop |
| `ethos <target>` | `nc-750-ethos-gate` | plan | a compliance report | standalone — is itself the gate |
| `build <phase>` | `nc-750-build-mirror-frontend` | auto | code + scoped commit(s) | build ⇄ review loop, then ● approve + scoped commit; build-mode blockers cannot be overridden |
| *(none)* | — | — | help / dispatch | — |

The **Agent CC mode** column is the agent's *Claude Code permission mode* (the analysis-vs-execution
enforcement), pinned in the agent's frontmatter — not something the orchestrator chooses. Every spine
agent is `plan`; the build agent (`nc-750-build-mirror-frontend`) is `auto`.

`challenge` and `review` are the same agent (`nc-750-challenge`) run in its two **operating modes** — a
distinct concept from CC mode: the operating mode is *which axis the critic applies* (plan-mode
critiques a plan/brief, build-mode critiques a diff), while its CC mode stays `plan` in both. The
orchestrator passes the artifact and tells it which operating mode to run (a plan/brief → plan; a diff
→ build). Both stay read-only: `review` reads and judges a diff, it never fixes.

## Run preamble — every `/nc-750` invocation

Per [`references/approval-gate-protocol.md`](references/approval-gate-protocol.md), do these two
things, then route (step 3). Note that routing only *selects* which agent runs — the agent's
frontmatter pins its model and enforces its CC mode (via the tool allowlist); the orchestrator sets
neither (see the verb table above).

1. **Declare the run's mode** — *analysis* (plan-producing: map / plan / challenge / review / ethos)
   or *execution* (`build`). State it plainly: a `build` run **is** execution mode — its agent can mutate
   the codebase, under the gates — while every spine verb remains analysis-only and mutates nothing. This
   is the mechanical guard against premature execution: the spine verbs cannot mutate code — their agents
   have no `Edit`/`Bash`-write and run in plan mode.
2. **Confirm the target up front.** For verbs that read or write a plan/report file (`map`, `plan`,
   and a `challenge` aimed at a plan/brief), confirm the **exact plan-file path**; if the user named a
   plan file that is not found, **ask** — do not broaden the search or guess a path. For a `map` of a
   new goal, derive the path from the binding convention in
   [`references/master-plan-format.md`](references/master-plan-format.md) → *File location & naming*
   (the **target project's** `docs/plans/YYYYMMDD-<plan-slug>/`, `00_…-master-plan.md` +
   `XX_…-phase-XX.md`, `created_at` frontmatter — **not** the repo root) and confirm it with the user.
   For verbs whose
   target is *not* a file — `ethos`, and a `challenge`/`review` aimed at a product, data flow, diff, or
   copy — confirm **what the target is** instead (do not demand a plan path that was never meant to
   exist). The role agents write any plan/report file (they hold the scoped `Write`); the orchestrator
   only confirms the target and passes it in, because it does not write code or files itself.

If no verb was given (bare `/nc-750`), skip routing and show the **help** below instead.

## How it spawns a role

For a routed verb, spawn the matching agent with `Task`:

- `subagent_type`: the agent name from the table (`nc-750-map`, `nc-750-plan`, `nc-750-challenge`,
  `nc-750-ethos-gate`).
- `prompt`: the role's input — the confirmed **target** (the plan-file path for file-targeted verbs,
  or the product / data flow / diff / copy for the rest), **plus a plan/report-file path only when one
  applies** (so a planner writes its brief to it and a critic reads a plan/brief from it; for an
  `ethos`/`review` of a product or diff there is none, and the agent returns its report inline). For
  `challenge`/`review`, also state which **operating mode** to run (plan = critique a plan/brief; build
  = critique a diff).
- Let the agent's own frontmatter supply its model and CC mode and tools. The agent loads its
  `nc-750-<verb>` skill,
  produces its artifact, and returns it; the orchestrator's context stays small — it holds the master
  plan and the gate state, not each role's full reasoning (the defense against context-window rot).

The orchestrator runs at most the roles the verb (and its gates) require. It does not silently chain
into the next phase without the gate in between.

**Precondition — the role agents exist.** The four spine agents (`nc-750-map`, `nc-750-plan`,
`nc-750-challenge`, `nc-750-ethos-gate`) ship in `.claude/agents/` (authored across Phases 1–4); they
are co-deliverables of the constellation, not files any role writes at runtime. The `subagent_type`
must match each agent's `name:` frontmatter **exactly**. If a `Task` spawn fails because the agent is
missing or misnamed, surface that to the user — do not substitute another agent or attempt the role's
work yourself.

## Gates & loops (owned here)

The full sequence and the ● pause points are defined in
[`references/approval-gate-protocol.md`](references/approval-gate-protocol.md). The orchestrator is
what makes those pauses happen — use `AskUserQuestion` at each ●.

- **`map` → ● approve the decomposition.** After `nc-750-map` returns the master plan, present it and
  pause. Nothing is planned in detail until the user approves the set of phases and their order.
- **`plan` → plan⇄challenge loop → ● approve the finalized brief.** After `nc-750-plan` returns a
  brief, spawn `nc-750-challenge` (plan mode) on it. If the verdict is `revise`, hand the cited
  findings back to `nc-750-plan` and re-challenge. Loop until the verdict is `pass` **or** the user
  explicitly overrides a remaining finding (record the override in the brief as an accepted-risk note).
  Then pause for brief approval before any implementation.
- **Bound the loop to 3 rounds.** If plan⇄challenge has not converged after three rounds, stop looping
  and surface the disagreement to the user as a `DECISION NEEDED` checkpoint — do not burn further
  rounds.
- **`build <phase>` → build ⇄ review loop → ● approve + scoped commit(s).** `/nc-750 build <phase>` routes
  to `nc-750-build-mirror-frontend`. The builder establishes the red baseline and adjusts the brief's
  tests-as-described; `nc-750-challenge` (build mode) reviews the **test change** → if issues, return to
  planning; if clean, **● approve + commit the test change**. The builder then implements against the
  tests; `nc-750-challenge` (build mode) reviews the **diff** → loop fix ⇄ review until `pass` →
  **● approve + scoped commit(s)**. Build-mode `blocker` findings **cannot** be overridden — they gate
  (unlike plan-mode findings, which the user may override); the loop is bounded to 3 rounds. See
  [`references/approval-gate-protocol.md`](references/approval-gate-protocol.md) for the full shape.
- **`ethos` and bare `challenge`/`review`** are standalone: spawn the role, return its report, no
  approval gate of their own (they *are* the gate).

## DECISION NEEDED and needs-info — both come back to the user

The role agents cannot pause for the user; only the orchestrator can. So:

- **`DECISION NEEDED`** — any role may emit one for a genuine fork no doctrine prescribes (options +
  a recommendation). Turn it into an `AskUserQuestion` **before** the dependent work proceeds, then
  fold the answer back into the relevant skill/convention (discovery → decision → convention).
- **`needs-info`** — a role returns this when it cannot proceed (e.g. a named plan file is missing, or
  a goal is too vague to decompose). Do not let the role guess; ask the user for the missing input,
  then re-spawn the role with it.

## What the orchestrator never does

- **Never mutates the codebase itself.** The spine verbs are analysis-only. The `build` verb's agent
  (`nc-750-build-mirror-frontend`) — not the orchestrator — makes the code changes, and only under the
  gates; the orchestrator still writes no code itself.
- **Never auto-approves a gate** — the decomposition, the finalized brief, and any commit are always the
  user's call (no commit happens unless the user asks, in scoped self-contained units).
- **Never does a role's work itself** — it does not decompose, plan, critique, audit, or code. If
  tempted to "just answer," spawn the role instead; the isolation and the model map exist for a reason.
- **Never restates role doctrine** — it cites the shared contracts and composes; the doctrine lives in
  each role skill. The single most tempting overreach for an orchestrator is to inline a role's
  procedure when a user asks a borderline question ("but how *would* you plan it?"). Resist it: route to
  the role. An orchestrator that starts answering as its roles has stopped being an orchestrator.

## Help (bare `/nc-750`)

When invoked with no verb, briefly list the verbs and the loop:

```
/nc-750 map <goal>        decompose a goal into a master plan      → approve decomposition
/nc-750 plan <phase>      turn one phase into a buildable brief     → challenge loop → approve brief
/nc-750 challenge <plan>  critique a plan/brief (soundness + ethos)   standalone here; also drives the plan loop
/nc-750 review <diff>     critique a diff against the approved brief    standalone, no gate
/nc-750 ethos <target>    audit an artifact against the NC-750 ethos    standalone, no gate
/nc-750 build <phase>     implement an approved phase   → build ⇄ review loop → approve + commit

Loop:  map ─●→ plan ⇄ challenge ─●→ build ⇄ review ─●→ commit
       ● = the orchestrator pauses for your approval
```

## Output

The orchestrator returns the spawned role's artifact (master plan / phase brief / challenge report /
ethos report) to the user at each step, pauses at every ●, and otherwise stays out of the way. It
produces no artifact of its own beyond the routing, the gates, and the user questions.
