# 06 — Naming

## Scope
Decides naming across the codebase: honesty of names (no hidden behavior), boolean naming and
polarity, event-handler names, file/folder names, and the rule that a type/identifier must truthfully
describe what it is. Covers the pain points: dishonest names, inverted booleans, misnamed folders,
typos, and types missing an identifying field.

## Problem
Names in the codebase lie about behavior, polarity, or content. A reader (human or LLM) who trusts a
name is misled into wrong assumptions about side effects, truth values, or what a folder holds. Bad
names also propagate: a typo in a type field is imported everywhere and grows costlier to fix.

## Current state
- `alertError()` (`src/interview/pages/InterviewPage.vue`) never alerts — it only calls
  `logger.error`. The name promises a user-facing alert that does not exist.
- `getLLMForInterview()` (`src/interview/pages/InterviewPage.vue`) is shaped like a pure getter but
  reads a Pinia store, constructs a client, can fail, and fires error side effects.
- `isDigestionNeeded()` (`src/interview/services/index.ts`) returns `isWithinTokenLimit(...)`, i.e. it
  is `true` precisely when digestion is **not** needed — its truth value is inverted.
- `src/interview/models/` holds a context-window lookup table (`getContextWindowLimit`), not a domain
  model — the folder name misdescribes its contents.
- `carreer` (`src/persona/models/Persona.ts`) is a misspelling now imported across the app;
  `savePerson` (`src/persona/stores/index.ts`) drops the entity suffix used everywhere else.
- `PersonaSkill` (`src/persona/models/Persona.ts`) has `category/level/source` but no `name` — a
  skill that cannot say which skill it is. `personal: PersonaCareer[]` reuses the career type for a
  different concept.

## Decision
Names must be honest, consistent, and self-describing. A name states what a thing **is** or **does**
with no hidden behavior; accessor-shaped names (`get*`/`is*`/`has*`) have no observable side effects;
booleans read true exactly when their condition holds; event handlers are `onX`; source files are
PascalCase; folders and types truthfully describe what they contain or model. These rules apply to
all work — refactors, feature updates, and new code alike — because naming debt compounds through
every import.

## Rules
1. A name must describe what the thing **is** or **does**. If you cannot name a function honestly in
   one phrase, it is doing too many things — split it until each part can be named honestly.
2. Accessor-shaped names — `get*`, `is*`, `has*`, `current*`, and similar — must have **no observable
   side effects**: no I/O, no state mutation, no logging-as-feedback, no construction that can fail
   loudly. They compute and return; nothing else.
3. A name must not over- or under-promise. Do not call something `alert*`/`notify*`/`show*` if it
   only logs; do not call something `get*` if it builds, validates, persists, or can throw as part of
   its contract. Name for the strongest thing the function actually does.
4. Booleans and boolean-returning functions take an `is`/`has`/`should`/`can`/`needs` prefix.
5. A boolean's name must read **true exactly when the condition holds** (polarity match). If the body
   returns the opposite of what the name asserts, either rename the function to match the body or
   invert the body to match the name — never ship a name whose truth value is reversed.
6. Any function that handles an event — a native DOM event or a Vue component emit — is named `onX`,
   where `X` is the event (`onFileInput`, `onStartInterview`). Functions merely *called by* a handler
   (helpers, domain actions, services) keep plain verb names (`processFiles`, `extractText`).
7. When a handler must be disambiguated by which component raised the event, prefix the component name
   in camelCase: `componentOnX` (e.g. `dataInputOnContinue`). Default to plain `onX` when unambiguous.
8. Emit event names are camelCase; the parent's listener handler is the matching `onX`.
9. Source files are PascalCase — both components (`InterviewPage.vue`) and non-component TypeScript
   (`FileExtractor.ts`, `ProfileRenderer.ts`). `index.ts` is reserved as a folder's barrel/entry file
   and stays lowercase.
10. A folder's name must describe what it contains. `models/` holds domain models, `services/` holds
    services, `stores/` holds stores — never a lookup table, pricing data, or unrelated helpers under
    a name that promises something else.
11. Identifiers must be spelled correctly and use the project's established term for an entity
    (matching suffixes/casing of its siblings). Fix a misspelled or off-pattern identifier on sight —
    it is imported transitively and only gets more expensive to rename.
12. A type must model the thing it claims to. If a domain entity has an obvious identifying or
    essential attribute, the type includes it; do not reuse one entity's type to stand in for a
    different concept — give the second concept its own type.
13. When you touch code for any reason, correct a dishonest, inverted, mis-scoped, or misspelled name
    in what you touch. Naming fixes are in-scope for refactors, feature updates, and new work — a
    correct name is cheaper now than after the next import. This holds **across a feature boundary**:
    a minimal honesty-fix to a name or type you must *cross* to do the current work (a rename, a
    missing identifying field, a reused type given its own name) is in-scope even when the owning
    feature's full refactor is deferred — fix the field you cross, do not expand into the sibling's
    whole model.

## Rationale
- **Honest accessors (R1–R3):** code is read assuming `get*`/`is*` are safe to call, reorder, or skip.
  When `getLLMForInterview` secretly reads a store and logs errors, that assumption breaks and bugs
  hide in call order. Splitting query from command keeps reasoning local.
