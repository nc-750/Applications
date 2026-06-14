# 03 — Store architecture

## Scope
Decides how Pinia stores are defined, what a store may contain and expose, whether an app-level store
may exist and what it may hold, and how code reaches a store. Removes the `AppStore` spread-facade.
Builds directly on `02-layering-and-data-flow.md` (stores are leaf; cross-store work happens in an
injected service).

## Problem
There is a god-store. `src/AppStore.ts` is the only real Pinia store; it calls the three feature
store factories and **spreads** each into a nested aggregator. Every consumer couples to that
aggregator (`useAppStore().settings/.persona/.logger`) instead of the store it actually needs, so the
whole store graph is reachable from one import and the real stores are hidden behind it. Worse, the
three feature "stores" are **not** Pinia stores at all — they are plain factory functions that return
fresh `ref`s on every call, so the only reason state appears shared is the accident that `AppStore`
is a single cached `defineStore`. Calling a feature store factory directly would mint an unshared
copy.

## Current state
- `src/AppStore.ts` — `defineStore("app", …)` that does
  `{ settings: { ...settingsStore }, persona: { ...personaStore }, logger: { ...logStore } }`. The
  spread-facade itself.
- `src/settings/stores/index.ts`, `src/persona/stores/index.ts`, `src/logger/stores/index.ts` —
  plain functions (`export function useSettingsStore() { const x = ref(...); return { x, … } }`), not
  `defineStore`. No singleton guarantee; each call is a new ref set.
- `src/logger/services/logger.ts` (lines 34, 43) — reaches `useAppStore().logger` on *every* log line
  (`setDebugEnabled`, and inside `log()`), an inverted dependency through the facade.
- `src/settings/services/wipe.ts` (lines 5, 10, 15) — `useAppStore().persona`, `.settings`, `.logger`.
- `src/settings/pages/SettingsPage.vue` (lines 18–20) — `const appStore = useAppStore();
  const settingsStore = appStore.settings; const logStore = appStore.logger;`.
- `src/welcome/WelcomePage.vue` (line 8) — `useAppStore().settings.isLLMConfigured`.

## Decision
Delete the `AppStore` **spread-facade**: no store may aggregate or re-expose other stores. Each
feature store becomes a **real `defineStore` setup store** (a Pinia singleton), so the single live
copy the UI binds to is guaranteed by Pinia, not by an accident of caching. Consumers import the
specific store they need directly (`useSettingsStore()`, `usePersonaStore()`, `useLoggerStore()`). A
**minimal app-level store is permitted** only for genuinely app-wide state that belongs to no single
feature; it must never import, hold, spread, or re-export a feature store, and it carries state only —
no logic. A store returns its `ref`s and actions **flat** (never nested, never spread); it stays
**leaf** (imports only its own models and its db module — `02` rule 4). **Cross-store needs are met
by a service that receives both stores by injection** (`02` rules 4 & 6), never by one store importing
another.

## Rules
1. **No store aggregates or re-exposes another store.** Delete the `AppStore` spread-facade. A store
   never spreads (`{ ...otherStore }`), nests, or re-exports another store's state or actions.
2. **Every store is a real `defineStore` setup store.** Define state with `ref`/`computed` inside the
   setup, return them, and rely on Pinia for the single shared instance. Do not hand-roll a factory
   that returns fresh refs and call it a store.
3. **Consumers import the specific store they need.** A view or service calls `useSettingsStore()` /
   `usePersonaStore()` / `useLoggerStore()` directly. There is no aggregator to reach state through.
4. **A store returns a flat surface.** Return `ref`s, `computed`s, and actions at the top level of the
   setup return object. No nesting, no grouping objects, no spreads. Name `ref`s for the state they
   hold and `computed`s for the derived value (`isLLMConfigured`, not `llmConfigComputed`). "No
   grouping objects" forbids ad-hoc return groupings (`{ foo: { … } }`), **not** a single domain
   aggregate held in one `ref`/`reactive`. When a store's source of truth is one domain object, hold it
   as `reactive<Feature>(createEmpty…())` and expose the flat surface via `toRefs(state)` — the `toRefs`
   refs are live writable views onto the object's properties. **Never rebind the reactive target**
   (`state = next` orphans every `toRefs` ref); a whole-record swap (load-from-db, reset,
   commit-a-complete-object) mutates in place with `Object.assign(state, next)`, the single replacement
   helper. A model used this way must be **total** (every key present; optionals typed `T | undefined`,
   not `T?`; `createEmpty…()` sets them all) — `06-naming`/`01-data-models` rule 3 — or `toRefs` mints
   no ref for an absent key and `Object.assign` leaves a stale value through a reset.
5. **A store holds state only — no app logic** (re-states `02` rule 3). Actions are thin commits:
   assign the reactive state and persist via the db module. Decisions and orchestration live in
   services.
6. **Stores stay leaf** (re-states `02` rule 4). A store imports only its own models and its db
   module — never another store, never a service.
7. **Cross-store work goes in an injected service** (re-states `02` rule 6). A function that needs two
   stores is a service that receives both as arguments; it must not be solved by a store importing
   another store, nor by re-introducing an aggregator.
8. **A minimal app-level store is allowed only for genuinely global state** — state that belongs to no
   single feature (e.g. an app-wide UI flag). It holds state only, follows rules 1–6, and must never
   import, hold, or re-export a feature store. If no such state exists, no app store exists. It is not
   a home for "things shared between features" — that is what an injected service is for.

