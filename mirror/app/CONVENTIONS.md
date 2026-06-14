# Mirror (NODE-0M) — Coding Conventions

Consolidated from the seven decision files in `docs/conventions/` (the verbose, example-heavy
records of each decision, including rejected alternatives). This document is the binding summary.

## How to read this document

These conventions guide **all** work on this codebase — new features, refactors, extensions, and
code review alike. Read them as follows:

- **The numbered rules are binding.** Everything else (rationale, examples) is support material.
- **Code snippets and file paths are illustrations, not instructions.** They were captured from the
  codebase at the time each convention was decided, to show what a rule looks like when applied.
  The cited files may have changed or been removed since. Apply the *rule* to the code in front of
  you — never copy an example's names, paths, or structure verbatim into unrelated code, and never
  treat an example as a task to perform.
- **"After" snippets describe target shapes, not completed work.** Do not assume a module shown in
  an example (`mappers.ts`, `src/lib/`, `src/core/`, a composable, a factory) already exists —
  check the actual codebase first, and create it only when the work at hand calls for it.
- When a rule and an example seem to disagree, the rule wins. When two rules seem to disagree,
  consult the source decision file in `docs/conventions/` — its "Confirmed preferences & rejected
  alternatives" section records what the owner actually chose.

## Principles

1. **Each layer owns its own data model.** Data crosses a layer boundary only through a transform
   function — never by passing one layer's shape into another.
2. **One dependency direction:** `view → service → store → db`. Views additionally bind to store
   state read-only. Nothing depends upward.
3. **Service decides, store commits, db persists, view renders.** App logic lives in services;
   stores hold the live reactive copy of state; the db module owns persistence; views display.
4. **Names, folders, and types tell the truth.** Dead code is deleted, not parked; unfinished code
   is marked `// TODO`, never left as a silent stub.

---

## 1. Data models & transforms

*Source: `docs/conventions/01-data-models-and-transforms.md`*

1.1. Each feature owns exactly one canonical **domain model** under `<feature>/models/` — plain
     data and enums, no persistence id or key, no behavior, no DB or wire (LLM/HTTP) shape.
     — Keeps "which model is the real one" answerable; persistence and presentation stay out of the
     domain.

1.2. `<feature>/models/` contains **only** domain types and their factory helpers. Non-model data —
     lookup or reference tables, pricing data, prompt text, configuration — lives in a service or
     reference module, even though it is "data".
     — A `models/` folder that holds a lookup table teaches the wrong mental model (see also 6.10).

1.3. A domain model may export factory helpers that construct it (e.g. `createEmpty<X>()`),
     co-located in the model file. When the model backs a **reactive store** (held as `reactive` +
     `toRefs`, replaced via `Object.assign` — see 3.4), the model must be **total**: `createEmpty<X>()`
     sets *every* field including optionals (`field: undefined`), optionals are typed `field: T |
     undefined` (not `field?: T`), and a required-but-defaulted field is filled by a factory (e.g. a
     message factory defaulting `isError: boolean` to `false`) rather than by each call site.
     — Construction knowledge belongs next to the shape it constructs; a partial model silently breaks
     `toRefs` (no ref minted for an absent key) and `Object.assign` resets (a stale value survives).

1.4. Every persisted entity has a **DTO owned by the DB layer**. The DTO is the only shape the
     database reads or writes; persistence keys/ids live on the DTO, never on the domain model.
     — A DB schema change stays contained to the DB layer.

1.5. Data crosses a layer boundary **only through a transform function**.
     — The transform is the single place a boundary crossing can be found and changed.

1.6. Transforms live in a per-feature `<feature>/mappers.ts`, named `to<Target>` / `from<Source>`
     (e.g. `toXxxDTO`/`fromXxxDTO` at the DB boundary, `toXxxView` for a view).
     — One obvious home and one naming scheme for every mapping.

