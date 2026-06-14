# 02 — Layering & data flow

## Scope
Decides separation of concerns and the allowed dependency direction across the app: what each layer
(view / service / store / db) may do, which layer may depend on which, and who mutates vs. persists
state. Pairs with `01-data-models-and-transforms.md` (the shapes that cross these boundaries).

## Problem
There is no enforced layer contract. App logic and infrastructure construction live in views; views
mutate the reactive domain model directly; persistence logic is being written back inside stores; and
nothing pins the direction of dependencies. The result is code that can only be exercised through the
UI, state and storage that can drift, and modules that import each other in circles.

## Current state
- `src/interview/pages/InterviewPage.vue` — a **view** that (a) builds an LLM client itself
  (`getLLMForInterview`, lines 64–102), (b) orchestrates the whole interview flow (`startInterview`,
  `runFirstAnalysis`, `runAnalysisForNextQuestion`), and (c) mutates the reactive domain model in
  place: `persona.interview.messages.push(...)` (lines 196, 236).
- `src/settings/stores/index.ts` (lines 9–29) and `src/persona/stores/index.ts` (lines 7–15) —
  **stores** carrying private `…FromDB` stubs (`saveSettingsToDB`, `loadSettingsFromDB`,
  `clearSettingsFromDB`) and comments to do the DB-record↔app transform inline. Persistence logic is
  moving into the in-memory state layer.
- No `db/` module exists. The connection/transform helpers (`getDB`, `closeDB`,
  `wipeIndexedDBDatabase`) documented as `src/db/schema.ts` were removed during the refactor and have
  no home. (The old `migrateFromOldDB` is dead — the app has never shipped — and is dropped.)
- `src/settings/services/wipe.ts` (lines 1–17) — **services** reaching stores via
  `useAppStore()` internally rather than receiving them.
- `src/interview/services/index.ts` — the service module the view bypasses (only `isDigestionNeeded`
  and a `digestData` stub live here; the orchestration that belongs here is inline in the view).

## Decision
The app has four layers with a single allowed dependency direction — **view → service → store → db**
— plus views binding to store state read-only and calling services. The **db module is the sole owner
of persistence** (the connection, queries, and the domain↔DTO transform). **Stores hold the reactive
in-memory copy of state plus thin commit actions** and are **leaf** (they import only their own models
and their db module). **Services own all app logic and orchestration**, receive the stores they need
as **arguments**, and **decide** the next state — which a store **commits** (assign the reactive ref +
persist via db). **Views contain no app logic, build no infrastructure, and never mutate a model.**
IndexedDB's single-database/single-version nature is respected by keeping **one central connection +
schema module** while each feature owns its own record type and read/write functions.

## Rules
1. **One dependency direction: view → service → store → db.** A layer may depend only on layers below
   it. The only added edges are view → store (read-only reactive binding) and view → service. Nothing
   depends upward.
2. **The db module is the sole owner of persistence.** Only db-module code opens the connection, runs
   queries, and applies the domain↔DTO transform at the persistence boundary. No store, service, or
   view issues a query or constructs/handles a DTO.
3. **A store holds reactive in-memory state and thin commit actions only.** A store action does at most
   two things: assign the reactive state, and persist via the db module. It contains no business
   logic, no orchestration, and no inline queries. **Reactive state is not structured-clone-safe** — a
   deep `reactive` object (and any value spread out of one) carries Vue proxies that IndexedDB's
   structured clone rejects (`DataCloneError`), and `toRaw()` only un-proxies the top level. So the
   commit hands the db module a **deep-plain copy** of the state, not the reactive object itself; for a
   JSON-safe record `JSON.parse(JSON.stringify(state))` is the reliable one-line conversion.
4. **Stores are leaf.** A store imports only its own models and its db module — never a service, never
   another store. Anything spanning two stores is done in a service that receives both.
5. **Services own app logic and orchestration** (decisions, multi-step flows, external calls such as
   the LLM). Behavior the user triggers lives in a service, not a view or a store.
6. **Services receive stores by injection.** A service takes the store(s) it needs as arguments; it
   must not call `useAppStore()` / `useXStore()` internally. This keeps the dependency explicit and the
   service testable without a live Pinia instance.
7. **The service decides; the store commits.** The service computes the next value (or a trivial
   intent) and calls a named store action. It must never assign the store's reactive ref or mutate the
   store's reactive object from outside.
8. **No business logic in a store action.** If producing the next value needs a rule or a decision, the
   service produces it and hands the result to a thin commit action. Only ruleless state transitions
   (append to a list, set a flag) may be semantic store actions.
9. **Views contain no app logic and never mutate a model.** A view binds to store state, calls
   services for behavior, and calls store actions only for trivial state. It must not push into or
   reassign a domain model, build infrastructure (e.g. an LLM client), or run multi-step flows.
10. **Cross a layer boundary only through that layer's transform**, and never leak a lower layer's
    shape upward (a DB record `id`/DTO field must not appear in a store or view). See
    `01-data-models-and-transforms.md`.
11. **One central module owns the IndexedDB connection + schema** (object stores, version,
    upgrade/migrations) — because IndexedDB is one database at one version. Each feature owns its own
    record (DTO) type and read/write functions in `<feature>/db/`, importing the shared connection. No
    feature opens its own connection.

