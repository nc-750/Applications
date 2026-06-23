# Utilities & cross-cutting dependencies

Where foundational/cross-cutting code lives and what it may depend on: logging, generic helpers, and
app-lifecycle/bootstrap operations. The theme: foundational code depends **downward only**.

> **Binding source:** `mirror/app/CONVENTIONS.md §5`. This file distills those rules with rationale
> and examples; when they disagree, `CONVENTIONS.md` wins.

## Why this exists

Foundational, cross-cutting code tends to reach *upward* into the app. A logger — used at boot before
any store exists — fetches a Pinia store on every call. Generic helpers (`cn`, `openExternal`,
`downloadFile`) get parked inside a feature, and one feature imports another feature's helper
laterally. An app-wide lifecycle op (factory reset) lives inside a feature, making that feature depend
on every other feature. The dependency graph stops being one-directional.

## Rules (binding)

1. **Foundational / cross-cutting modules (logging, generic helpers) must not import from higher
   layers** — no Pinia stores, no services, no views. Dependencies point downward only.
2. **A utility is pure or receives its dependencies as arguments**; it never reaches up to fetch
   global state to do its job.
3. **Foundational state that a UI merely toggles or displays** (a debug flag, a log ring buffer)
   lives in the foundational module as **module-level reactive state**, exposed via explicit functions
   plus a `readonly` reactive snapshot — not promoted into a Pinia store.
4. **Generic, feature-agnostic helpers live in `src/lib/`, split into concern-named files**
   (`dom.ts`, `platform.ts`, `file.ts`, …). No catch-all `utils.ts`.
5. **Decide a helper's home by its dependencies and reuse surface, not its origin.** It belongs in
   `lib/` when its signature names no feature concept and at least one feature outside its origin
   could use it; it is feature-local when it embeds that feature's domain types/logic.
6. **A feature never imports a generic helper laterally from another feature** — it imports it from
   `lib/`.
7. **Cross-feature lifecycle / bootstrap operations** (factory reset, boot wiring, app-wide teardown)
   live in `src/core/`, not inside a feature. (`app/` is reserved for the Vue application root.)
8. **An app-lifecycle orchestrator composes each feature's own public operations** (e.g. each store's
   `clear*`); it never re-implements a feature's internal teardown.
9. **Foundational layers may depend on each other** when both are foundational (e.g. a `lib/` helper
   may use the logger), but never on stores, services, or views.

## Rationale

Foundational modules must be usable at boot and in isolation — a logger runs inside `window`
error/unhandledrejection handlers in `main.ts` before any store mounts, so pulling app state into it
creates an inverted dependency and makes it untestable without Pinia. Module-level reactive state
(`ref` + a `readonly` snapshot) is enough for a single boolean and a list; a store would re-introduce
the upward dependency. Honest, concern-named files in `lib/` stop the "junk-drawer utils under
whatever feature touched it first" drift. Putting lifecycle ops in `core/` removes the hidden hub where
one feature depended on every other. The cost — a few more folders (`core/`, split `lib/*`) — buys a
one-directional graph and discoverability.

## Before / After (illustrative)

### Logger no longer depends on the store
```ts
// ❌ before — fetches a Pinia store on every call
export function setDebugEnabled(on: boolean) { useAppStore().logger.setDebugEnabled(on); }
function log(/* … */) { const s = useAppStore().logger; if (!s.debugEnabled) return; s.appendLog(e); }

// ✅ after — the module owns its buffer + flag; the UI reads a snapshot
import { ref, readonly } from "vue";
const entries = ref<LogEntry[]>([]);
const debugEnabled = ref(false);
export const logEntries = readonly(entries);                 // UI reads this
export function setDebugEnabled(on: boolean) { debugEnabled.value = on; }
function log(/* … */) { if (!debugEnabled.value) return; entries.value = [...entries.value, e]; }
```

### Generic helpers leave the feature for `lib/`
```ts
// ❌ before — one file, four unrelated helpers, parked under a feature
// <feature>/services/utils.ts → cn, downloadFile, readFileAsText, openExternal

// ✅ after — split by concern under src/lib/
// src/lib/dom.ts      → cn(...)
// src/lib/file.ts     → downloadFile(...), readFileAsText(...)
// src/lib/platform.ts → openExternal(...)
```

### Cross-feature import + lifecycle move
```ts
// ❌ before — a feature imports a sibling feature's helper + the global store
import { downloadFile } from "../../otherFeature/services/utils";
const { logEntries } = useAppStore().logger;

// ✅ after — both come from foundational layers
import { downloadFile } from "../../lib/file";
import { logEntries } from "./logger";
// and an app-wide factoryReset() lives in src/core/, composing each feature's own clear*().
```

## Confirmed preferences (and what was rejected)

- **Chosen:** logger owns a module-level reactive buffer + flag (no Pinia logger store); `src/core/`
  for cross-feature lifecycle; `src/lib/` split by concern; file-I/O helpers in `lib/file.ts`.
- **Rejected:** an injected-sink or event-emitter logger (a store would still own the buffer + adds
  ceremony); a thin reactive logger store (indirection for no gain); leaving lifecycle ops in a
  feature (makes it a hub depending on every feature); a catch-all `lib/utils.ts`; keeping shared I/O
  helpers in a feature (perpetuates lateral feature→feature imports).

## Verify

- Grep foundational modules (`logger`, `lib/*`, `core/*`) for `useAppStore`/`use*Store`/service/view
  imports — there should be none.
- No `utils.ts`; `lib/` files are concern-named.
- No feature imports a helper from another feature's folder; lifecycle ops live in `core/`.
