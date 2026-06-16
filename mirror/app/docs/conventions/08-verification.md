# 08 — Verification

## Scope
Decides what "the gate passes" means when type-checking and testing a change: how to read the
type-checker against a repo that is never fully clean, which type-checker actually sees view code, and
how to treat a gate failure. Companion to the per-layer error strategy in `04-services.md` /
`07-components-and-style.md` (how failures are *handled*) — this file is about how a change is
*verified* before it lands.

## Problem
Two recurring blind spots made the gate unreliable across the interview-refactor sessions:

- **A permanently-red baseline.** The repo carries dozens of pre-existing type errors — stale tests
  importing removed modules (`stores/mirror`, `db/schema`, `types/persona`), half-migrated sibling
  features (profile/settings). "`tsc` is clean" is unachievable repo-wide, so every session
  re-discovered the baseline by hand, and an absolute-clean gate would either block forever or be
  ignored.
- **`tsc` does not check `.vue`.** `tsc --noEmit` skips single-file components entirely. The interview
  view shipped real `.vue` type errors (an invalid log category, a `string | null` → `string |
  undefined` prop mismatch, an unresolved path alias) that `tsc` reported clean; they only surfaced
  under `vue-tsc`.

A third, softer problem: a green-looking gate that fails on conformant code is often telling you the
*shape* is wrong, but a stale pre-convention test invites you to "fix" the new code to match the old
rejected shape instead.

## Current state
- `package.json`: `test` runs vitest; `build` runs `vue-tsc --noEmit && vite build`. The bare
  `tsc --noEmit` invocation used as a quick gate does **not** parse `.vue`.
- `tsconfig.json` includes `src` and `src/__tests__`; the baseline includes stale tests owned by
  not-yet-refactored features.
- This stack uses **bun**: `bun run <script>`, `bunx <bin>` — never `npm` / `npx` / `node`.

## Decision
The gate is **no NEW type errors, attributed per file**, run with the **SFC-aware compiler whenever
`.vue` is touched**, and a failure on conformant-looking code is read as a **design signal** before it
is forced green.

## Rules
1. **No-new-errors, per-file attribution.** Judge a change by baseline-diff: it is green when it adds
   zero new type errors and the files it touched are themselves clean. Report "zero errors in the
   files I touched," not a raw total. A raw `tsc` count is meaningless without the baseline it is
   compared against.
2. **`.vue` requires `vue-tsc`.** Any change touching a single-file component must pass
   `bunx vue-tsc --noEmit` (the `build` script), not `tsc --noEmit` alone. `tsc` is acceptable as a
   fast gate only for changes that touch no `.vue` file.
3. **Establish the baseline once, up front.** Before editing, capture the pre-existing error set so
   new errors are distinguishable from inherited debt. Bound inherited failures explicitly as
   out-of-scope (owned by another feature's refactor); do not chase them and do not let them mask a
   regression.
4. **A gate failure can be a design signal.** Run the gate before declaring work done. When it fails
   on code that looks correct, re-examine the shape (a wrong reactive/persistence shape, a leaky
   boundary type, an inverted contract surface) before forcing it green.
5. **Never reshape conformant code to satisfy a pre-convention test.** A feature that predates the
   conventions ships tests that pin the rejected shape. Derive the layer's API from the rules, then
   **delete-and-replace** the stale test against the new shape — never bend the new design to make an
   outdated test pass.
6. **Standing repo debt is a first-class cleanup, not per-change residue.** The red baseline (stale
   tests, half-migrated features) should be retired by its own dedicated phase, not silently carried
   forward by every change. Until then, rule 1 keeps individual changes honest.

## Rationale
- **Per-file attribution (R1, R3):** an absolute-clean gate against a never-clean repo is either a
  permanent blocker or dead weight everyone learns to skip. Attribution restores a gate that actually
  gates — it answers "did *this* change regress anything?" which is the only question a reviewer can
  act on.
- **`vue-tsc` for SFCs (R2):** `tsc` greens are a false floor for view code; template bindings and
  `<script setup>` types are invisible to it. The interview view's shipped errors are the canonical
  near-miss.
- **Failure-as-signal + no stale-test appeasement (R4, R5):** `tsc`/`vitest` repeatedly caught
  design-level faults that reasoning missed (a `DataCloneError` from deep reactivity, an inverted
  contract surface). Treating a failure as "appease the test" is how a refactor silently re-imports
  the very pattern it was meant to remove.
- **Debt as its own phase (R6):** carrying the baseline forever guarantees every future session pays
  the re-discovery tax; retiring it once turns the gate back into a simple "is it green."