## Rationale
- A store is the app's **reactive in-memory copy of state** (the live data the UI is bound to) — not a
  repository and not a place for logic. Frontend has *two* sources of truth that backend doesn't split:
  the durable copy (IndexedDB) and the live copy the screen watches (the store). That is the whole
  reason "save" becomes a store action instead of a local call: the live copy must live where the UI
  observes it. Keeping logic out of that layer is what makes the store, the db, and the services each
  independently testable and swappable.
- **Injection over `useAppStore()` inside services** is plain dependency injection: explicit
  dependencies, unit-testable services, no coupling to the global store registry. The existing
  `useInterview(store)` reference and its test already follow this grain.
- **Central connection + per-feature queries** is the minimum that respects IndexedDB's
  single-versioned-database constraint *without* re-creating a god module. A fully-central `src/db/`
  would become a dumping ground that fights the per-feature structure; fully per-feature *connections*
  are not possible (one DB, one upgrade callback that must know every object store). The owner accepted
  ~3 small `<feature>/db/` files + 1 connection module as the right cost for a one-person app — not
  over-engineering, just the same functions filed by feature.
- **Leaf stores** remove the conditions that produced the `AppStore` spread-facade and any
  store→service→store cycle; the flow stays a clean DAG.

## Before / After

**1 — View owns logic + mutates the model → service decides, store commits**
```ts
// ❌ before — src/interview/pages/InterviewPage.vue (the VIEW)
const llm = getLLMForInterview();              // view builds infrastructure
// ...orchestrates the whole flow in the view...
persona.interview.messages.push(systemPrompt); // view mutates the reactive model directly
```
```ts
// ✅ after
// service (decides) — receives the store, owns the flow:
async function runFirstProbe(personaStore, llm) {
  const next = appendInterviewMessage(personaStore.persona, systemPrompt); // pure model transform
  await personaStore.setPersona(next);          // hand the decided value to a commit action
}
// store action (commits) — no logic:
async function setPersona(next: Persona) {
  persona.value = next;          // update the live copy the UI binds to
  await db.savePersona(next);     // persist via the db/repository module
}
// view — calls the service, binds to state, mutates nothing:
await runInterviewFlow(personaStore, settingsStore, userInput, files);
```

**2 — Persistence inline in a store → store delegates to the db module**
```ts
// ❌ before — src/settings/stores/index.ts
async function saveSettings(config: LLMConfig) {
  llmConfig.value = config;
  // Transform from App objects to DB record
  // Calls saveSettingsToDB
}
async function saveSettingsToDB() {}   // query/transform stub living inside the store
```
```ts
// ✅ after — store commits + delegates; db owns the query and the transform
import * as db from "../db";          // settings/db/ — the repository
async function saveSettings(config: LLMConfig) {
  llmConfig.value = config;            // commit the live copy
  await db.saveSettings(config);        // db applies LLMConfig → SettingsRecord and writes
}
```

**3 — Service reaches the store via `useAppStore()` → store is injected**
```ts
// ❌ before — src/settings/services/wipe.ts
export async function wipePersona() {
  const personaStore = useAppStore().persona;  // hidden dependency, needs live Pinia
  await personaStore.clearPersona();
}
```
```ts
// ✅ after — dependency passed in
export async function wipePersona(personaStore: PersonaStore) {
  await personaStore.clearPersona();
}
```

## Confirmed preferences & rejected alternatives
- **Chosen:** store delegates persistence to a db/repository module (db owns query + domain↔DTO
  transform); services receive stores by injection; central connection + schema with per-feature query
  modules (`<feature>/db/`); stores are leaf; **service decides → store commits**, no business logic in
  store actions; views hold no logic and never mutate a model.
- **Rejected — persistence inline in stores:** the regression being removed; it puts query + transform
  into the in-memory layer and makes it untestable without IndexedDB.
- **Rejected — handing the db the reactive object directly, or `structuredClone(toRaw(state))`:** Vue
  proxies break IndexedDB's structured clone and `toRaw` is shallow; the commit passes a deep-plain
  copy across the persistence boundary.
- **Rejected — a separate persistence service layer:** needless indirection at this size (the db module
  already is the repository).
- **Rejected — services calling `useAppStore()` internally:** hidden dependencies, couples every
  service to the global registry, hard to test.
- **Rejected — a fully-central `src/db/` god module:** re-creates a central dumping ground and fights
  the per-feature structure (same smell as `AppStore`).
- **Rejected — fully per-feature DB connections:** impossible/incorrect for IndexedDB (one database,
  one version, one upgrade callback that must declare all object stores).
- **Rejected — stores importing other stores / the `AppStore` spread facade:** produces cycles and a
  god-facade (its removal is Session 3).
- **Rejected — views owning app logic, building infrastructure, or mutating models** (the
  `InterviewPage.vue` situation).

## Open / deferred
- Exact **service shape** (composable `useX()` vs plain function module vs service object) → Session 4.
- **LLM-client factory** location and the single provider mapping → Session 4.
- **Error-handling strategy per layer** (how services/stores/views surface and present errors) →
  Sessions 4 and 7.
- Physically **deleting the `AppStore` facade** and the store-composition convention → Session 3.
- **DTO shapes** and the domain↔DTO transform naming/home → Session 1. Note: `migrateFromOldDB` is
  dropped (never shipped) and the on-disk DB format is not yet frozen.
- **Store-action naming** (`setX` vs semantic actions like `appendInterviewMessage`) → Session 6.
