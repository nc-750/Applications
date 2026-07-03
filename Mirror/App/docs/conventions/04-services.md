# 04 — Services & app-logic placement

## Scope
Decides where app logic and orchestration live, the shape a service takes, where the single
LLM-client factory lives, and how services surface failures to views. Covers the pain points:
interview orchestration living in the view, duplicated LLM-client construction, and the copy-pasted
`LLMProvider → ProviderKind` switch.

## Problem
App logic is written directly inside views, and a piece of cross-cutting construction (building an
LLM client from settings) is copy-pasted into every view that needs it. The result: views are
untestable (logic is trapped in an SFC), the same code drifts between copies, and the real
`services/` folder is bypassed and nearly empty. There is no agreed answer to "what is a service, and
what shape does it take," so each feature improvises.

## Current state
- `src/interview/pages/InterviewPage.vue` — holds the **entire** interview flow in the SFC:
  `startInterview`, `getLLMForInterview`, `runPersonaMetricsAnalysis`, `runFirstAnalysis`,
  `runAnalysisForNextQuestion`, `coerceProbe`, `isPersonaAnalysisFinished`,
  `transformInputDataForLLMInput`, `updateDiscussion`. It also mutates `persona.interview.messages`
  directly (`InterviewPage.vue:196`, `:236`).
- `src/interview/services/index.ts` — the actual service module, but it only contains
  `isDigestionNeeded`/`digestData`; the orchestration that belongs here lives in the view instead.
- `src/interview/pages/InterviewPage.vue:64` (`getLLMForInterview`) and
  `src/settings/pages/SettingsPage.vue:59` (`testConnectionHandler`) **both** build an `LLMClient`
  via `createLLMClient` plus the **same** `LLMProvider → ProviderKind` switch — copy-pasted verbatim.
- `@nc-750/llm-ts` returns a `Result` shape (`.ok` / `.value` / `.error`); both call sites
  re-implement the same unwrap-and-report dance around it.
- `src/interview/services/useInterview.ts` — a fully-commented prior orchestrator kept only as a
  shape reference (functional, not a class).

## Decision
App logic and orchestration live in a feature's `services/`, never in a view. A service is written
as **plain function modules** organized as a **functional core / imperative shell**: pure helpers are
plain exported functions that take explicit arguments and return data (no store, no refs, no `this`);
a single orchestrator function sequences them and commits results **through the store** (never the DB
directly — see [02-layering-and-data-flow]). A view calls service functions and renders the result.
When a view needs reactive flow state (an in-flight flag, an abort handle), the feature MAY add a
thin `useX()` composable that wires service functions to refs and holds **no** business logic.

The single place that turns settings into a usable LLM client is a factory in the shared `src/llm/`
layer; it owns the `LLMProvider → ProviderKind` mapping, which exists exactly once. Every consumer
(interview orchestration, the settings test-connection button) imports that factory.

Services signal failure by **throwing typed errors**. The orchestrator and pure helpers throw; the
**view catches at the call site** and routes the message to **reactive state** (a store field or a
local ref) for display. The `Result` shape is confined to external boundaries that already speak it
(`@nc-750/llm-ts`) and is unwrapped immediately at that boundary with an early-return/throw guard, so
`Result` never propagates up through app layers.

## Rules
1. App logic and orchestration live in a feature's `services/`. A view contains no business logic —
   it calls service functions and renders results.
2. Write services as plain function modules, not classes. A service is a module of exported
   functions, not an instantiated object holding mutable state.
3. Structure a service as a functional core and an imperative shell. Pure helpers (transform, parse,
   coerce, build-prompt, predicate) are plain functions that take explicit arguments and return data,
   with no side effects, no store access, and no refs. One orchestrator function is the only impure
   part: it sequences the helpers, performs I/O, and commits results.
4. Pure helpers receive primitive/domain data as arguments. Do not import a store or reach into
   reactive state from a pure helper — pass in exactly what it needs so it stays testable in
   isolation.
5. A service persists only through the store, never the DB layer directly (consistent with
   [02-layering-and-data-flow]). The orchestrator calls store actions to commit; the store owns DB
   access.
6. A view may not mutate a domain model in place. Where `InterviewPage.vue` does
   `persona.interview.messages.push(...)`, the mutation belongs behind a store action the orchestrator
   calls.
