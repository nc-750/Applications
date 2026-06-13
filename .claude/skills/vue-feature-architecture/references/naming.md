# Naming

Honesty of names (no hidden behavior), boolean naming and polarity, event-handler names, file/folder
names, and the rule that a type/identifier must truthfully describe what it is.

## Why this exists

Names lie about behavior, polarity, or content, and a reader (human or LLM) who trusts a name is
misled about side effects, truth values, or what a folder holds. Bad names also propagate: a typo in a
type field gets imported everywhere and grows costlier to fix with each import.

## Rules (binding)

1. **A name describes what the thing is or does.** If a function cannot be named honestly in one
   phrase, it is doing too many things — split it until each part can be.
2. **Accessor-shaped names — `get*`, `is*`, `has*`, `current*`, and similar — have no observable side
   effects:** no I/O, no state mutation, no logging-as-feedback, no construction that can fail loudly.
   They compute and return; nothing else.
3. **A name must not over- or under-promise.** Nothing is `alert*`/`notify*`/`show*` if it only logs;
   nothing is `get*` if it builds, validates, persists, or throws as part of its contract. Name for
   the strongest thing the function actually does.
4. **Booleans and boolean-returning functions take an `is`/`has`/`should`/`can`/`needs` prefix.**
5. **A boolean's name reads true exactly when the condition holds.** If the body returns the opposite
   of the name, rename the function or invert the body — never ship a reversed truth value.
6. **Every event handler — native DOM event or Vue emit — is named `onX`**, where `X` is the event
   (`onFileInput`, `onStartFlow`). Functions merely *called by* a handler keep plain verb names
   (`processFiles`, `extractText`).
7. **When a handler must be disambiguated by which component raised the event, prefix the component
   name in camelCase:** `componentOnX` (e.g. `dataInputOnContinue`). Default to plain `onX` when
   unambiguous.
8. **Emit event names are camelCase; the parent's listener handler is the matching `onX`.**
9. **Source files are PascalCase** — components (`FooPage.vue`) and non-component TypeScript
   (`FileExtractor.ts`, `Mappers.ts`) alike. `index.ts` is reserved as a folder's barrel/entry file
   and stays lowercase.
10. **A folder's name describes what it contains:** `models/` holds domain models, `services/` holds
    services, `stores/` holds stores — never a lookup table or unrelated helpers under a name that
    promises something else.
11. **Identifiers are spelled correctly and use the project's established term**, matching the
    suffixes and casing of their siblings. Fix a misspelled or off-pattern identifier on sight — it is
    imported transitively and only gets more expensive to rename.
12. **A type models the thing it claims to.** If a domain entity has an obvious identifying or
    essential attribute, the type includes it; never reuse one entity's type to stand in for a
    different concept — give the second concept its own type.
13. **Fix on touch.** When touching code for any reason, correct any dishonest, inverted, mis-scoped,
    or misspelled name in what you touch. Naming fixes are in-scope for refactors, features, and new
    work.

## Rationale

Code is read assuming `get*`/`is*` are safe to call, reorder, or skip; a `get*` that secretly reads a
store and logs errors breaks that assumption and hides bugs in call order. An inverted boolean (true
when the thing is *not* needed) is a silent logic landmine — the prefix alone won't catch it, the
truth-match rule does. One handler rule (`onX` for all event receivers, verbs for everything else)
removes the `handleX`-vs-verb guesswork; `componentOnX` covers disambiguation without a second
convention. One file-casing rule removes the "is this a component?" decision at file-creation time. A
name is the first and cheapest documentation; a `models/` folder of pricing data or a `Skill` with no
`name` quietly teaches the wrong mental model. Naming debt is only ever cheap to repay before the next
import.

## Before / After (illustrative)

### Honest names: dishonest logger + side-effecting getter
```ts
// ❌ before
function alertError(m: string) { logger.error("app", m); }          // never alerts — only logs
function getClient(): Client | undefined {                           // shaped like a getter…
    const s = useStore();                                            // …reads a store…
    if (!s.ready) { alertError("not configured"); return undefined; } // …fires side effects…
    /* constructs + can fail */
}

// ✅ after — names match behavior; query split from command
function logAppError(m: string) { logger.error("app", m); }          // honest: it logs
function createClient(config: Config): Result<Client> {              // builds + can fail → not get*
    return createLibClient({ /* … */ });                              // pure construction; caller logs
}
```

### Boolean polarity
```ts
// ❌ before — true when digestion is NOT needed (inverted)
export function isDigestionNeeded(/* … */) { return isWithinLimit(data, limit); }

// ✅ after — pick a name whose truth value matches the body
export function needsDigestion(/* … */): boolean { return !isWithinLimit(data, limit); }   // invert body
// — or —
export function isWithinContextWindow(/* … */): boolean { return isWithinLimit(data, limit); } // rename
```

### Event handlers
```ts
// ❌ before — mixed handleX + bare-verb handler
function handleFileInput(e: Event) { /* … */ }
function startFlow() { emit("startFlow", value); }   // a handler with a bare-verb name

// ✅ after — onX for every event receiver; helpers keep verbs; emit name camelCase
function onFileInput(e: Event) { /* … */ }
function onStartFlow() { emit("startFlow", value); }
async function processFiles(/* … */) { /* unchanged — not a handler */ }
```

## Confirmed preferences (and what was rejected)

- **Chosen:** `onX` for all event handlers (DOM + emit); `componentOnX` for disambiguation; emit names
  camelCase; PascalCase for every source file (`index.ts` lowercase barrel); boolean prefix **and**
  truth-match polarity.
- **Rejected:** the partial `handleX` style; bare-verb names for event handlers; camelCase/kebab `.ts`
  files; prefix-only booleans (won't catch inversions); baking a project-specific fix-list into the
  rules (those stay as examples only).

## Verify

- No `get*`/`is*`/`has*` with I/O, mutation, or logging; no `alert*`/`show*` that only logs.
- Every boolean reads true when its condition holds (check the body matches the name).
- Every event handler is `onX`; emits are camelCase; non-handlers keep verbs.
- Source files PascalCase except `index.ts`; folders contain what their name promises.