1.7. Add a **view model** only where a view genuinely reshapes or narrows the domain model
     (filtering fields, regrouping, flattening for display). Declare it under `<feature>/models/`
     and build it with a transform — never reshape the domain model inline in the view/template.
     — Reshaping logic in a template is untestable and invisible.

1.8. Default to **two layers** (domain ↔ DTO). Do not introduce a view model when the view can
     consume the domain model as-is.
     — Boilerplate must earn its keep in a solo-maintained codebase.

1.9. Validate with **Zod only at untrusted boundaries** — data entering from outside the app (LLM
     output, imported files, external APIs). Define the boundary schema once, `safeParse` the
     input, then transform the validated result into the domain model. Do **not** Zod-validate
     internal calls or trusted reads such as our own database.
     — Runtime validation goes where TypeScript offers no protection, and nowhere else.

1.10. Derive each boundary type from its Zod schema via `z.infer` so schema and type cannot drift.
      Domain models remain hand-written interfaces, never Zod-derived.
      — The schema pays for itself by producing the type; the domain stays dependency-free.

1.11. A model's name, and the name and type of each field, must honestly and completely describe
      what it holds. A field typed as a different concept's model, a missing identifying field, or
      a misspelled name is a model defect to correct (see §6).
      — A model is read as documentation; a lying shape misleads every importer.

---

## 2. Layering & data flow

*Source: `docs/conventions/02-layering-and-data-flow.md`*

2.1. **One dependency direction: view → service → store → db.** A layer depends only on layers
     below it. The only added edges are view → store (read-only reactive binding) and
     view → service. Nothing depends upward.
     — A one-directional graph has no cycles and every module is testable from below.

2.2. **The db module is the sole owner of persistence.** Only db-module code opens the connection,
     runs queries, and applies the domain↔DTO transform. No store, service, or view issues a query
     or constructs/handles a DTO.
     — Persistence logic in the in-memory layer is untestable without IndexedDB and drifts.

2.3. **A store holds reactive in-memory state and thin commit actions only.** A store action does
     at most two things: assign the reactive state, and persist via the db module. No business
     logic, no orchestration, no inline queries. Only ruleless state transitions (append to a
     list, set a flag) may be semantic store actions. **Reactive state is not structured-clone-safe**:
     a deep `reactive` object (and any value spread out of one) carries Vue proxies that IndexedDB's
     structured clone rejects, and `toRaw()` only strips the top level — so the persist path hands the
     db module a **deep-plain copy** (for a JSON-safe record, `JSON.parse(JSON.stringify(state))`).
     — The store is the live copy the UI binds to, not a repository and not a brain; the durable copy
     must cross the persistence boundary as plain data.

2.4. **Services own app logic and orchestration** — decisions, multi-step flows, external calls
     such as the LLM. Behavior the user triggers lives in a service, not a view or a store.
     — Logic trapped in an SFC can only be exercised through the UI.

2.5. **Services receive stores by injection.** A service takes the store(s) it needs as arguments;
     it must not call `use<X>Store()` internally.
     — Explicit dependencies; testable without a live Pinia instance.

2.6. **The service decides; the store commits.** The service computes the next value and calls a
     named store action. It never assigns the store's reactive ref or mutates the store's reactive
     object from outside.
     — One writer per piece of state keeps state and storage from drifting apart.

2.7. **Views contain no app logic, build no infrastructure, and never mutate a model.** A view
     binds to store state, calls services for behavior, and calls store actions only for trivial
     state.
     — Views render; everything else has a testable home.

2.8. **One central module owns the IndexedDB connection + schema** (object stores, version,
     upgrade/migrations). Each feature owns its own DTO type and read/write functions in
     `<feature>/db/`, importing the shared connection. No feature opens its own connection.
     — IndexedDB is one database at one version; the queries still file by feature, not into a
     central dumping ground.

2.9. Never leak a lower layer's shape upward — a DB record id or DTO field must not appear in a
     store or view (see 1.4–1.5).
     — Otherwise a schema change ripples through unrelated code.

