# 07 — Components, duplication & style coherence

## Scope
Decides: one component per job; the Lab component contract (Chassis → Band → Cell/MonitorCell)
and where Tailwind vs `.nc-*` may be used; the feature-vs-pattern duplication boundary; the
component-extraction threshold; dead-code / unfinished-code policy; repo-wide indentation; and the
one-error-strategy-per-layer rule. Applies equally to refactors, feature updates, and new features.

## Problem
The interview screen is implemented twice, the reusable pieces are stubs while the real logic is
copy-pasted, dead code is left live-but-broken instead of deleted, indentation and styling are
inconsistent across files, and a single function reaches for four different error strategies. New
work has no stated rule to follow, so each file re-invents its own.

## Current state
- **One screen, two components.** The live path is
  `src/interview/pages/InterviewPage.vue` → `src/interview/components/InterviewPreparation.vue`
  (rough: inline Tailwind for everything, a commented-out icon block, a literal `X` text button,
  and `isOverBudget`/`estimatedTokens`/`chunkCount` refs wired to nothing). Its polished twin
  `src/interview/components/DataInputStep.vue` (real file-type icons, token math, scoped styles) is
  referenced **only** by the dead `InterviewInstrument.vue`.
- **Dead code left live.** `src/interview/components/InterviewInstrument.vue` still imports a full
  `useMirrorStore` / `useInterview` graph but is commented out in InterviewPage's template
  (`<!-- <InterviewInstrument/> -->`). `src/fileManager/components/FileUploader.vue` is an unmarked
  4-line button stub. `src/App.vue:26` has a stray `console.log(isSettingsPage)`.
- **Forbidden duplication.** The file-intake behaviour (`processFiles`, `handleDragOver/Leave/Drop`,
  `handleFileInput`, `removeAttachment`, `extractText` wiring) is copied almost verbatim into both
  `DataInputStep.vue` and `InterviewPreparation.vue`. `FileUploader.vue` was meant to own this but
  does nothing.
- **Four error strategies in one function.** `src/interview/pages/InterviewPage.vue` mixes
  `alertError` (which despite its name only logs — `logger.error`), bare `throw Error(...)`,
  swallow-and-`return` (`catch (e) { return; }` at :57), and sentinel returns
  (`{ context: ..., question: "N/A" }`).
- **Mixed indentation & styling.** `App.vue`, `InterviewPage.vue`, `InterviewPreparation.vue` use
  4 spaces; `DataInputStep.vue`, `InterviewInstrument.vue` use 2. `DataInputStep.vue` mixes scoped
  BEM + `--nc-*` tokens with Tailwind, while `InterviewPreparation.vue` is mostly inline Tailwind.
  `src/welcome/WelcomePage.vue` and `src/settings/pages/SettingsPage.vue` already follow the
  intended approach.

## Decision
There is exactly **one component per job**; when two exist, the better implementation is promoted
and the other is deleted. UI is built from the **Lab component contract** — a single Chassis
(`ChassisHeader`/`ChassisFooter`) containing only `Band`s, each containing only `Cell`s or
`MonitorCell`s. Those structural elements are never restyled; inside a `Cell`, layout uses **Tailwind
utilities only** and inner elements are styled with **`.nc-*` classes**, with custom CSS reserved for
when those are genuinely insufficient. Behaviour/markup that represents a single feature is never
implemented twice: shared *behaviour* becomes a composable, shared *markup* becomes a component, and
feature-specific components are suffixed `Band` / `Cell` / `MonitorCell` to match their root element.
Dead code is deleted immediately (git is the history); intentionally unfinished code is marked with
`// TODO`, never left as a silent stub or commented-out template. The repo is 4-space indented. Each
layer has one error strategy: **services throw and log; the calling edge either propagates or catches
into error state** — no sentinels, no log-and-swallow mid-flow.

## Rules

### Components & the Lab contract
1. One job → one component. If a screen has two implementations, promote the better one and delete
   the other in the same change; never leave both in the tree.