7. A composable (`useX()`) is allowed only as a reactive adapter: it exposes flow state (loading,
   abort, progress) and delegates to plain service functions. It must contain no business logic. If a
   composable starts holding logic, that logic moves to a plain service function.
8. Construction that is shared across features lives in one factory module, not copied into each
   consumer. The LLM-client factory lives in the shared `src/llm/` layer and is the only code that
   calls `createLLMClient` from app settings.
9. A mapping between an app enum and an external library's discriminator (e.g. `LLMProvider →
   ProviderKind`) is defined exactly once, in the factory that needs it. No consumer re-implements the
   switch.
10. Services signal failure by throwing typed errors. Do not return ad-hoc error sentinels (e.g.
    `{ question: "N/A" }`) or silently swallow failures.
11. A view catches errors at the call site and surfaces them through reactive state (a store error
    field or a local ref) for display. Surfacing an error and presenting it is the view's job, not the
    service's. A **leaf store** may itself catch a failure from its own db calls into its error field
    (e.g. a load/save/clear); when it does, it surfaces-not-logs, does not rethrow, and clears the
    error only on an explicit lifecycle success — see `07-components-and-style` rule 17.
12. A function named `get*`/`is*`/`build*` performs no UI side effects. `getLLMForInterview` calling
    `alertError` is the anti-pattern: construction reports failure by throwing or returning, and the
    caller decides how to present it. (Cross-references [06-naming].)
13. The `Result` shape is confined to the external boundary that produces it. Unwrap it immediately at
    that boundary with an early-return or throw guard; never let `Result` travel up through app layers.

## Rationale
- **Plain functions over a class**: a class with mutable fields fights Vue reactivity (a field isn't
  reactive unless it's a `ref`) and adds `this`/lifecycle overhead a single-dev codebase doesn't need.
  Plain functions compose freely (the owner's FP preference) and are trivially unit-testable.
- **Functional core / imperative shell**: it gives a clean home to *both* instincts — the cohesive
  "service unit" from backend work is the shell; the pipe-able pure functions are the core. The bulk
  of the interview code is already pure (`coerceProbe`, `isPersonaAnalysisFinished`, the transforms),
  so the split is natural, not imposed.
- **One factory, one mapping**: the duplicated provider switch is a live drift hazard — two copies
  must be edited in lockstep. Centralizing removes that class of bug for every future provider change.
- **Throw over Result for app layers**: TypeScript narrows throws cleanly across scopes; the
  `llm-ts` `Result` narrows fragilely (`if (!r.ok) {…}` doesn't narrow `r.value` afterward unless the
  branch exits). Throwing avoids that ergonomic tax in app code while leaving the external boundary's
  `Result` intact.
- **Trade-off accepted**: throwing means every view that calls a service must wrap calls in
  try/catch and route the message to reactive state — slightly more boilerplate at the view than a
  returned error, accepted in exchange for clean narrowing and a single error-presentation site.

## Before / After

### 1 — Orchestration moves out of the view; pure core vs. shell
Before (`src/interview/pages/InterviewPage.vue`):
```ts
// In the SFC: flow + pure helpers + direct model mutation, all mixed
async function startInterview(userInput: string, files?: AttachedFile[]) {
    const llm = getLLMForInterview();
    if (!llm) return;
    const persona = personaStore.persona;
    const userMessage = transformInputDataForLLMInput(userInput, files);
    let metrics = await runPersonaMetricsAnalysis(/* … */);
    // …
}
function coerceProbe(raw: unknown): ProbeResult | null { /* pure, but lives in the view */ }
async function runFirstAnalysis(/* … */) {
    persona.interview.messages.push(systemPrompt);   // view mutates the model directly
    // …
}
```

After (`src/interview/services/interview.ts` — functional core + imperative shell):
```ts
// Functional core: pure, explicit args, returns data, no store/refs.
export function coerceProbe(raw: unknown): ProbeResult | null { /* … */ }
export function isPersonaAnalysisFinished(metrics: PersonaMetrics): boolean { /* … */ }
export function transformInputForLLM(userInput: string, files?: AttachedFile[]): Message { /* … */ }