---

## 3. Stores

*Source: `docs/conventions/03-store-architecture.md`*

3.1. **No store aggregates or re-exposes another store.** A store never spreads
     (`{ ...otherStore }`), nests, or re-exports another store's state or actions.
     — An aggregator couples every consumer to the whole store graph and hides the real stores.

3.2. **Every store is a real `defineStore` setup store.** Define state with `ref`/`computed`
     inside the setup, return them, and rely on Pinia for the single shared instance. Never
     hand-roll a factory that returns fresh refs and call it a store.
     — Without `defineStore`, each caller silently gets an unshared copy of "shared" state.

3.3. **Consumers import the specific store they need** (`useSettingsStore()`,
     `usePersonaStore()`, …) — there is no aggregator to reach state through.
     — Reachability follows need; a change to one store doesn't ripple through a god object.

3.4. **A store returns a flat surface.** `ref`s, `computed`s, and actions at the top level of the
     setup return — no nesting, no grouping objects, no spreads. Name `ref`s for the state they
     hold and `computed`s for the derived value. "No grouping objects" forbids ad-hoc return
     groupings (`{ foo: { … } }`), **not** a single domain aggregate: when the store's truth is one
     object, hold it as `reactive<Feature>(createEmpty…())` and expose a flat surface via
     `toRefs(state)` — those refs are live views onto the object. **Never rebind the reactive target**
     (`state = next` orphans the `toRefs` refs); a whole-record swap (load/reset/save-complete) mutates
     in place with `Object.assign(state, next)`.
     — Flat surfaces keep destructuring, typing, and reactivity predictable; the `toRefs` binding is
     what makes the flat surface live, so reassigning the target severs it.

3.5. **Stores are leaf.** A store imports only its own models and its db module — never a service,
     never another store.
     — Leaf stores keep the dependency graph a DAG and each store testable in isolation.

3.6. **Cross-store work goes in an injected service.** A function that needs two stores is a
     service that receives both as arguments (2.5) — never one store importing another, never an
     aggregator.
     — This is what removes the conditions that produce a god-facade.

3.7. **A minimal app-level store is allowed only for genuinely global, feature-less state** (e.g.
     an app-wide UI flag). It holds state only, follows rules 3.1–3.6, and never imports, holds,
     or re-exports a feature store. If no such state exists, no app store exists.
     — "Things shared between features" belong in an injected service, not an app store.

---

## 4. Services

*Source: `docs/conventions/04-services.md`*

4.1. App logic and orchestration live in `<feature>/services/`. A view contains no business
     logic — it calls service functions and renders results (restates 2.4/2.7 for this layer).
     — One findable home per feature's behavior.

4.2. Write services as **plain function modules**, not classes. A service is a module of exported
     functions, not an instantiated object holding mutable state.
     — Class fields fight Vue reactivity and add `this`/lifecycle overhead for no gain.

4.3. Structure a service as a **functional core and an imperative shell**. Pure helpers
     (transform, parse, coerce, build-prompt, predicate) are plain functions that take explicit
     arguments and return data — no side effects, no store access, no refs. One orchestrator
     function is the only impure part: it sequences the helpers, performs I/O, and commits results.
     — The bulk of any flow is pure and unit-testable; impurity is confined to one function.

4.4. Pure helpers receive primitive/domain data as arguments. Never import a store or reach into
     reactive state from a pure helper.
     — Pass in exactly what it needs so it stays testable in isolation.

4.5. A service persists **only through the store, never the db module directly**. The orchestrator
     calls store actions to commit; the store owns DB access (2.2–2.3).
     — Otherwise the live copy and the durable copy drift.

4.6. A composable (`useX()`) is allowed **only as a reactive adapter**: it exposes flow state
     (loading, abort, progress) and delegates to plain service functions. It holds no business
     logic; if logic accumulates in a composable, move it to a plain service function.
     — Logic in composables is only testable by mounting.

