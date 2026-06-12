# 05 — Utilities & cross-cutting dependencies

## Scope
Decides three cross-cutting pain points: the logger depending on the Pinia app store; generic
helpers mislabeled under a feature (`fileManager`); and app-lifecycle code (`factoryReset`) living
under a feature (`settings`).

## Problem
Foundational, cross-cutting code reaches *upward* into the app instead of staying dependency-light.
The logger — used at boot before any store exists — fetches a Pinia store on every call. Generic
helpers (`cn`, `openExternal`) are parked inside a feature, and one feature imports another feature's
helper laterally. An app-wide lifecycle operation (`factoryReset`) lives inside `settings`, making
that feature depend on every other feature. The dependency graph is not one-directional.

## Current state
- `src/logger/services/logger.ts` — `log()` and `setDebugEnabled()` call `useAppStore().logger` per
  invocation; `src/logger/services/export.ts` reads the buffer via `useAppStore().logger` and imports
  `downloadFile` from `fileManager`. Yet `src/main.ts` wires `logger.error` into `window` `error` /
  `unhandledrejection` handlers at boot.
- `src/fileManager/services/utils.ts` — mixes `cn` (markup classnames, 0 uses), `openExternal`
  (open URL in OS browser, 0 app uses), `downloadFile` (file I/O), `readFileAsText` (file I/O).
- `src/settings/services/wipe.ts` — `factoryReset()` composes `wipePersona`/`wipeSettings`/
  `wipeLogs`, nukes SW + caches, resets theme via `localStorage`, and `location.reload()`s.
- Tests already sit under `src/__tests__/lib/` (`utils.test.ts`, `wipe.test.ts`), implying `lib/`
  was the intended home.

## Decision
Foundational and cross-cutting modules depend downward only. The logger owns its buffer and debug
flag as module-level reactive state and depends on nothing app-specific; the Pinia logger store is
removed, and the UI reads a readonly reactive snapshot. Generic, feature-agnostic helpers live in
`src/lib/`, split into concern-named files; the file-I/O helpers move to `lib/file.ts`. Cross-feature
lifecycle orchestration (e.g. `factoryReset`) lives in `src/core/` and only composes each feature's
own public teardown; features keep owning their internals. `app/` is reserved for the Vue root.

## Rules
1. Foundational / cross-cutting modules (logging, generic helpers) MUST NOT import from higher
   layers — no `useAppStore()` / Pinia, no services, no views. Dependencies point downward only.
2. A utility is pure or receives its dependencies as arguments; it never reaches up to fetch global
   state to do its job.
3. Foundational state that a UI merely toggles or displays (e.g. a debug flag, a log ring buffer)
   lives in the foundational module as module-level reactive state, exposed via explicit functions
   plus a readonly reactive snapshot — it is NOT promoted into a Pinia store.
4. Generic, feature-agnostic helpers live in `src/lib/`, split into concern-named files
   (`dom.ts`, `platform.ts`, `file.ts`, …). No catch-all `utils.ts`.
5. A helper belongs in `lib/` when its signature names no feature concept and at least one feature
   outside its origin could use it; it is feature-local when it embeds that feature's domain
   types/logic. Decide a helper's home by its dependencies and reuse surface — not by which feature
   first happened to need it.
6. A feature MUST NOT import a generic helper laterally from another feature; import it from `lib/`.
7. Cross-feature lifecycle / bootstrap operations (factory reset, boot wiring, app-wide teardown)
   live in `src/core/`, not inside a feature. (`app/` is reserved for the Vue application root.)
8. An app-lifecycle orchestrator composes each feature's own public operations (e.g. each store's
   `clear*`); it does not re-implement a feature's internal teardown. Each feature still owns its own.
9. The shared/foundational layers may depend on each other when both are foundational (e.g. a `lib/`
   helper may use the logger), but never on stores, services, or views.

## Rationale
Foundational modules must be usable at boot and in isolation (the logger runs inside `main.ts`
`window` handlers before any store mounts). Pulling app state into them creates an inverted
dependency and makes them untestable without Pinia. Honest, concern-named files in `lib/` stop the
"junk-drawer utils under whatever feature touched it first" drift. Putting `factoryReset` in `core/`
removes the hidden hub where `settings` depended on persona + logger + itself. The owner accepted
slightly more folders (`core/`, split `lib/*`) in exchange for a one-directional dependency graph and
discoverability.

