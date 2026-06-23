# Layering & data flow

What each layer (view / service / store / db) may do, which layer may depend on which, and who
mutates vs. persists state. Pairs with [data-models.md](data-models.md) (the shapes that cross these
boundaries).

> **Binding source:** `mirror/app/CONVENTIONS.md §2`. This file distills those rules with rationale
> and examples; when they disagree, `CONVENTIONS.md` wins.

## Why this exists

Without an enforced layer contract, app logic and infrastructure construction end up in views; views
mutate the reactive domain model directly; persistence logic creeps back into stores; and nothing
pins the dependency direction. The result is code that can only be exercised through the UI, state and
storage that drift apart, and modules that import each other in circles.

## Rules (binding)

1. **One dependency direction: `view → service → store → db`.** A layer depends only on layers below
   it. The only added edges are `view → store` (read-only reactive binding) and `view → service`.
   **Nothing depends upward.**
2. **The db module is the sole owner of persistence.** Only db-module code opens the connection, runs
   queries, and applies the domain↔DTO transform at the persistence boundary. No store, service, or
   view issues a query or constructs/handles a DTO.
3. **A store holds reactive in-memory state and thin commit actions only.** A store action does at
   most two things: assign the reactive state, and persist via the db module. No business logic, no
   orchestration, no inline queries.
4. **Stores are leaf.** A store imports only its own models and its db module — never a service, never
   another store. Anything spanning two stores is a service that receives both.
5. **Services own app logic and orchestration** — decisions, multi-step flows, external calls (LLM,
   HTTP). Behavior the user triggers lives in a service, not a view or a store.
6. **Services receive stores by injection.** A service takes the store(s) it needs as arguments; it
   must not call `use<X>Store()` internally. Explicit dependency; testable without a live Pinia.
7. **The service decides; the store commits.** The service computes the next value and calls a named
   store action. It never assigns the store's reactive ref or mutates the store's reactive object from
   outside.
8. **No business logic in a store action.** If producing the next value needs a rule or decision, the
   service produces it and hands the result to a thin commit action. Only ruleless transitions
   (append to a list, set a flag) may be semantic store actions.
9. **Views contain no app logic and never mutate a model.** A view binds to store state, calls
   services for behavior, and calls store actions only for trivial state. It must not push into or
   reassign a domain model, build infrastructure (e.g. an LLM/HTTP client), or run multi-step flows.
10. **Cross a layer boundary only through that layer's transform**, and never leak a lower layer's
    shape upward — a DB record `id`/DTO field must not appear in a store or view.
11. **One central module owns the IndexedDB connection + schema** (object stores, version,
    upgrade/migrations) — because IndexedDB is one database at one version. Each feature owns its own
    DTO type and read/write functions in `<feature>/db/`, importing the shared connection. No feature
    opens its own connection.

## Rationale

A store is the app's **reactive in-memory copy of state** (the live data the UI binds to) — not a
repository and not a place for logic. The frontend has *two* sources of truth: the durable copy
(IndexedDB) and the live copy the screen watches (the store). That is why "save" becomes a store
action — the live copy must live where the UI observes it — while the query + transform stay in the db
module. Keeping logic out of the store is what makes store, db, and services independently testable.
Injecting stores into services (vs. calling `use<X>Store()` inside) is plain dependency injection:
explicit, unit-testable, uncoupled from the global registry. A central connection + per-feature query
modules is the minimum that respects IndexedDB's single-versioned-database constraint without
re-creating a god module. Leaf stores keep the graph a DAG and remove the conditions that breed a
store→service→store cycle or a god-facade.

## Before / After (illustrative)

### View owns logic + mutates the model → service decides, store commits
```ts
// ❌ before — the VIEW builds infra, orchestrates, and mutates the reactive model
const llm = buildClientInTheView();
state.items.push(next);                 // view mutates the reactive model directly

// ✅ after
// service (decides) — receives the store, owns the flow:
async function runStep(store: FooStore, client: Client) {
    const next = appendItem(store.foo, item);   // pure model transform
    await store.setFoo(next);                     // hand the decided value to a commit action
}
// store action (commits) — no logic:
async function setFoo(next: Foo) {
    foo.value = next;          // update the live copy the UI binds to
    await db.saveFoo(next);     // persist via the db module
}
// view — calls the service, binds to state, mutates nothing.
```

### Persistence inline in a store → store delegates to the db module
```ts
// ❌ before — query/transform stub living inside the store
async function saveSettings(c: Config) { config.value = c; /* transform + write inline */ }

// ✅ after — store commits + delegates; db owns the query and the transform
import * as db from "../db";
async function saveSettings(c: Config) { config.value = c; await db.saveSettings(c); }
```

### Service reaching the store via a global → store is injected
```ts
// ❌ before
export async function wipeFoo() { const s = useAppStore().foo; await s.clearFoo(); }
// ✅ after — dependency passed in
export async function wipeFoo(fooStore: FooStore) { await fooStore.clearFoo(); }
```

## Confirmed preferences (and what was rejected)

- **Chosen:** store delegates persistence to a db module (db owns query + domain↔DTO transform);
  services receive stores by injection; central connection + per-feature `<feature>/db/` query
  modules; leaf stores; **service decides → store commits**; views hold no logic and never mutate a
  model.
- **Rejected:** persistence inline in stores (untestable without IndexedDB); a separate persistence
  service layer (needless indirection — the db module already is the repository); services calling
  the global store registry internally; a fully-central `src/db/` god module (a dumping ground that
  fights per-feature structure); fully per-feature DB *connections* (impossible — one DB, one version,
  one upgrade callback); stores importing other stores / a spread facade (cycles + god-object); views
  owning logic, building infra, or mutating models.

## Verify

- Grep the diff for upward edges: a store importing a service or another store; a view importing the
  db layer or constructing a client; a DTO/`id` field surfacing in a store or view.
- Every persisted write goes view→service→store→db; no `getDB()`/query call outside `<feature>/db/`.
- Each store action is ≤ "assign + persist"; decisions live in a service.