4.7. Construction shared across features lives in **one factory module**, never copied into each
     consumer. The LLM-client factory lives in the shared `src/llm/` layer and is the only code
     that builds an LLM client from app settings.
     — Two copies of the same construction must be edited in lockstep — a standing drift hazard.

4.8. A mapping between an app enum and an external library's discriminator is defined **exactly
     once**, in the factory that needs it. No consumer re-implements the switch.
     — Same drift hazard as 4.7, in miniature.

4.9. Services signal failure by **throwing typed errors** — never ad-hoc sentinel values, never
     silent swallowing. The full per-layer error strategy is §7 (rules 7.16–7.19).
     — Sentinels corrupt downstream data; swallowed errors hide failures.

4.10. An external `Result` shape (e.g. from `@nc-750/llm-ts`) is confined to the boundary that
      produces it: unwrap it immediately with an early-return or throw guard. `Result` never
      travels up through app layers.
      — Throwing narrows cleanly in TypeScript; the library `Result` does not.

---

## 5. Utilities & cross-cutting dependencies

*Source: `docs/conventions/05-utilities-and-cross-cutting.md`*

5.1. Foundational / cross-cutting modules (logging, generic helpers) **never import from higher
     layers** — no Pinia stores, no services, no views. Dependencies point downward only.
     — Foundational code must work at boot (e.g. inside `window` error handlers) and in isolation.

5.2. A utility is **pure or receives its dependencies as arguments**; it never reaches up to fetch
     global state to do its job.
     — Hidden global reads make a "utility" untestable and order-dependent.

5.3. Foundational state that a UI merely toggles or displays (a debug flag, a log ring buffer)
     lives **in the foundational module as module-level reactive state**, exposed via explicit
     functions plus a readonly reactive snapshot — not promoted into a Pinia store.
     — A store would re-introduce the upward dependency for a boolean and a list.

5.4. Generic, feature-agnostic helpers live in `src/lib/`, split into **concern-named files**
     (`dom.ts`, `platform.ts`, `file.ts`, …). No catch-all `utils.ts`.
     — A junk-drawer file trends back toward "utils under whatever feature touched it first".

5.5. A helper belongs in `lib/` when its signature names no feature concept and at least one
     feature outside its origin could use it; it is feature-local when it embeds that feature's
     domain types or logic. Decide by dependencies and reuse surface, not by which feature first
     needed it.
     — Origin is an accident; the signature is the truth.

5.6. A feature never imports a generic helper **laterally** from another feature; it imports it
     from `lib/`.
     — Lateral imports silently couple features that have nothing to do with each other.

5.7. Cross-feature lifecycle / bootstrap operations (factory reset, boot wiring, app-wide
     teardown) live in `src/core/`, not inside a feature. `app/` is reserved for the Vue
     application root.
     — A lifecycle op inside one feature makes that feature depend on every other.

5.8. An app-lifecycle orchestrator **composes each feature's own public operations** (e.g. each
     store's `clear*`); it never re-implements a feature's internal teardown.
     — Each feature keeps owning its internals.

5.9. Foundational layers may depend on each other (e.g. a `lib/` helper may use the logger), but
     never on stores, services, or views.
     — "Downward only" applies among the foundations too.

---

## 6. Naming

*Source: `docs/conventions/06-naming.md`*

6.1. A name describes what the thing **is** or **does**. If a function cannot be named honestly in
     one phrase, it is doing too many things — split it until each part can be.
     — The name is the first and cheapest documentation.

6.2. Accessor-shaped names — `get*`, `is*`, `has*`, `current*`, and similar — have **no observable
     side effects**: no I/O, no state mutation, no logging-as-feedback, no construction that can
     fail loudly. They compute and return; nothing else.
     — Code is read assuming accessors are safe to call, reorder, or skip.

6.3. A name must not over- or under-promise. Nothing is called `alert*`/`notify*`/`show*` if it
     only logs; nothing is called `get*` if it builds, validates, persists, or throws as part of
     its contract. Name for the strongest thing the function actually does.
     — A name that promises a user-facing effect that doesn't happen hides missing behavior.

