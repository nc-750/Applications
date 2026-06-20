# Approval-gate & loop protocol

How `/nc-750` (the orchestrator) sequences roles, where it pauses for the user, and how the loops
terminate. The orchestrator owns this; role skills only emit their artifact and stop.

## Run preamble (every `/nc-750` invocation)

1. **Declare the mode** of the run — analysis (plan-producing) vs execution (build) — so the user
   knows nothing will be mutated until a build verb is reached. (Directly fixes the premature-
   execution friction.)
2. **Confirm the exact plan-file path** up front. If a named plan file is not found, **ask** — do
   not broaden the search.
3. Route the verb to its role agent, spawning it in the role's fixed CC mode + model
   (see `skill-agent-wiring.md`).

## Gates (● = the orchestrator pauses and asks the user)

```
/nc-750 map <goal>
   └─ nc-750-map → master plan
        ● APPROVE THE DECOMPOSITION                 ← before any phase is planned

for each phase (lowest incomplete first):
/nc-750 plan <phase>
   └─ nc-750-plan → phase brief
        └─ nc-750-challenge (plan mode) → report
             loop: revise ⇄ challenge  until verdict=pass  OR  user override
        ● APPROVE THE FINALIZED BRIEF               ← before implementation

(deferred, Phase 6+) /nc-750 build <domain> <phase>
   └─ adjust tests-as-described first
        └─ nc-750-challenge (build mode) on the TEST change → report
             if issues → RETURN TO PLANNING with the new data
             if clean → ● APPROVE + commit
   └─ code against the tests
        └─ nc-750-challenge (build mode) on the diff → report
             loop: fix ⇄ review  until verdict=pass
        ● APPROVE + scoped commit(s)
```

## Loop termination

- **plan ⇄ challenge** ends when `nc-750-challenge` returns `pass`, or when the user explicitly
  overrides a remaining finding (recorded in the brief as an accepted-risk note).
- **build ⇄ review** ends when `nc-750-challenge` returns `pass`. Build-mode findings of severity
  `blocker` cannot be overridden — they gate.
- **Bound the loop.** If a plan↔challenge loop does not converge in **3 rounds**, stop and surface
  the disagreement to the user as a `DECISION NEEDED` checkpoint rather than looping further.

## Design-fork checkpoints

Any role may emit a `DECISION NEEDED` item (a genuine fork no doctrine prescribes: options +
recommendation). The orchestrator turns it into a user question **before** the dependent work
proceeds, and the decision is folded back into the relevant skill/convention
(discovery → decision → convention).

## What is NEVER auto-approved

- The master-plan decomposition (gate 1).
- A finalized brief before implementation (gate 2).
- Any commit (gate 3) — commits happen only when the user asks, in scoped, self-contained units.