2. Build UI only from the Lab hierarchy: one Chassis (`ChassisHeader` + `ChassisFooter`) → `Band`s →
   `Cell`s / `MonitorCell`s. Do not place a `Cell` outside a `Band`, or a `Band` outside the Chassis.
3. Never restyle the structural elements (`Chassis*`, `Band`, `Cell`, `MonitorCell`) with Tailwind or
   custom CSS to change their inner layout. They own their own layout.
4. Inside a `Cell`, the content root is usually a `<div>` (but may be any element). Do layout there
   with **Tailwind utilities only** (`flex`, `gap-*`, `justify-*`, …) — not custom CSS, not another
   layout framework.
5. Style inner elements with the design system's `.nc-*` classes (`nc-btn`, `nc-text-*`,
   `nc-heading-*`, `nc-input`, …). Reach for custom/scoped CSS or extra Tailwind visual utilities only
   when `.nc-*` genuinely cannot express it — and say why in a comment when you do.
6. Use `MonitorCell` (or an `nc-monitor` inside a normal `Cell`) only for live / mutating, read-only
   readouts — not for user input. A monitor is a supporting element; it does not host forms.
7. Name a feature-specific component after the Lab element that is its **root**, suffixing
   `Band` / `Cell` / `MonitorCell` (e.g. `NavigationBand`, `ProbeCell`). The suffix is a promise about
   the root tag — keep it true.

### Duplication & extraction
8. Never implement one feature/behaviour twice. If the same logic has a single source of truth and
   appears in two places, extract it — copying it is the smell (the file-intake copy is the canonical
   example). The *same generic shape* reused for genuinely different purposes is fine and not a target
   for forced de-duplication.
9. Extract shared **stateful behaviour** into a composable (`useX()`); extract shared **markup** into a
   component. Don't fold one into the other (a stub component that holds no logic is not extraction).
10. Extract a component when a block (a) owns a distinct, nameable responsibility, (b) is a small
    variation of one shape where only data/handlers change (e.g. a button differing only by label and
    action), (c) has complex markup or behaviour, or (d) groups elements that must stay together for
    the feature to work. Copy count is not the trigger — responsibility and cohesion are.