6.4. Booleans and boolean-returning functions take an `is`/`has`/`should`/`can`/`needs` prefix.
     — The prefix marks the value as a truth claim.

6.5. A boolean's name reads **true exactly when the condition holds**. If the body returns the
     opposite of the name, rename the function or invert the body — never ship a reversed truth
     value.
     — An inverted boolean makes every plain-reading caller wrong; the prefix alone won't catch it.

6.6. Every event handler — native DOM event or Vue component emit — is named `onX`, where `X` is
     the event (`onFileInput`, `onStartInterview`). Functions merely *called by* a handler keep
     plain verb names (`processFiles`, `extractText`).
     — One rule separates "reacts to an event" from "does a thing".

6.7. When a handler must be disambiguated by which component raised the event, prefix the
     component name in camelCase: `componentOnX`. Default to plain `onX` when unambiguous.
     — Covers collisions without a second convention.

6.8. Emit event names are camelCase; the parent's listener handler is the matching `onX`.
     — Emit and handler stay greppable as a pair.

6.9. Source files are PascalCase — components (`InterviewPage.vue`) and non-component TypeScript
     (`FileExtractor.ts`) alike. `index.ts` is reserved as a folder's barrel/entry file and stays
     lowercase.
     — One casing rule removes the "is this a component?" decision at file-creation time.

6.10. A folder's name describes what it contains: `models/` holds domain models, `services/` holds
      services, `stores/` holds stores — never a lookup table or unrelated helpers under a name
      that promises something else (see 1.2).
      — A misnamed folder quietly teaches the wrong mental model.

6.11. Identifiers are spelled correctly and use the project's established term for an entity,
      matching the suffixes and casing of their siblings. Fix a misspelled or off-pattern
      identifier on sight.
      — It is imported transitively and only gets more expensive to rename.

6.12. A type models the thing it claims to. If a domain entity has an obvious identifying or
      essential attribute, the type includes it; never reuse one entity's type to stand in for a
      different concept — give the second concept its own type.
      — A skill type that cannot say which skill it is, is not a skill type.

6.13. **Fix on touch.** When touching code for any reason, correct any dishonest, inverted,
      mis-scoped, or misspelled name in what you touch. Naming fixes are in-scope for refactors,
      feature updates, and new work.
      — Naming debt is only ever cheap to repay before the next import.

---

## 7. Components, duplication & style

*Source: `docs/conventions/07-components-and-style.md` (error rules consolidated with
`04-services.md`)*

### Components & the Lab contract

7.1. **One job → one component.** If a screen has two implementations, promote the better one and
     delete the other in the same change — never leave both in the tree.
     — Two implementations of one screen is two visual languages and a bug factory.

7.2. Build UI only from the Lab hierarchy: one Chassis (`ChassisHeader` + `ChassisFooter`) →
     `Band`s → `Cell`s / `MonitorCell`s. No `Cell` outside a `Band`, no `Band` outside the Chassis.
     — The contract is deliberately opinionated so every screen reads the same.

7.3. Never restyle the structural elements (`Chassis*`, `Band`, `Cell`, `MonitorCell`) with
     Tailwind or custom CSS to change their inner layout. They own their own layout.
     — Restyled structure is how screens drift apart and theming breaks.

7.4. Inside a `Cell`, do layout on the content root with **Tailwind utilities only** (`flex`,
     `gap-*`, `justify-*`, …) — not custom CSS, not another layout approach.
     — One small, auditable layout vocabulary inside Cells.

7.5. Style inner elements with the design system's **`.nc-*` classes** (`nc-btn`, `nc-text-*`,
     `nc-heading-*`, `nc-input`, …). Reach for custom/scoped CSS or extra Tailwind visual
     utilities only when `.nc-*` genuinely cannot express it — and say why in a comment when you
     do.
     — Visuals belong to the design system so theming stays centralized.