## Rationale
- The owner kept the door open to a **minimal app store** for real app-wide state, but only as a
  feature-less leaf: the failure mode being removed is not "an app store exists," it is "the app store
  reaches into / re-exposes feature stores." Rule 8 permits the former and forbids the latter.
- **Real `defineStore` singletons** are what actually make the store "the live copy the UI binds to"
  from `02`. With plain factories, the shared copy only existed because one `defineStore` (the facade)
  was cached and everyone went through it — remove the facade and the plain factories would silently
  give each caller an unshared copy. Converting to `defineStore` makes the sharing intentional and
  removes the reason the facade existed.
- **Importing the specific store** instead of a god-facade is the same anti-aggregator principle as
  `02`'s "no central `src/db/` god module": reachability should follow need, so a change to one store
  doesn't ripple through an object every consumer imports.
- **Flat returns + leaf + injected cross-store service** are inherited from `02` and restated here so
  this file is self-contained for the store layer; they keep the dependency graph a DAG and each store
  unit-testable in isolation.

## Before / After

**1 — The spread-facade → direct store imports**
```ts
// ❌ before — src/AppStore.ts
export const useAppStore = defineStore("app", () => {
  const settingsStore = useSettingsStore();
  const personaStore = usePersonaStore();
  const logStore = useLoggerStore();
  return {
    settings: { ...settingsStore },
    persona:  { ...personaStore },
    logger:   { ...logStore },
  };
});
// consumer:
const settingsStore = useAppStore().settings;
```
```ts
// ✅ after — AppStore.ts deleted; consumer imports the store it needs
import { useSettingsStore } from "../stores";
const settings = useSettingsStore();
```

**2 — Plain factory → real `defineStore` singleton**
```ts
// ❌ before — src/persona/stores/index.ts
export function usePersonaStore() {
  const persona = ref<Persona>(createEmptyPersona());
  async function savePerson(newPersona: Persona) { /* … */ }
  return { persona, loadPersona, savePerson, clearPersona };
}
```
```ts
// ✅ after — Pinia guarantees one shared instance
export const usePersonaStore = defineStore("persona", () => {
  const persona = ref<Persona>(createEmptyPersona());
  async function savePersona(next: Persona) {
    persona.value = next;        // commit the live copy
    await db.savePersona(next);  // persist via the db module (02 rule 2)
  }
  return { persona, loadPersona, savePersona, clearPersona };
});
```

**3 — Logger reaching the facade per call → importing its own store directly**
```ts
// ❌ before — src/logger/services/logger.ts
function log(level, category, message, opts) {
  const store = useAppStore().logger;   // inverted dependency through the god-facade
  // …
  store.appendLog(entry);
}
```
```ts
// ✅ after — the logger service depends on the logger store, nothing else
import { useLoggerStore } from "../stores";
function log(level, category, message, opts) {
  const store = useLoggerStore();
  // …
  store.appendLog(entry);
}
```
(The deeper "logger should not reach up into Pinia at all" question is `05-utilities-and-cross-cutting`.
This file only removes the *facade* coupling.)

## Confirmed preferences & rejected alternatives
- **Chosen:** delete the `AppStore` spread-facade; convert each feature store to a real `defineStore`
  singleton; consumers import the specific store; flat store return surface; stores stay leaf;
  cross-store work via an injected service; a **minimal app-level store is allowed** for genuinely
  global state only (state-only, never re-exposing a feature store). For a single-aggregate store,
  `reactive` + `toRefs` over one total domain object, replaced via `Object.assign` (never by rebinding
  the reactive target).
- **Rejected — a god-`record` the UI couples through (`store.record.x`) OR N hand-synced refs with
  `snapshot()/hydrate()` field-listing:** the first hides the flat surface behind indirection, the
  second lists every field three times; `reactive` + `toRefs` gives the flat surface and one object to
  persist without either cost.
- **Rejected — rebinding the reactive target (`state = next`) or `structuredClone(toRaw(state))` at the
  persist boundary:** the first orphans the `toRefs` refs; the second is a shallow clone that still
  throws `DataCloneError` on nested Vue proxies (deep-plain copy required — see `02` rule 3).
- **Rejected — keeping the spread-facade / any store that aggregates other stores:** the god-store
  being removed; couples every consumer to the whole store graph and hides the real stores.
- **Rejected — plain factory functions as "stores":** no singleton guarantee; once the cached facade
  is gone they silently hand each caller an unshared ref set.
- **Rejected — one store importing another store to satisfy a cross-store need:** re-creates cycles
  and an implicit aggregator; cross-store work is a service that receives both (`02` rules 4 & 6).
- **Rejected — an app store that re-exposes feature stores under a thinner wrapper:** same coupling as
  the facade with extra indirection; the permitted app store is state-only and feature-store-free.

## Open / deferred
- **No genuinely global state is identified today**, so the minimal app store from rule 8 need not be
  created yet — add it only when a first piece of app-wide, feature-less state appears.
- **Store-action naming** (`setX`/`savePersona` vs semantic actions) → `06-naming` (also fixes
  `savePerson` → `savePersona`).
- **Whether the logger should depend on Pinia at all** (vs a module-level sink) → `05`. This file only
  removes the facade coupling, not the store dependency itself.
- **Physical edits to app code** are out of scope for this plan; this file records the convention only.