## Before / After

### 1. Logger no longer depends on the store
Before — `src/logger/services/logger.ts`:
```ts
import { useAppStore } from "../../AppStore";

export function setDebugEnabled(enabled: boolean): void {
  useAppStore().logger.setDebugEnabled(enabled);
}

function log(level, category, message, opts) {
  const store = useAppStore().logger;
  if (level === "debug" && !store.debugEnabled) return;
  // …build entry…
  store.appendLog(entry);
}
```
After — buffer + flag owned by the logger module; no Pinia; UI reads a snapshot:
```ts
import { ref, readonly } from "vue";
import type { LogEntry } from "../models/types";

const entries = ref<LogEntry[]>([]);
const debugEnabled = ref(true); // TODO: default false in production
const MAX_ENTRIES = 500;

export const logEntries = readonly(entries);           // UI reads this
export function setDebugEnabled(enabled: boolean) { debugEnabled.value = enabled; }

function log(level, category, message, opts) {
  if (level === "debug" && !debugEnabled.value) return;
  // …build entry…
  entries.value = entries.value.length >= MAX_ENTRIES
    ? [...entries.value.slice(1), entry]
    : [...entries.value, entry];
}
```
`src/logger/stores/index.ts` (the Pinia `useLoggerStore`) and the logger slice of `AppStore` are
deleted; `LogViewer.vue` and `export.ts` import `logEntries` / `setDebugEnabled` from the logger
module.

### 2. Generic helpers leave the feature for `lib/`
Before — `src/fileManager/services/utils.ts` (one file, four unrelated helpers):
```ts
export function cn(...classes) { /* markup classnames */ }
export function downloadFile(content, filename, mimeType) { /* file I/O */ }
export function readFileAsText(file) { /* file I/O */ }
export async function openExternal(url) { /* open URL in OS browser */ }
```
After — split by concern under `src/lib/`:
```ts
// src/lib/dom.ts
export function cn(...classes: (string | false | null | undefined)[]): string { … }

// src/lib/file.ts
export function downloadFile(content: string, filename: string, mimeType = "text/plain"): void { … }
export function readFileAsText(file: File): Promise<string> { … }

// src/lib/platform.ts
export async function openExternal(url: string): Promise<void> { … }
```

### 3. Cross-feature import + lifecycle move
Before — `src/logger/services/export.ts` imports a sibling feature + the store:
```ts
import { downloadFile } from "../../fileManager/services/utils";
import { useAppStore } from "../../AppStore";
const { logEntries: entries } = useAppStore().logger;
```
After — both come from foundational layers:
```ts
import { downloadFile } from "../../lib/file";
import { logEntries } from "./logger";
```
And `factoryReset` moves `src/settings/services/wipe.ts` → `src/core/factoryReset.ts`, composing
each feature's own `clear*` (persona/settings/logs) rather than living under `settings`.

## Confirmed preferences & rejected alternatives
- Chosen: logger owns a module-level reactive buffer + debug flag; the Pinia logger store is dropped
  entirely; `src/core/` for cross-feature lifecycle; `src/lib/` split by concern; file-I/O helpers in
  `lib/file.ts`.
- Rejected — injected-sink or event-emitter logger: store would still own the buffer and it adds
  ceremony; module-level state is enough for a single boolean + a list.
- Rejected — keeping a thin reactive logger store: extra indirection for no gain once the logger owns
  the buffer.
- Rejected — leaving `factoryReset` in `settings`: makes `settings` a hub depending on every feature;
  the op isn't a settings concern (reload, theme, SW/caches).
- Rejected — a single catch-all `lib/utils.ts`: trends back toward a junk drawer; use concern files.
- Rejected — keeping `downloadFile`/`readFileAsText` in `fileManager`: perpetuates the lateral
  feature→feature import (logger → fileManager).
- Rejected — naming the lifecycle folder `app/`: collides with the Vue application root; use `core/`.

## Open / deferred
- `cn` and `openExternal` are currently unused. Whether to keep or delete them is a dead-code-policy
  call owned by Session 7; this session only relocates them.
- Whether `lib/` helpers may depend on the logger is allowed here (both foundational); if a stricter
  purity rule is wanted later, revisit `openExternal`'s warn-log.
- The error-handling style inside `factoryReset` (try/catch + `logger.warn`) is left to Session 7's
  per-layer error convention.