7.6. Use `MonitorCell` (or an `nc-monitor` inside a normal `Cell`) only for live / mutating,
     read-only readouts — never for user input. A monitor does not host forms.
     — A monitor is a supporting element with a specific meaning.

7.7. Name a feature-specific component after the Lab element that is its **root**, suffixing
     `Band` / `Cell` / `MonitorCell` (e.g. `NavigationBand`). The suffix is a promise about the
     root tag — keep it true.
     — The name tells a reader where the component may legally sit.

### Duplication & extraction

7.8. **Never implement one feature/behaviour twice.** If the same logic has a single source of
     truth and appears in two places, extract it. The *same generic shape* reused for genuinely
     different purposes is fine and not a target for forced de-duplication.
     — The boundary is "is this one thing implemented twice?" — duplicated behaviour rots in one
     copy; de-duplicating coincidental patterns manufactures false abstractions.

7.9. Extract shared **stateful behaviour** into a composable (`useX()`); extract shared **markup**
     into a component. Don't fold one into the other — a stub component holding no logic is not
     extraction.
     — Behaviour and markup have different reuse mechanisms.

7.10. Extract a component when a block (a) owns a distinct, nameable responsibility, (b) is a small
      variation of one shape where only data/handlers change, (c) has complex markup or behaviour,
      or (d) groups elements that must stay together for the feature to work. **Copy count is not
      the trigger** — responsibility and cohesion are.
      — New features start correctly decomposed instead of waiting for a third copy.

