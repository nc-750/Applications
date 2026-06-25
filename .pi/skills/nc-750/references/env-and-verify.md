# Environment & global verify gate

The shared environment facts and the global verification gate every implementer and every build-mode
review inherits. Distilled from recurring friction in the usage report — these are the dead ends not
to rediscover.

## Environment (Windows)

- **Package/runtime web frontend:** Use `bun` / `bunx` / `bun run <script>`. **Never** `npm` / `npx` /
  `node`. Any `npm` examples in older docs are stale.
- **Shell: PowerShell is the default** for file operations on this machine. The Bash tool exists for
  POSIX scripts but has silently produced no output for some file operations here — prefer PowerShell
  or the dedicated file tools.
- **Git over SSH: separate SSH keys per GitHub account** — not one shared key with config aliases
  (the multi-account-same-key setup repeatedly failed).
- **No Python interpreter** is assumed available; don't route tooling through Python.

## Global verify gate (applies to every build phase)

A phase is not done until all of these hold. This is *on top of* the phase brief's own **Verify**
line.

- **Type-check: no NEW errors, judged per touched file.** The repo may carry a standing red baseline
  (stale tests for not-yet-refactored code); establish that baseline first and judge the phase by
  "zero errors in the files I touched," not a raw total.
- **`.vue` files need `vue-tsc`, not bare `tsc`.** Plain `tsc --noEmit` silently skips every SFC.
  Any phase touching a `.vue` gates on `bunx vue-tsc --noEmit` (the `build` script); `tsc` alone is
  acceptable only for phases that touch no `.vue`.
- **Tests green, with exact counts reported.** Run the relevant `bun run test` (vitest) suite; report
  the exact pass/fail counts. Update tests that pinned an old shape rather than leaving them red or
  deleting coverage.
- **A gate failure can be a design signal,** not just a coding slip. When `tsc`/tests fail on
  conformant-looking code, re-examine the shape before forcing it green.
- **No new `console.log`, dead code, or silent stub.** Dead code a phase replaced is deleted (git is
  the history).
- **Dependency direction holds.** No upward edge introduced (a store importing another store/service,
  a view building a client or running a query, a DTO/key field surfacing in a store/view).
- **Out-of-scope boundary respected.** Nothing in the diff belongs to a later phase or a flagged
  follow-up.
- **Claims literally true; no invented lore.** Anything user-facing (copy, disclosures, commit
  messages) states the per-path truth and invents no canon/lore (`ETHOS.md` C5.5, C7).
