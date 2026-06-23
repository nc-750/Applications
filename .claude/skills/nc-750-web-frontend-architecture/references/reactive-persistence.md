# Reactive store state & persistence

How a store holds **one reactive domain aggregate**, exposes it as a flat surface, replaces it
wholesale, and hands it to the db module safely. Builds on [stores.md](stores.md) (a store is a leaf
that holds state + thin commit actions) and [data-models.md](data-models.md) (the model shapes this
state). Read this whenever a store's source of truth is a single domain object that is also persisted.

> **Binding source:** `mirror/app/CONVENTIONS.md §3` (the store reactive-shape rules). This file
> distills those rules with rationale and examples; when they disagree, `CONVENTIONS.md` wins.

## Why this exists

Two failure modes recur when a store wraps one domain object. First, people reach for either a single
deeply-nested `record` the whole UI couples to (`store.record.foo`) **or** a sprawl of N hand-synced
`ref`s plus `snapshot()/hydrate()` plumbing that must list every field three times — both are
avoidable. Second, the moment that object is `reactive` and gets written to IndexedDB, a Vue proxy
reaches the structured-clone boundary and throws `DataCloneError` at runtime — a trap that type-checks
clean and only shows up when the code runs.

## Rules (binding)

1. **One domain aggregate per store → one `reactive` + `toRefs`.** When the store's truth is a single
   domain object, hold it as `const state = reactive<Feature>(createEmptyFeature())` and expose a flat
   surface by destructuring `const { fieldA, fieldB, … } = toRefs(state)`. The `toRefs` refs are
   writable **views bound to `state`'s properties**: `fieldA.value = x` writes through to
   `state.fieldA`, and a mutation of `state` updates the ref. This satisfies the flat-surface rule
   (stores.md rule 4) while keeping a single object to persist and replace.
2. **Choose this only when the truth *is* one aggregate.** If a store legitimately owns several
   independent objects, use separate `ref`s — do **not** force them into one `reactive` proxy. The
   rule is "one aggregate → one `reactive`+`toRefs`", never a blanket mandate.
3. **Never rebind the reactive target.** `state = next` orphans every `toRefs` ref (they still point at
   the old object). A whole-record swap — load-from-db, reset, commit-a-complete-object — must mutate
   in place: `Object.assign(state, next)`. Keep that as the single replacement helper; per-field
   actions write through their own ref and need no copy bridge.
4. **A reactive-backed model must be total.** `toRefs` only mints a ref for keys **present at seed
   time**, and `Object.assign(state, empty)` only overwrites keys the source **carries** — so an
   absent optional silently yields no ref and survives a "reset". The model's `createEmpty<X>()` sets
   every field (optionals included), and optionals are typed `field: T | undefined`, not `field?: T`.
   (See data-models.md rule 3.)
5. **Persist a deep-plain copy, never the reactive object.** `reactive()` is deep, and spreading a
   reactive array (`[...list.value]`) reintroduces proxy *elements*; the db's structured clone throws
   on any Vue proxy. `toRaw()` is **shallow** — it does not strip nested proxies. At the persist
   boundary hand the db module a deep-plain copy. For a JSON-safe record (strings, numbers, booleans,
   arrays of those — no `Date`/`Map`/`Set`) `JSON.parse(JSON.stringify(state))` is the reliable
   one-liner; document why at the call site.
6. **The `shallowRef` alternative is valid but is a different trade.** Holding collection fields as
   `shallowRef` and *always reassigning* them avoids deep reactivity (so no clone step is needed), at
   the cost of the single-`reactive`-aggregate ergonomics and the always-reassign discipline. Pick one
   approach per store deliberately; don't mix deep `reactive` with hand-rolled shallow snapshots.

## Rationale

`reactive` + `toRefs` is the smallest thing that gives both a flat consumer surface (`store.fieldA`,
not `store.record.fieldA`) and a single object to save/replace — it removes the `snapshot()/hydrate()`
field-listing without reintroducing a god-`record`. The no-rebind rule is not a style choice: the
binding between the refs and the object is what makes the flat surface live, and reassigning the
target severs it. Totality is forced by the same binding — a partial seed produces a partial surface.
The clone rule exists because reactivity and structured-clone are two systems that meet only at the
persistence edge, and `toRaw`'s shallowness makes the naive fix (`structuredClone(toRaw(state))`)
look right while still throwing on nested proxies; a deep-plain copy is the honest boundary
conversion.

## Before / After (illustrative — genericize to your code)

### N hand-synced refs + snapshot/hydrate → one reactive aggregate
```ts
// ❌ before — every field listed in the refs, in snapshot(), and in hydrate()
const status = ref(seed.status);
const items  = shallowRef(seed.items);
/* …8 more… */
function snapshot(): Feature { return { status: status.value, items: items.value, /* …8 more… */ }; }
function hydrate(f: Feature) { status.value = f.status; items.value = f.items; /* …8 more… */ }

// ✅ after — one source of truth; the flat surface is a view onto it
const state = reactive<Feature>(createEmptyFeature());
const { status, items, /* … */ } = toRefs(state);
function replaceState(next: Feature) { Object.assign(state, next); }   // the only bulk-swap
```

### Persisting — the structured-clone trap
```ts
// ❌ before — DataCloneError at runtime: toRaw is shallow, nested proxies remain
await db.saveFeature(structuredClone(toRaw(state)));

// ✅ after — a deep-plain copy crosses the boundary (record is JSON-safe; see comment)
await db.saveFeature(JSON.parse(JSON.stringify(state)) as Feature);
```

### Actions — write through the ref; bulk-swap for whole records
```ts
async function setStatus(next: Status)   { status.value = next; await persist(); }     // per-field
async function appendItem(item: Item)    { items.value = [...items.value, item]; await persist(); }
async function loadFeature()             { const f = await db.readFeature(); if (f) replaceState(f); }
async function clearFeature()            { replaceState(createEmptyFeature()); await db.deleteFeature(); }
```

## Confirmed preferences (and what was rejected)

- **Chosen:** one reactive aggregate + `toRefs` for a single-object store; `Object.assign` as the sole
  whole-record replacement (never rebind the proxy); total model + total `createEmpty<X>()`; a
  deep-plain copy at the persist boundary; per-store choice between deep `reactive` and `shallowRef`.
- **Rejected:** a single nested `record` object the UI couples through; N hand-synced refs with
  `snapshot()/hydrate()` field-listing; rebinding the `reactive` target; `structuredClone(toRaw(…))`
  as the persist copy (shallow — still throws); forcing several independent objects into one
  `reactive` proxy.

## Verify

- A single-object store holds one `reactive` + `toRefs`; no `store.record.x` indirection and no
  per-field `snapshot()/hydrate()` pair.
- No assignment rebinds the reactive target (`state = …`); every whole-record swap is
  `Object.assign(state, …)`.
- The model backing it is total: `createEmpty<X>()` sets every field; optionals typed `T | undefined`.
- The persist path hands the db a deep-plain copy — grep for `structuredClone(toRaw(` (a shallow-clone
  smell) and for the reactive object being passed straight to a db write.
