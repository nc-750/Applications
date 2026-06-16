# Refactor-session retrospective — process lessons

A retrospective on **how** the interview-feature refactor sessions went as a *process* (not a code
review), distilled into lessons for the next refactor plan and future feature work. Paste the
**"Inputs for the next refactor plan"** section below into the planning prompt for the next feature
(Settings).

Each session executed one rung of the master plan (model → reference → db → store → prompts →
services → view) per the `feature-refactor-playbook` skill: pick the lowest incomplete phase, plan,
implement, verify, stop, stay in scope.

## Per-session synopsis (process only)

| Phase | What went well | What it cost / signal |
|---|---|---|
| **1.1 — `src/llm/` factory** | Established the red `tsc` baseline up front; **mapped every ripple site before moving types**; used the architecture skill as a **live validator**, which caught a real violation (`testConnection` returning a `Result` object up to the view). Single-pass fix. | Low. The skill-as-validator catch is the model behavior to repeat. |
| **1.2 — `src/db/` connection** | Tight scope; documented the `getDB` lazy-accessor naming exception **in code**; bounded stale tests as "not mine." | Near-zero friction — the template session. |
| **"1.3" → actually 2.1 (model + reference)** | Detected that the kickoff label "Phase 1.3" doesn't exist in the plan, invoked the playbook, **self-corrected to 2.1**. | The kickoff's phase number can be stale (→ L5). |
| **2.2 — db + mappers** | Tiny, linear, ~1 edit. | A well-bounded rung is cheap. |
| **2.3 — store** | Ended by capturing the chosen pattern into a convention (§3.4) + memory. | **The expensive one: 43 edits, 155 user turns.** Driven by the owner pausing mid-implementation to interrogate a design the conventions didn't yet prescribe ("why multiple refs imaging the interview? … Do not change your code, I want to understand"). An unprescribed design fork litigated live is the biggest time sink observed (→ L2). |
| **2.4 — prompts** | **Test-driven deletion** (wrote new per-flow tests *before* deleting the old god-facade tests); a `prompts/README` flow-map; framed the gate as "zero errors in *touched* files"; deleted all dead files; changed no wording. | Low — a model scope-disciplined refactor. |
| **2.5 / 2.6 review (landing the services + view)** | Caught and fixed the view's real type bugs before commit; committed in targeted commits. | Surfaced two gate blind spots the earlier sessions missed (→ L1) and the runtime-dependency gap (→ L3). |

**Cross-session:** scope discipline was **uniformly excellent**. The per-phase "Out of scope" wall is
the most effective single device in the method.

## Lessons

### New

**L1 — The verify gate has two blind spots.**
- `bunx tsc --noEmit` does **not** type-check `.vue` SFCs — only `vue-tsc --noEmit` (the `build`
  script) does. The interview view shipped `.vue` type errors `tsc` reported clean.
- The repo baseline is **permanently red** (pre-existing errors from other features' stale tests), so
  "`tsc` clean" is unachievable and misleading. The real gate is **no NEW errors / zero errors in the
  files this rung touched** (baseline-diff + per-file attribution).

**L2 — Pre-decide non-obvious design forks; don't litigate them mid-implementation.** When a rung has
a genuine design fork with >1 viable pattern that no convention prescribes, surface it as a short
**design checkpoint** (options + recommendation) and get a decision *before* building — then fold the
decision back into the conventions (discovery → decision → convention).

**L3 — Order phases by runtime need, not just the static layer graph.** A rung can be layer-complete
yet runtime-broken if a sibling/lower module it *consumes* is still a deferred stub. The interview
view (2.6) dropped `AppStore` and imported `useSettingsStore`/`usePersonaStore` directly — but those
remain factory stubs, so the feature can't read the shared LLM config and doesn't fully type-check.
**The Settings store refactor unblocks Interview — it is the correct immediate next phase.**

**L4 — A fix-on-touch across a feature boundary is in-scope; the sibling's full refactor is not.** The
synthesis bridge (2.5) had to rename Persona `carreer`→`career` and add `name`/`derived` to map
honestly — required to compile and mandated by naming rule 6.13, even though the Persona refactor was
deferred. A minimal honesty-fix to a field you must cross is in-scope; do not expand into the
sibling's whole model.

**L5 — The kickoff's phase number can be stale.** Confirm the lowest-numbered incomplete phase against
the plan **and** project memory before planning (the "1.3"=2.1 case).

### Already captured (single-sourced — see linked homes, do not re-derive)

- **Stale / pre-convention tests are outdated, not the spec** — derive the API from the rules,
  delete-and-replace the stale test. (`feature-refactor-playbook` boundary discipline; `08-verification.md`
  R5; `refactor-process-lessons` memory.)
- **A verify-gate failure can be a design signal, not a coding slip.** (`08-verification.md` R4; same memory.)
- **Don't over-literalize an enumerated store surface** — a brief lists the exposed contract, not the
  internal storage; one `reactive` aggregate + `toRefs` beats N hand-synced refs. (CONVENTIONS §3.4;
  `vue-reactive-store-pattern` memory.)

## Keep doing

- **Baseline-first:** capture the pre-existing error set before editing, so new errors are distinguishable.
- **Ripple-map before a move:** enumerate every caller of a type/symbol before relocating it (1.1).
- **Skill-as-live-validator:** invoke `vue-feature-architecture` *during* implementation, not only at
  planning — it caught the `Result`-to-view leak in 1.1.
- **Test-driven deletion:** write the replacement tests for the new shape *before* deleting the old
  tests (2.4).
- **Flow-map READMEs** in reorganized folders (2.4 `prompts/README`).
- **Document deliberate convention exceptions in code** (the `getDB` lazy-accessor note, 1.2).
- **Treat the per-phase "Out of scope" line as a hard wall** — it is what kept every session bounded.

## Inputs for the next refactor plan (Settings)

Bake these into the Settings master plan up front:

1. **Sequence the Settings `defineStore` conversion before any consumer that depends on it (L3).** The
   interview view already consumes `useSettingsStore`/`usePersonaStore` as real singletons; converting
   them from factory stubs to real `defineStore` setup stores is the unblocking work and belongs at the
   front. (Persona's store is in the same state — consider converting both.)
2. **Add a stale-test / red-baseline cleanup as its own early phase** so the gate can actually reach
   green afterward, instead of carrying the baseline forward forever (`08-verification.md` R6).
3. **Name `vue-tsc --noEmit` (not `tsc`) in the Verify line of every `.vue`-touching rung (L1).** Frame
   each rung's gate as "no new errors in touched files," not absolute clean.
4. **Pre-decide the store shape at planning time (L2).** §3.4 + `vue-reactive-store-pattern` largely
   prescribe it now (single `reactive` aggregate + `toRefs`); cite them so the Settings store rung does
   not re-litigate what the interview store rung already paid for.
5. **State the fix-on-touch-vs-deferred-scope rule explicitly (L4):** the Settings refactor may need
   minimal honesty-fixes to fields it crosses in sibling features — that is in-scope; the sibling's
   full refactor is not.
6. **Confirm the phase number against plan + memory before planning each session (L5).**