// Imperative shell: the only impure function. Sequences the core, commits via the store.
export async function startInterview(
    store: ReturnType<typeof useInterviewStore>,
    llm: LLMClient,
    userInput: string,
    files?: AttachedFile[],
): Promise<ProbeResult> {
    const userMessage = transformInputForLLM(userInput, files);
    const metrics = await runPersonaMetricsAnalysis(/* … */, llm);
    if (isPersonaAnalysisFinished(metrics.coverage)) { /* … */ }
    await store.appendMessage(userMessage);   // commit through the store, not persona.…push()
    // …
}
```
The view (or a thin `useInterview()` adapter) calls `startInterview(...)`, owns the `isAnalyzing`
ref, and catches errors to show them.

### 2 — The LLM-client factory and provider mapping exist once
Before — the same switch in two files:
```ts
// src/interview/pages/InterviewPage.vue:64  AND  src/settings/pages/SettingsPage.vue:59
let provider: ProviderKind = "openai-compatible";
switch (Number(llmConfig.provider)) {
    case LLMProvider.OpenAI:          provider = "openai"; break;
    case LLMProvider.Anthropic:       provider = "anthropic"; break;
    case LLMProvider.CompatibleOpenAI: provider = "openai-compatible"; break;
}
const clientResult = createLLMClient({ provider, model: llmConfig.model, keyProvider, baseUrl: llmConfig.endpoint });
```

After (`src/llm/createClientFromConfig.ts` — the single factory, owns the mapping, throws on failure):
```ts
const PROVIDER_KIND: Record<LLMProvider, ProviderKind> = {
    [LLMProvider.OpenAI]: "openai",
    [LLMProvider.Anthropic]: "anthropic",
    [LLMProvider.CompatibleOpenAI]: "openai-compatible",
};

export function createClientFromConfig(config: LLMConfig): LLMClient {
    const result = createLLMClient({
        provider: PROVIDER_KIND[config.provider],
        model: config.model,
        keyProvider: async () => config.apiKey,
        baseUrl: config.endpoint || undefined,
    });
    if (!result.ok) throw new Error(`Unable to create LLM client: ${result.error.message}`);
    return result.value;   // Result unwrapped at the boundary; never propagated upward
}
```
Both the interview orchestrator and `SettingsPage`'s test-connection handler import
`createClientFromConfig`.

## Confirmed preferences & rejected alternatives
- **Chosen — service shape**: plain function modules, functional-core / imperative-shell; a thin
  composable allowed only as a reactive adapter that holds no logic.
- **Rejected — service object/class**: fights Vue reactivity, adds `this`/lifecycle overhead, and
  makes FP composition harder; not worth it for a single-dev codebase.
- **Rejected — composable as the default home for logic**: a composable is a reactive *adapter*, not
  the place business logic lives; logic stays in plain functions so it's testable without mounting.
- **Chosen — LLM factory location**: a new shared `src/llm/` layer owns the factory and the
  `LLMProvider → ProviderKind` mapping.
- **Rejected — factory in `settings/services/` or `settings/models/`**: the factory is consumed
  across features (interview + settings), so it belongs in a shared layer, not inside one feature.
- **Chosen — error surfacing**: services throw typed errors; views catch at the call site and surface
  via reactive store/ref state; `Result` confined to external boundaries and unwrapped immediately.
- **Rejected — propagating `Result` through app layers**: its narrowing is fragile across scopes in
  the current `llm-ts` implementation; throwing narrows cleanly.
- **Rejected — error sentinels / silent swallow** (e.g. returning `{ question: "N/A" }`, or
  `catch (e) { return; }`): hides failures and corrupts downstream data.

## Open / deferred
- Making `@nc-750/llm-ts`'s `Result` a proper discriminated union (so narrowing survives an
  early-return guard) is worth doing later, but is **out of scope** here (no app/library code changes
  in this plan).
- The exact per-layer error-presentation mechanics (which store field, toast vs inline, how the view
  renders a caught error) are finalized in [07-components-and-style] (its error-handling rule), which
  builds on this file's "throw + catch-at-view + reactive state" decision.
- Whether the orchestrator receives the store as an argument (maximally testable) or imports the
  Pinia singleton (idiomatic) is left to [02-layering-and-data-flow] / [03-store-architecture]; this
  file only requires that persistence go through the store, not the DB.
