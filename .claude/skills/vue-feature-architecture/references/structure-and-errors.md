# Component structure, duplication, dead code & errors

The **structural** half of component work — one job per component, the feature-vs-pattern duplication
boundary, the extraction threshold, dead/unfinished-code policy, indentation, and one error strategy
per layer.

> **Scope note.** The *visual* contract — how a screen is composed from design-system primitives
> (Chassis / Band / Cell or your stack's equivalent), which styling vocabulary (`.nc-*` / Tailwind)
> goes where — lives in a separate **design-system skill**, not here. This file covers structure and
> errors only.

## Why this exists

A screen gets implemented twice, the reusable pieces are stubs while the real logic is copy-pasted,
dead code is left live-but-broken instead of deleted, indentation drifts file to file, and a single
function reaches for four different error strategies. New work has no stated rule, so each file
re-invents its own.

## Rules (binding)

### One job → one component
1. **One job → one component.** If a screen has two implementations, promote the better one and delete
   the other in the same change — never leave both in the tree.

### Duplication & extraction
2. **Never implement one feature/behavior twice.** If the same logic has a single source of truth and
   appears in two places, extract it. The *same generic shape* reused for genuinely different purposes
   is fine and not a target for forced de-duplication. The line is: "is this one thing implemented
   twice?"
3. **Extract shared stateful behavior into a composable (`useX()`); extract shared markup into a
   component.** Don't fold one into the other — a stub component holding no logic is not extraction.
4. **Extract a component when a block** (a) owns a distinct, nameable responsibility, (b) is a small
   variation of one shape where only data/handlers change, (c) has complex markup or behavior, or
   (d) groups elements that must stay together for the feature to work. **Copy count is not the
   trigger** — responsibility and cohesion are.
5. **When a group of elements must move and live together for a feature to make sense, make that group
   its own named component** rather than wiring the pieces inline at the page level.

### Dead & unfinished code
6. **Delete dead or unreachable code immediately** — including components commented out in a template
   or importing modules they no longer use. Git is the history; keep no graveyard.
7. **No silent stubs.** Intentionally unfinished code carries a `// TODO:` stating what is missing, so
   it reads as incomplete-on-purpose rather than done.
8. **No stray debugging output** (`console.log`, …) in committed code; use the project logger for
   anything that should persist.

### Style mechanics
9. **Indentation is 4 spaces**, repo-wide, in every file type.

### Error handling per layer
10. **Services are the source of truth for failures: they log the error and throw** a typed error (for
    libraries returning a `Result`, throw on the error branch at the boundary). They never return a
    sentinel value (`"N/A"`, `null`-as-success) to signal failure.
11. **A caller (store or view/page) either propagates the exception or catches it into reactive error
    state** (a store error field or a local ref) for the UI to present. It never logs-and-swallows
    mid-flow. Surfacing and presenting an error is the view's job, not the service's.
12. **A store or view logs only errors specific to its own layer.** Errors bubbling up from below are
    already logged there — don't double-log; propagate or surface them.
13. **One function, one strategy.** Never mix throw, swallow-return, and sentinels in a single flow.

## Rationale

The feature-vs-pattern boundary matches how the work actually reasons: a copied intake behavior is one
behavior written twice (a bug factory — fix one, the other rots), whereas a provider `switch` shape
appearing in two places is the same *pattern*, not the same *feature*; forcing DRY on patterns
manufactures false abstractions, while tolerating duplicated single-source behavior invites
divergence. Extraction-by-responsibility (not copy count) means new features start correctly
decomposed instead of waiting for a third copy. Deleting dead code rather than commenting it out
removes the live-but-broken trap (code that compiles against a world nobody runs) and keeps `// TODO`
meaningful as the single signal for "known incomplete." One error strategy per layer makes failures
predictable: a service failure always logs once at the source and always surfaces as either a thrown
error or visible error state — never a silent `return` or a sentinel slipping into the UI.

## Before / After (illustrative)

### Duplication: copied behavior → one composable
```ts
// ❌ before — the same intake logic in two components, while a "FileUploader" stub owns none of it
async function processFiles(files: FileList) { /* identical body in component A and component B */ }
function onDrop(e: DragEvent) { /* identical */ }

// ✅ after — one source of truth; both components consume it
// <feature>/services/useFileIntake.ts
export function useFileIntake() {
    const attached = ref<AttachedFile[]>([]);
    async function processFiles(files: FileList) { /* the logic, once */ }
    function onDrop(e: DragEvent) { /* once */ }
    return { attached, processFiles, onDrop };
}
```

### Dead / unfinished code
```vue
<!-- ❌ before — a dead component kept alive in a comment -->
<template>
    <DataInput v-if="!started" @start="onStart" />
    <!-- <OldInstrument/> -->
</template>
```
```ts
// ✅ after — delete the dead component and the commented tag; mark a real gap with // TODO
function onImport(_e: Event) {
    logger.debug("app", "TODO: implement import");   // reads as incomplete-on-purpose
}
```

### Error handling per layer
```ts
// ❌ before — a log-only "alert", a swallowed catch, and a sentinel that reaches the UI
function alertError(m: string) { logger.error("app", m); }   // name lies: only logs
catch (e) { return; }                                         // swallowed, no surface
return { question: "N/A" };                                   // sentinel into the UI

// ✅ after — the service logs + throws; the view catches into reactive error state
// service
async function nextQuestion(/* … */): Promise<Probe> {
    const probe = coerce(await client.message(messages));
    if (!probe) { logger.error("flow", "no usable question"); throw new Error("No question returned."); }
    return probe;
}
// view
try { const probe = await nextQuestion(/* … */); }
catch (e) { flowError.value = e instanceof Error ? e.message : "Flow failed."; }
```

## Confirmed preferences (and what was rejected)

- **Chosen:** one component per job (promote + delete the loser); feature-vs-pattern duplication
  boundary; extract by responsibility/cohesion/variation/complexity; delete dead code immediately +
  `// TODO` for intentional gaps; 4-space indent; services log+throw, edge propagates or catches into
  error state, layer-local logging only, no sentinels.
- **Rejected:** keeping both implementations of a screen; rule-of-three or strict-DRY as the
  extraction trigger; delete-only (no way to flag intended gaps) or a quarantine/`_archive` graveyard;
  2-space indent; `Result`-objects-everywhere or a single mandated store catcher.

## Verify

- One component per screen; no commented-out components or dead imports; no `console.log`.
- Any behavior appearing in two files is extracted to a composable (behavior) or component (markup).
- Each flow uses one error strategy: services `throw` (and log once); views catch into reactive error
  state; no sentinels; no double-logging up the stack.
- Indentation is 4 spaces in touched files.