11. When a group of Cells (or a Cell's contents) must move and live together for a feature to make
    sense, make that group its own `*Band` / `*Cell` component rather than wiring the pieces inline at
    the page level.

### Dead & unfinished code
12. Delete dead or unreachable code immediately — including components that are commented out in a
    template or that import modules they no longer use. Git is the history; do not keep a graveyard.
13. Do not ship silent stubs. Intentionally unfinished code must carry a `// TODO:` that states what is
    missing, so it reads as incomplete-on-purpose rather than done.
14. No stray debugging output (`console.log`, etc.) in committed code; use the project `logger` for
    anything that should persist.

### Style mechanics
15. Indentation is **4 spaces**, repo-wide, in every file type.

### Error handling per layer
16. Services / skills are the source of truth for failures: they **log the error and throw** (or, for
    libraries that return a `Result`, throw on the error branch). They never return a sentinel value
    (`"N/A"`, `null`-as-success) to signal failure.
17. A caller (store or view/page) either **propagates** the exception or **catches it into reactive
    error state** for the UI to present. It must not log-and-swallow mid-flow. A **leaf store** that
    catches into its own error field **surfaces, it does not log** (it has no logger import — the
    originating layer already logged, rule 18) and **does not rethrow** (catch-into-state is the one
    strategy, rule 19). It **sets** the error on failure but does **not clear** it on a background/auto
    commit's success (that would wipe an unrelated error the view/service pushed); only an explicit
    user-triggered lifecycle action (load/reset) clears the error when it succeeds.
18. A store or view logs only errors specific to *its own* layer. Errors bubbling up from a lower layer
    are already logged there — don't double-log; propagate or surface them.
19. One function uses one strategy. Do not mix throw, swallow-return, and sentinels in a single flow
    (as `InterviewPage.startInterview` / `runAnalysisForNextQuestion` currently do).

## Rationale
- The Lab contract is deliberately opinionated so every screen reads the same and theming stays in the
  design system. Letting a Cell restyle itself or a page hand-roll layout CSS is how `DataInputStep`
  and `InterviewPreparation` drifted into two visual languages for the same screen. Restricting
  intra-Cell layout to Tailwind and visuals to `.nc-*` keeps the override surface tiny and auditable.
- The feature-vs-pattern boundary matches how the owner actually reasons: the file-intake copy is one
  behaviour written twice (a bug factory — fix one, the other rots), whereas a provider `switch` shape
  appearing in two places is the same *pattern*, not the same *feature*. Forcing DRY on patterns would
  create false abstractions; tolerating duplicated single-source behaviour invites divergence. The line
  is "is this one thing implemented twice?".
- Extraction-by-responsibility (not by copy count) means new features start correctly decomposed
  instead of waiting for a third copy before someone reacts. The "must stay together" clause is why the
  Monitor + Probe + Conclude + Completion group belongs in one component, not scattered across a page.
- Deleting dead code rather than commenting it out removes the live-but-broken trap
  (`InterviewInstrument` compiles against a store graph nobody runs) and keeps `// TODO` meaningful as
  the single signal for "known incomplete".
- One error strategy per layer makes failures predictable: a service failure always logs once at the
  source and always surfaces as either a thrown error or visible error state — never a silent `return`
  or a `"N/A"` question slipping into the UI.

Trade-offs accepted: promoting one component and deleting the other discards work already done on the
loser; mandating 4-space indent reformats several 2-space files; and the "log at the service, surface
at the edge" rule means callers must thread errors up rather than handling them where convenient.

## Before / After

### Pair 1 — styling: page hand-rolls visuals → Lab contract
**Before** (`InterviewPreparation.vue`: inline Tailwind for visuals, a raw text button):
```vue
<li class="flex items-center border rounded-sm p-1">
    <span class="flex-1 truncate mr-2">{{ a.name }}</span>
    <button class="nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm" @click="removeAttachment(a.name)">
    X
    </button>
</li>
```
**After** (Cell content lays out with Tailwind; visuals come from `.nc-*` + a real icon, as
`WelcomePage`/`SettingsPage` already do):
```vue
<li class="flex items-center gap-3">
    <span class="nc-text-sm flex-1 truncate">{{ a.name }}</span>
    <button
        class="nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm"
        :aria-label="`Remove ${a.name}`"
        @click="removeAttachment(a.name)"
    >
        <X :size="14" aria-hidden="true" />
    </button>
</li>
```

### Pair 2 — duplication: copied behaviour → one composable
**Before** (the same intake logic exists in both `DataInputStep.vue` and `InterviewPreparation.vue`,
while `FileUploader.vue` is a 4-line stub that owns none of it):
```ts
// DataInputStep.vue  AND  InterviewPreparation.vue — duplicated
async function processFiles(files: FileList | File[]) {
    const list = Array.from(files).filter(isSupportedFile);
    if (!list.length) { extractError.value = "No supported files found…"; return; }
    isExtracting.value = true;
    try {
        const results = await Promise.all(list.map(async (f) => ({ name: f.name, text: await extractText(f) })));
        attached.value = [...attached.value, ...results];
    } catch (e) { extractError.value = e instanceof Error ? e.message : "Failed to read file."; }
    finally { isExtracting.value = false; }
}
function handleDrop(e: DragEvent) { /* …identical… */ }
```
**After** (one source of truth; both components consume it):
```ts
// fileManager/services/useFileIntake.ts — single owner of intake behaviour
export function useFileIntake() {
    const attached = ref<AttachedFile[]>([]);
    const isExtracting = ref(false);
    const extractError = ref("");
    async function processFiles(files: FileList | File[]) { /* the logic, once */ }
    function handleDrop(e: DragEvent) { /* once */ }
    return { attached, isExtracting, extractError, processFiles, handleDrop, /* … */ };
}

// in either component:
const { attached, isExtracting, extractError, processFiles, handleDrop } = useFileIntake();
```

### Pair 3 — dead / unfinished code
**Before** (`InterviewPage.vue` keeps the dead component alive in a comment; `FileUploader.vue` is a
silent stub):
```vue
<template>
    <InterviewPreparation v-if="!isInterviewStarted" @start-interview="startInterview" />
    <!-- <InterviewInstrument/> -->
</template>
```
**After** (delete `InterviewInstrument.vue` and the commented tag; if a stub must ship, mark it —
following the owner's existing `// TODO` pattern in `SettingsPage.handleImportPersona`):
```ts
function handleImportPersona(_e: Event) {
    logger.debug("app", "TODO: Implement import Persona from JSON");
}
```

### Pair 4 — error handling per layer
**Before** (`InterviewPage.vue`: log-only `alertError`, swallowed catch, and a `"N/A"` sentinel that
reaches the UI as a fake question):
```ts
function alertError(message: string) { logger.error("app", message); } // name lies: only logs
// …
try { /* … */ }
catch (e) { return; }              // swallowed, no surface
// …
return { context: "End of interview requested by user", question: "N/A" }; // sentinel into UI
```
**After** (service logs + throws; the page catches into error state for the Cell to render):
```ts
// interview/services/interview.ts
async function nextQuestion(/* … */): Promise<ProbeResult> {
    const probe = coerceProbe(await llm.message(messages));
    if (!probe) {
        logger.error("interview", "LLM returned no usable question");
        throw new Error("The model did not return a question.");
    }
    return probe;
}

// InterviewPage.vue
try {
    const probe = await nextQuestion(/* … */);
} catch (e) {
    interviewError.value = e instanceof Error ? e.message : "Interview failed.";
}
```

## Confirmed preferences & rejected alternatives
- **Indentation — chosen: 4 spaces** repo-wide. Rejected: 2 spaces (the Prettier/Vue default) — the
  owner's recent hand-written files use 4 and that wins.
- **Styling — chosen: the Lab contract** (structural elements unstyled; Tailwind for layout inside a
  Cell; `.nc-*` for inner visuals; custom CSS only when unavoidable; `WelcomePage`/`SettingsPage` are
  the reference). Rejected: scoped-BEM-tokens-for-everything and inline-Tailwind-for-everything — both
  are the drift that produced the two competing intake components.
- **Duplication — chosen: feature-vs-pattern.** Forbidden: one behaviour implemented twice. Healthy:
  the same generic shape reused for different purposes. Rejected: rule-of-three (tolerates a known
  duplicate) and strict-DRY (manufactures false abstractions over coincidental patterns).
- **Extraction — chosen: by responsibility / cohesion / variation / complexity**, not by copy count.
  Rejected: "extract on 2nd use" and "extract on 3rd use" as the primary trigger.
- **Dead code — chosen: delete immediately + `// TODO` for intentional gaps.** Rejected: delete-only
  (no way to flag intended gaps) and a quarantine/`_archive` convention (a graveyard git already
  provides).
- **Errors — chosen: services log+throw; edge propagates or catches into error state; layer-local
  logging only; no sentinels.** Rejected: Result-objects-everywhere and store-owned-error-state as the
  blanket rule (a store may still hold error state, but it is not the mandated single catcher). When a
  leaf store *does* catch into its own error field, it surfaces-not-logs, does not rethrow, and clears
  the error only on an explicit lifecycle success (not on a background commit's success).

## Open / deferred
- The concrete refactor (promote `DataInputStep` over `InterviewPreparation`, build `useFileIntake`,
  delete `InterviewInstrument.vue` and `FileUploader.vue`, fix `alertError`'s name) is **not** done
  here — this plan changes no app code. It is the first follow-up once `CONVENTIONS.md` lands.
- Whether a shared error-presentation Cell/Band exists (a standard way to render `*.error` state) is
  left to component work, not decided here.
- The `alertError` rename and the broader honest-naming rules are owned by Session 6 (naming); this
  file only requires that the error *strategy* be consistent.
- Linter/formatter enforcement of the 4-space and Lab-contract rules (e.g. an ESLint rule banning
  restyled structural elements) is deferred to tooling work.
```
