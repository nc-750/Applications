# Challenge-report format

The artifact `nc-750-challenge` emits, in both modes:

- **plan mode** (`/nc-750 challenge`): the target is a plan/brief. Challenge phases, assumptions,
  blind spots, test descriptions, and ethos fit.
- **build mode** (`/nc-750 review`): the target is a diff. Challenge the implementation against the
  approved brief + ethos + engineering soundness.

The report drives the loop, so its **verdict** is machine-clear and its findings are **actionable**.

## Structure

```markdown
# Challenge report — <target> (<plan|build> mode)

**Verdict:** pass | revise

## Findings
(omit if verdict is pass with nothing to note)

### F1 — <one-line title>
- **Severity:** blocker | major | minor
- **Where:** the phase id / file / line / test description it concerns
- **Citation:** the rule it violates — `ETHOS.md C#.#`, `BRAND.md §#`, or a named soundness
  principle (e.g. "test surface too broad", "over-engineering", "dependency inverted").
- **Ask:** the concrete revision that would resolve it. Specific enough to act on without a
  follow-up question.

### F2 — ...

## Notes
Optional non-blocking observations (kept out of Findings so they don't gate the loop).
```

## Verdict rules

- **`pass`** — no `blocker` and no `major` findings. `minor`/Notes may remain; they do not gate.
- **`revise`** — at least one `blocker` or `major`. The report lists exactly what to address; the
  loop returns to the author (`nc-750-plan` or the implementer).

## Severity

- **blocker** — violates an ETHOS `MUST`/`MUST NOT`, breaks the dependency direction, or makes the
  artifact unbuildable/unsafe. Must be fixed.
- **major** — a real weakness: a broad/coverage-only test, an unjustified ETHOS `SHOULD` deviation,
  over- or under-engineering, an assumption with no basis, a blind spot. Should be fixed before pass.
- **minor** — a nit that does not block (naming, a clearer phrasing, a small simplification).

## What plan mode interrogates (non-exhaustive)

- **Phases & assumptions** — is each phase necessary, correctly ordered, and bounded? Is any
  assumption unstated or unsupported? What is the plan blind to?
- **Tests-as-descriptions** — is the test **too broad** (spanning many functions/one big surface)?
  Is it there **only to drive coverage** with no real-world value if absent? Is the expected result
  actually the right behavior? Is a needed test missing?
- **Ethos fit** — does the plan, as described, satisfy the relevant ETHOS constraints? Cite the
  exact clause for any gap.
- **Engineering soundness** — over-engineering (speculative generality, YAGNI violations) AND
  under-engineering (missing complexity the goal needs). Can a single human follow what and why?

## What build mode interrogates (non-exhaustive)

- **Brief conformance** — does the diff stay within **In scope** and honor **Out of scope**? Did it
  reach into a later phase?
- **Ethos in the implementation** — does the actual code/data flow match the claimed stance (e.g.
  nothing leaves the device on the local path; secrets in the OS keystore)?
- **Verify gate** — were the brief's tests + the global gate (`env-and-verify.md`) actually run and
  green, with exact counts reported?
- **Soundness & honesty** — dead code, silent stubs, leaky boundaries, dependency-direction breaks,
  invented lore/claims not literally true.