- **Boolean polarity (R4–R5):** an inverted boolean like `isDigestionNeeded` (true when digestion is
  *not* needed) is a silent logic landmine — every caller that reads it plainly is wrong. The prefix
  alone wouldn't have caught it; the truth-match rule does. The owner accepted that this is stricter
  and occasionally forces a rename or a `!` to fix polarity at the source.
- **Handlers `onX` (R6–R8):** the repo was split between `handleX` and bare verbs, and two components
  disagreed on emit/handler names. One rule (`onX` for all event receivers, verbs for everything else)
  removes the guesswork; `componentOnX` covers disambiguation without a second convention. Trade-off:
  existing `handleX` and verb-named handlers get renamed.
- **PascalCase files (R9):** one casing rule for every source file removes the "is this a component?"
  decision at file-creation time. Trade-off: existing camelCase `.ts` files get renamed.
- **Truthful folders & types (R10–R12):** a name is the first and cheapest documentation; a `models/`
  folder of pricing data or a `PersonaSkill` with no `name` quietly teaches the wrong mental model.
- **Fix-on-touch (R13):** naming debt is only ever cheap to repay before the next import; deferring it
  is how a single typo ends up referenced across the app.

## Before / After

### 1 — Honest names: dishonest logger + side-effecting getter
Before (`src/interview/pages/InterviewPage.vue`):
```ts
function alertError(message: string) {
    logger.error("app", message)            // never alerts — only logs
}

function getLLMForInterview(): LLMClient | undefined {
    const settingsStore = useAppStore().settings   // getter reads a store…
    if (!settingsStore.isLLMConfigured) {
        alertError("LLM not configured.")          // …and fires side effects…
        return undefined
    }
    const clientResult = createLLMClient({ /* … */ })  // …and constructs/fails
    if (clientResult.ok) return clientResult.value
    alertError(`Unable to create LLM Client: ${clientResult.error.message}`)
    return undefined
}
```
After (names match behavior; query split from command):
```ts
function logAppError(message: string) {           // honest: it logs
    logger.error("app", message)
}

// Builds and can fail → not a `get*`. Returns a Result; the caller logs.
function createInterviewClient(config: LLMConfig): Result<LLMClient> {
    return createLLMClient({ /* … */ })           // pure construction, no store, no logging
}
```

### 2 — Boolean polarity
Before (`src/interview/services/index.ts`):
```ts
// true when digestion is NOT needed — name is inverted
export function isDigestionNeeded(files: AttachedFile[], userInput: string, model: string) {
    /* … */
    return isWithinTokenLimit(data, contextWindowLimit)
}
```
After (pick a name whose truth value matches the body):
```ts
// Option A — keep the question, invert the body:
export function needsDigestion(files: AttachedFile[], userInput: string, model: string): boolean {
    /* … */
    return !isWithinTokenLimit(data, contextWindowLimit)
}
// Option B — keep the body, rename to what it actually reports:
export function isWithinContextWindow(/* … */): boolean {
    return isWithinTokenLimit(data, contextWindowLimit)
}
```

### 3 — Event handlers
Before (`src/interview/components/InterviewPreparation.vue` — mixed `handleX` + bare verb handler):
```ts
function handleFileInput(e: Event) { /* … */ }     // handler, "handle" prefix
function startInterview() {                         // handler, bare verb
    emit("startInterview", userTextInput.value, attachedFiles.value)
}
async function processFiles(files: FileList | File[]) { /* … */ }  // helper, called by handlers
```
After (`onX` for every event handler; helpers keep verbs):
```ts
function onFileInput(e: Event) { /* … */ }          // DOM event handler
function onStartInterview() {                        // click handler that re-emits
    emit("startInterview", userTextInput.value, attachedFiles.value)   // emit name camelCase
}
async function processFiles(files: FileList | File[]) { /* … */ }  // unchanged — not a handler
```

## Confirmed preferences & rejected alternatives
- **Chosen:** `onX` for *all* event handlers (DOM + Vue emit); `componentOnX` (camelCase) for
  disambiguation; emit event names camelCase.
  **Rejected:** the existing partial `handleX` style; bare-verb names for functions that are
  event handlers. (Verbs remain correct for non-handler helpers/actions.)
- **Chosen:** PascalCase for every source file, `.vue` and `.ts` alike; `index.ts` stays lowercase as
  the barrel.
  **Rejected:** the prior camelCase-for-`.ts` convention; kebab-case `.ts` files.
- **Chosen:** boolean prefix **and** truth-match polarity, both enforced.
  **Rejected:** prefix-only (would not catch inverted booleans like `isDigestionNeeded`).
- **Chosen:** generic rules illustrated by repo examples.
  **Rejected:** embedding a repo-specific fix-list (`carreer→career`, `savePerson→savePersona`,
  `PersonaSkill.name`) in the convention — those stay as examples under *Current state* / *Before-After*
  only, so the Final `CONVENTIONS.md` carries rules, not one-off chores.

## Open / deferred
- **Folder casing** (today lowercase camelCase feature folders like `fileManager/`, `interview/`) is
  not decided here — only folder *truthfulness* (R10) is. Defer casing to a later pass if wanted.
- **Where** split-out query/command logic lands (e.g. moving `createInterviewClient` to a service, the
  logger off the store) is owned by Sessions 2 and 4; this file decides only the *names*.
- Whether a single accessor may ever lazily cache (a pragmatic exception to R2) is left open.
