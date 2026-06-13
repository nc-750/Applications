# Stores (Pinia)

How Pinia stores are defined, what a store may contain and expose, whether an app-level store may
exist, and how code reaches a store. Builds on [layering.md](layering.md) (stores are leaf;
cross-store work happens in an injected service).

## Why this exists

The failure mode is a **god-store**: a single real Pinia store that calls each feature's store factory
and **spreads** them into a nested aggregator, so every consumer couples to `useAppStore().foo/.bar`
instead of the store it actually needs. Worse, the feature "stores" are often plain factory functions
that return fresh `ref`s on every call — state only *appears* shared because the aggregator happens to
be a single cached `defineStore`. Call such a factory directly and you mint an unshared copy.

## Rules (binding)

1. **No store aggregates or re-exposes another store.** A store never spreads (`{ ...otherStore }`),
   nests, or re-exports another store's state or actions. Delete any such facade.
2. **Every store is a real `defineStore` setup store.** Define state with `ref`/`computed` inside the
   setup, return them, and rely on Pinia for the single shared instance. Never hand-roll a factory
   that returns fresh refs and call it a store.
3. **Consumers import the specific store they need** (`useFooStore()`, `useBarStore()`). There is no
   aggregator to reach state through.
4. **A store returns a flat surface.** Return `ref`s, `computed`s, and actions at the top level of the
   setup return — no nesting, no grouping objects, no spreads. Name `ref`s for the state they hold and
   `computed`s for the derived value (`isReady`, not `readyComputed`).
5. **A store holds state only — no app logic.** Actions are thin commits: assign reactive state and
   persist via the db module. Decisions and orchestration live in services.
6. **Stores stay leaf.** A store imports only its own models and its db module — never another store,
   never a service.
7. **Cross-store work goes in an injected service.** A function that needs two stores is a service
   that receives both as arguments; never one store importing another, never a re-introduced
   aggregator.
8. **A minimal app-level store is allowed only for genuinely global, feature-less state** (e.g. an
   app-wide UI flag). It holds state only, follows rules 1–6, and never imports, holds, or re-exports
   a feature store. If no such state exists, no app store exists. It is not a home for "things shared
   between features" — that is what an injected service is for.

## Rationale

Real `defineStore` singletons are what actually make a store "the live copy the UI binds to": with
plain factories the shared copy only existed because one cached facade funneled everyone through it;
remove the facade and each caller silently gets an unshared ref set. Converting to `defineStore` makes
the sharing intentional and removes the reason the facade existed. Importing the specific store
follows the same anti-aggregator principle as avoiding a central db god module — reachability follows
need, so a change to one store doesn't ripple through an object every consumer imports. A minimal app
store is permitted, but only as a feature-less leaf: the failure being removed is not "an app store
exists," it is "the app store reaches into / re-exposes feature stores."

## Before / After (illustrative)

### The spread-facade → direct store imports
```ts
// ❌ before — the god-store
export const useAppStore = defineStore("app", () => {
    return { foo: { ...useFooStore() }, bar: { ...useBarStore() } };
});
const fooStore = useAppStore().foo;

// ✅ after — facade deleted; consumer imports what it needs
import { useFooStore } from "../stores";
const fooStore = useFooStore();
```

### Plain factory → real `defineStore` singleton
```ts
// ❌ before — a plain function masquerading as a store (fresh refs per call)
export function useFooStore() {
    const foo = ref<Foo>(createEmptyFoo());
    return { foo, loadFoo, saveFoo, clearFoo };
}

// ✅ after — Pinia guarantees one shared instance; actions are thin commits
export const useFooStore = defineStore("foo", () => {
    const foo = ref<Foo>(createEmptyFoo());
    async function saveFoo(next: Foo) {
        foo.value = next;          // commit the live copy
        await db.saveFoo(next);     // persist via the db module
    }
    return { foo, loadFoo, saveFoo, clearFoo };
});
```

## Confirmed preferences (and what was rejected)

- **Chosen:** delete any spread-facade; each feature store is a real `defineStore` singleton;
  consumers import the specific store; flat return surface; leaf stores; cross-store work via an
  injected service; a minimal app store allowed for genuinely global, state-only needs.
- **Rejected:** keeping a facade / any store that aggregates other stores; plain factory functions as
  "stores" (no singleton guarantee); one store importing another to satisfy a cross-store need (cycles
  + implicit aggregator); an app store that re-exposes feature stores under a thinner wrapper.

## Verify

- Grep for `defineStore`: every feature store uses it; no factory-returning-`ref`s pretends to be one.
- Grep for `{ ...use` and nested return objects — there should be none.
- Each store imports only its models + its db module (no store/service import).
- The return object is flat: only refs, computeds, and actions at top level.
