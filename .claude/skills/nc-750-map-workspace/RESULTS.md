# nc-750-map — trigger eval

## Eval set
`trigger-eval.json` — 20 labeled queries: 10 should-trigger (decompose a whole goal into ordered
phases) + 10 should-not-trigger near-misses pulling toward the siblings (plan / challenge / review /
ethos-gate / build) and legacy/tooling distractors.

## How this was run
The skill-creator's automated optimizer (`run_loop.py` / `run_eval.py`) could NOT run in this
environment:
- No real Python (only the Microsoft Store stub aliases).
- Nested `claude -p` returns `authentication_failed` ("Not logged in") — the subprocess can't see the
  interactive session's credentials (`apiKeySource: none`).

So triggering was assessed by a reasoned description-level pass against the installed constellation
(confirmed via the CLI init event: nc-750-map/-plan/-challenge/-ethos-gate all present and competing).
This is judgment, NOT independent execution — re-run the harness for real trigger rates once Python +
a logged-in CLI are available:
`python -m scripts.run_loop --eval-set trigger-eval.json --skill-path ../nc-750-map --model claude-opus-4-8 --max-iterations 5 --verbose`

## Assessment (predicted)
- Positives Q1–Q10: route to map. Clean.
- Negatives Q11/Q12/Q19 → plan; Q14 → review; Q15 → ethos-gate; Q16 → build; Q17 (vite/tooling) &
  Q18 (trivial rename) → neither. Quiet.
- **Risk: Q13, Q20** — critique requests ("poke holes", "find blind spots") loaded with map's own
  vocabulary ("master plan", "decomposition", "parallel-safe", "weak out-of-scope walls"). Highest
  over-trigger vector toward map where nc-750-challenge should win.

## Fix applied
Hardened the description's Do-NOT clause to absorb the critique vocabulary: critiquing / stress-testing
/ hunting blind spots or weak out-of-scope walls "even when the request name-drops a 'master plan',
'decomposition', or 'parallel-safe'" routes to nc-750-challenge, not map.

## Competition note (not in negatives)
Legacy `feature-refactor-playbook` (intentionally left installed) also matches the refactor-
decomposition positives (Q1/Q4/Q9). Out of scope for this eval; flagged for the orchestrator phase.
