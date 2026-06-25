# Approval-gate & loop protocol

How `/nc-750` (the orchestrator) sequences roles, where it pauses for the user, and how the loops
terminate. The orchestrator owns this; role skills only emit their artifact and stop.

## Run preamble (every `/nc-750` invocation)

1. **Declare the mode** of the run — analysis (plan-producing) vs execution (build) — so the user
   knows nothing will be mutated until a build verb is reached.
2. **Confirm the exact plan-file path** up front. If a named plan file is not found, **ask** — do
   not broaden the search. For a new `master-plan`, derive the path from `master-plan-format.md` →
   *File location & naming* (the target project's `docs/plans/YYYYMMDD-<plan-slug>/`, not the repo
   root) and confirm it.
3. Route the verb to its role agent. The agent's own frontmatter pins its model and enforces its fixed
   CC mode (via the tool allowlist) — the orchestrator selects *which* agent runs, it does not set the
   model or mode itself (see `skill-agent-wiring.md`).

## Gates (● = the orchestrator pauses and asks the user)

```
/nc-750 master-plan <goal>
   └─ nc-750-master-plan → master plan
        ● APPROVE THE DECOMPOSITION                 ← before any phase is planned

for each phase (lowest incomplete first):
/nc-750 plan <master-plan> <phase>
   └─ nc-750-plan → phase plan
        └─ nc-750-review (plan mode) → report
             loop: revise ⇄ review  until verdict=pass  OR  user override
             Do not loop more than 3 rounds
        ● APPROVE THE FINALIZED PHASE PLAN          ← before implementation

/nc-750 build <phase>
   └─ routes to nc-750-build-frontend-mirror (auto mode)
   └─ adjust tests-as-described first
        └─ nc-750-review (build mode) on the TEST change → report
             if issues → RETURN TO PLANNING with the new data
             if clean → ● APPROVE + commit the test change
   └─ code against the tests
        └─ nc-750-review (build mode) on the diff → report
             loop: fix ⇄ review  until verdict=pass  (bounded to 3 rounds)
             build-mode blocker findings cannot be overridden
        ● APPROVE + scoped commit(s)
```

## Loop termination

- **plan ⇄ review** ends when `nc-750-review` returns `pass`, or when the user explicitly
  overrides a remaining finding (recorded in the phase plan as an accepted-risk note).
- **build ⇄ review** ends when `nc-750-review` returns `pass`. Build-mode findings of severity
  `blocker` cannot be overridden — they gate.
- **Bound the loop.** If a plan⇄review or build⇄review loop does not converge in **3 rounds**, stop
  and surface the disagreement to the user as a `DECISION NEEDED` checkpoint rather than looping further.

## Design-fork checkpoints

Any role may emit a `DECISION NEEDED` item (a genuine point of divergence no conventions or agreed
rules prescribes: options + recommendation). You turn it into a user question **before** the
dependent work proceeds, and the decision is folded back into the relevant skill/convention
(discovery → decision → convention).

## What is NEVER auto-approved

- The master-plan decomposition (gate 1).
- A finalized phase plan before implementation (gate 2).
- Any commit (gate 3) — commits happen only when the user asks, in scoped, self-contained units.