7.11. When a group of Cells (or a Cell's contents) must move and live together for a feature to
      make sense, make that group its own `*Band` / `*Cell` component rather than wiring the
      pieces inline at the page level.
      — Cohesive groups deserve a named home.

### Dead & unfinished code

7.12. **Delete dead or unreachable code immediately** — including components commented out in a
      template or importing modules they no longer use. Git is the history; keep no graveyard.
      — Live-but-broken code compiles against a world nobody runs.

7.13. No silent stubs. Intentionally unfinished code carries a `// TODO:` stating what is missing,
      so it reads as incomplete-on-purpose rather than done.
      — `// TODO` stays meaningful as the single signal for "known incomplete".

7.14. No stray debugging output (`console.log`, …) in committed code; use the project logger for
      anything that should persist.
      — Debug noise hides real signals.

### Style mechanics

7.15. Indentation is **4 spaces**, repo-wide, in every file type.
      — One answer; no per-file negotiation.

### Error handling per layer (consolidates §4 rules 4.9–4.10)

7.16. **Services are the source of truth for failures: they log the error and throw** a typed
      error (for libraries returning a `Result`, throw on the error branch at the boundary —
      4.10). They never return a sentinel value (`"N/A"`, `null`-as-success) to signal failure.
      — A failure always logs once, at the source, and always surfaces.

7.17. A caller (store or view/page) either **propagates** the exception or **catches it into
      reactive error state** (a store error field or a local ref) for the UI to present. It never
      logs-and-swallows mid-flow. Surfacing and presenting an error is the view's job, not the
      service's. A **leaf store** that catches into its own error field **surfaces, it does not log**
      (it has no logger import — the originating layer already logged, see 7.18) and it **does not
      rethrow** (catch-into-state is one strategy, 7.19). It **sets** the error on failure but does not
      **clear** it on a background/auto commit's success (that would wipe an unrelated pushed error);
      only an explicit user-triggered lifecycle action (load/reset) clears the error when it succeeds.
      — Predictable failure paths: thrown error or visible error state, nothing silent.

7.18. A store or view logs only errors specific to *its own* layer. Errors bubbling up from below
      are already logged there — don't double-log; propagate or surface them.
      — One log line per failure keeps the log readable.

7.19. **One function, one strategy.** Never mix throw, swallow-return, and sentinels in a single
      flow.
      — Mixed strategies make a flow's failure behavior unguessable.

---

## Examples

Each pair below is **illustrative**: it shows a rule applied to code *as it stood when the
convention was decided*. The cited files may since have been refactored, renamed, or deleted, and
the "after" code may or may not exist yet. These are not instructions to make these exact changes —
apply the referenced rules to whatever code you are actually working on.

### Data models — honest, complete model shape (rules 1.11, 6.11, 6.12)

Before (`src/persona/models/Persona.ts` at decision time — misspelling, type reuse for a different
concept, a skill type with no name):

```ts
carreer: PersonaCareer[],
personal: PersonaCareer[],
// ...
export interface PersonaSkill {
    category: PersonaSkillCategory,
    level: PersonaSkillLevel,
    source: PersonaSkillSource
}
```

After (each concept gets its own truthful type):

```ts
career: PersonaCareer[],
personal: PersonaNonProfessional[],
// ...
export interface PersonaSkill {
    name: string,
    category: PersonaSkillCategory,
    level: PersonaSkillLevel,
    source: PersonaSkillSource,
}
```

### Layering — view owns the flow → service decides, store commits (rules 2.3–2.7)

Before (`src/interview/pages/InterviewPage.vue` at decision time — the view builds infrastructure,
orchestrates, and mutates the model):

```ts
const llm = getLLMForInterview();              // view builds infrastructure
// ...orchestrates the whole flow in the view...
persona.interview.messages.push(systemPrompt); // view mutates the reactive model directly
```

After (the shape, not a literal file: service decides → store commits → view calls):

```ts
// service — receives the store, owns the flow:
async function runFirstProbe(personaStore: PersonaStore, llm: LLMClient) {
    const next = appendInterviewMessage(personaStore.persona, systemPrompt); // pure transform
    await personaStore.savePersona(next);       // hand the decided value to a commit action
}
// store action — no logic:
async function savePersona(next: Persona) {
    persona.value = next;          // commit the live copy the UI binds to
    await db.savePersona(next);    // persist via the db module
}
// view — calls the service, binds to state, mutates nothing.
```

### Stores — spread-facade → direct `defineStore` imports (rules 3.1–3.3)

Before (`src/AppStore.ts` at decision time — every consumer coupled to one aggregator):

```ts
export const useAppStore = defineStore("app", () => {
    return {
        settings: { ...useSettingsStore() },
        persona:  { ...usePersonaStore() },
        logger:   { ...useLoggerStore() },
    };
});
// consumer:
const settingsStore = useAppStore().settings;
```

After (the facade is gone; each store is a real Pinia singleton; consumers import what they need):

```ts
import { useSettingsStore } from "../stores";
const settings = useSettingsStore();
```

### Services — duplicated construction → one factory owning the mapping (rules 4.7–4.8, 4.10)

Before (the same `LLMProvider → ProviderKind` switch + client build copy-pasted into two views at
decision time):

```ts
let provider: ProviderKind = "openai-compatible";
switch (Number(llmConfig.provider)) {
    case LLMProvider.OpenAI:           provider = "openai"; break;
    case LLMProvider.Anthropic:        provider = "anthropic"; break;
    case LLMProvider.CompatibleOpenAI: provider = "openai-compatible"; break;
}
const clientResult = createLLMClient({ provider, /* … */ });
```

After (one factory in the shared `src/llm/` layer; the mapping exists once; the external `Result`
is unwrapped at the boundary):

```ts
const PROVIDER_KIND: Record<LLMProvider, ProviderKind> = {
    [LLMProvider.OpenAI]: "openai",
    [LLMProvider.Anthropic]: "anthropic",
    [LLMProvider.CompatibleOpenAI]: "openai-compatible",
};

export function createClientFromConfig(config: LLMConfig): LLMClient {
    const result = createLLMClient({ provider: PROVIDER_KIND[config.provider], /* … */ });
    if (!result.ok) throw new Error(`Unable to create LLM client: ${result.error.message}`);
    return result.value;   // Result never propagates upward
}
```

### Utilities — logger reaching into Pinia → module-level reactive state (rules 5.1–5.3)

Before (`src/logger/services/logger.ts` at decision time — a foundational module fetching a store
per call):

```ts
function log(level, category, message, opts) {
    const store = useAppStore().logger;   // upward dependency on every log line
    if (level === "debug" && !store.debugEnabled) return;
    store.appendLog(entry);
}
```

After (the logger owns its buffer and flag; the UI reads a readonly snapshot):

```ts
const entries = ref<LogEntry[]>([]);
const debugEnabled = ref(false);

export const logEntries = readonly(entries);   // UI reads this
export function setDebugEnabled(enabled: boolean) { debugEnabled.value = enabled; }

function log(level, category, message, opts) {
    if (level === "debug" && !debugEnabled.value) return;
    entries.value = [...entries.value, entry];  // ring-buffer trimming elided
}
```

### Naming — boolean polarity (rules 6.4–6.5)

Before (`src/interview/services/index.ts` at decision time — the name asserts the opposite of the
body):

```ts
// true when digestion is NOT needed — name is inverted
export function isDigestionNeeded(files: AttachedFile[], userInput: string, model: string) {
    return isWithinTokenLimit(data, contextWindowLimit);
}
```

After (either fix is valid — make the name and the truth value agree):

```ts
// Option A — keep the question, invert the body:
export function needsDigestion(/* … */): boolean {
    return !isWithinTokenLimit(data, contextWindowLimit);
}
// Option B — keep the body, rename to what it actually reports:
export function isWithinContextWindow(/* … */): boolean {
    return isWithinTokenLimit(data, contextWindowLimit);
}
```

### Components & errors — four strategies in one flow → log at the service, surface at the edge (rules 7.16–7.19)

Before (`src/interview/pages/InterviewPage.vue` at decision time — a log-only "alert", a swallowed
catch, and a sentinel that reaches the UI as a fake question):

```ts
function alertError(message: string) { logger.error("app", message); } // name lies: only logs
// …
catch (e) { return; }              // swallowed, no surface
// …
return { context: "End of interview requested by user", question: "N/A" }; // sentinel into UI
```

After (the service logs and throws; the page catches into reactive error state):

```ts
// interview service
async function nextQuestion(/* … */): Promise<ProbeResult> {
    const probe = coerceProbe(await llm.message(messages));
    if (!probe) {
        logger.error("interview", "LLM returned no usable question");
        throw new Error("The model did not return a question.");
    }
    return probe;
}

// page
try {
    const probe = await nextQuestion(/* … */);
} catch (e) {
    interviewError.value = e instanceof Error ? e.message : "Interview failed.";
}
```

---

## Still to decide

Open items carried forward from the decision files (everything else listed as "deferred" there was
resolved by a later decision file):

- **Derived/transient fields in persisted DTOs** — whether computed data (metrics, transcript)
  belongs in a DTO at all (from 01).
- **Exact view-model field sets** (e.g. a `ProfileView`/`InsightView`) — renderer-rework detail
  (from 01).
- **Lazy-caching accessors** — whether a single accessor may ever cache as a pragmatic exception
  to rule 6.2 (from 06).
- **Folder-name casing** — only folder *truthfulness* (6.10) is decided; casing of feature folders
  is not (from 06).
- **A shared error-presentation Cell/Band** — a standard way to render reactive error state is
  component work, not yet decided (from 07).
- **Tooling enforcement** — formatter/lint rules for 4-space indentation and the Lab contract
  (from 07).
- **`@nc-750/llm-ts` `Result` as a discriminated union** — library work so narrowing survives an
  early-return guard (from 04).

Follow-up chores noted by the decision files (not open decisions): the first refactor pass that
applies these conventions to the code they cite (one intake component, the dead interview
component, the `AppStore` facade, the logger store, the known naming fixes), and a dead-code call
on currently-unused helpers per rule 7.12.
