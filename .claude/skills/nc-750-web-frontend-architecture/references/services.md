# Services & app-logic placement

Where app logic and orchestration live, the shape a service takes, where a shared client/factory
lives, and how services surface failures. Builds on [layering.md](layering.md) (services receive
stores by injection; persistence goes through the store).

> **Binding source:** `mirror/app/CONVENTIONS.md §4`. This file distills those rules with rationale
> and examples; when they disagree, `CONVENTIONS.md` wins.

## Why this exists

App logic gets written directly inside views, and cross-cutting construction (building a client from
settings) gets copy-pasted into every view that needs it. Views become untestable (logic trapped in an
SFC), the same code drifts between copies, and the real `services/` folder is bypassed and nearly
empty. There is no agreed answer to "what is a service and what shape does it take," so each feature
improvises.

## Rules (binding)

1. **App logic and orchestration live in a feature's `services/`.** A view contains no business logic
   — it calls service functions and renders results.
2. **Write services as plain function modules, not classes.** A service is a module of exported
   functions, not an instantiated object holding mutable state.
3. **Structure a service as a functional core and an imperative shell.** Pure helpers (transform,
   parse, coerce, build-prompt, predicate) are plain functions that take explicit arguments and return
   data — no side effects, no store access, no refs. **One orchestrator function** is the only impure
   part: it sequences the helpers, performs I/O, and commits results.
4. **Pure helpers receive primitive/domain data as arguments.** Never import a store or reach into
   reactive state from a pure helper — pass in exactly what it needs so it stays testable in isolation.
5. **A service persists only through the store, never the db module directly.** The orchestrator calls
   store actions to commit; the store owns DB access.
6. **A view may not mutate a domain model in place.** Where a view would `state.items.push(...)`, the
   mutation belongs behind a store action the orchestrator calls.
7. **A composable (`useX()`) is allowed only as a reactive adapter:** it exposes flow state (loading,
   abort, progress) and delegates to plain service functions. It holds **no** business logic. If logic
   accumulates in a composable, move it to a plain service function.
8. **Construction shared across features lives in one factory module**, never copied into each
   consumer. (E.g. the LLM/HTTP-client factory lives in a shared layer such as `src/llm/` and is the
   only code that builds a client from app settings.)
9. **A mapping between an app enum and an external library's discriminator** (e.g.
   `AppProvider → LibraryKind`) is defined **exactly once**, in the factory that needs it. No consumer
   re-implements the switch.
10. **Services signal failure by throwing typed errors.** Never return ad-hoc sentinels (`"N/A"`,
    `null`-as-success) or silently swallow failures.
11. **A view catches errors at the call site and surfaces them through reactive state** (a store error
    field or a local ref) for display. Surfacing and presenting an error is the view's job, not the
    service's.
12. **A function named `get*`/`is*`/`build*` performs no UI side effects.** Construction reports
    failure by throwing or returning; the caller decides how to present it. (See [naming.md](naming.md).)
13. **An external `Result` shape is confined to the boundary that produces it.** Unwrap it immediately
    with an early-return or throw guard; `Result` never travels up through app layers.

## Rationale

Plain functions over a class: a class with mutable fields fights Vue reactivity (a field isn't
reactive unless it's a `ref`) and adds `this`/lifecycle overhead a single-dev codebase doesn't need;
plain functions compose freely and are trivially unit-testable. Functional core / imperative shell
gives a home to both instincts — the cohesive "service unit" is the shell; the pipeable pure functions
are the core — and most flow code is already pure, so the split is natural. One factory, one mapping
removes a live drift hazard (two copies must be edited in lockstep). Throwing narrows cleanly in
TypeScript across scopes where a library `Result` narrows fragilely, so app code throws and the
external `Result` is unwrapped at its boundary. The trade-off — every view that calls a service wraps
the call in try/catch and routes the message to reactive state — buys clean narrowing and a single
error-presentation site.

## Before / After (illustrative)

### Orchestration moves out of the view; pure core vs. shell
```ts
// ❌ before — flow + pure helpers + direct model mutation, all mixed in the SFC
async function startFlow(input: string) {
    const client = buildClientInTheView();
    state.items.push(systemValue);                  // view mutates the model
    const reading = await analyze(/* … */);
}

// ✅ after — <feature>/services/Flow.ts
export function coerce(raw: unknown): Probe | null { /* pure, explicit args */ }
export function isComplete(reading: Reading): boolean { /* pure predicate */ }

export async function startFlow(store: FooStore, client: Client, input: string): Promise<Probe> {
    const msg = toMessage(input);                   // pure transform
    const reading = await analyze(client, msg);      // I/O in the shell
    if (isComplete(reading)) { /* … */ }
    await store.appendMessage(msg);                  // commit through the store
}
// the view (or a thin useX() adapter) calls startFlow(...), owns the loading ref, catches errors.
```

### The client factory and the enum mapping exist once
```ts
// ❌ before — the same switch copy-pasted in two views
let kind: LibKind = "compatible";
switch (Number(config.provider)) { case AppProvider.A: kind = "a"; break; /* … */ }
const r = createLibClient({ kind, /* … */ });

// ✅ after — src/llm/createClientFromConfig.ts: one factory, the mapping once, throws on failure
const KIND: Record<AppProvider, LibKind> = {
    [AppProvider.A]: "a", [AppProvider.B]: "b", [AppProvider.Compatible]: "compatible",
};
export function createClientFromConfig(config: Config): Client {
    const r = createLibClient({ kind: KIND[config.provider], /* … */ });
    if (!r.ok) throw new Error(`Unable to create client: ${r.error.message}`);
    return r.value;   // Result unwrapped at the boundary; never propagated upward
}
```

## Confirmed preferences (and what was rejected)

- **Chosen:** plain function modules; functional-core / imperative-shell; a thin composable only as a
  reactive adapter; the shared client factory + enum mapping in one shared layer; services throw typed
  errors, views catch into reactive state, `Result` confined to its boundary.
- **Rejected:** service objects/classes (fight reactivity, add `this`/lifecycle); composable as the
  default home for logic (it's an adapter, not a brain); the factory inside one feature (it's consumed
  across features → shared layer); propagating `Result` upward (fragile narrowing); error sentinels or
  silent swallow.

## Verify

- No `createLibClient`/client construction outside the shared factory; the enum→kind switch exists
  once.
- Pure helpers take explicit args and import no store/refs; only the orchestrator does I/O and commits.
- The orchestrator persists via store actions, not the db module.
- No service returns a sentinel; failures `throw`; the view try/catches into reactive error state.
