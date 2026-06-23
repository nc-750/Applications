---
created_at: 20260624
---

# Settings Action Feedback — Master Plan

## Context

The Mirror Settings page (`mirror/app/src/settings/`) exposes three user-triggered actions —
**saving the LLM config**, **deleting the persona/interview data**, and **importing a persona
file** — and today each one runs silently. The user clicks and gets no honest signal of whether the
action is in flight, succeeded, or failed. The work in each layer below the view is already done and
already honest: `settingsStore.saveSettings`, `deletePersona`, and `importPersona` all run through
proper service/store seams and already surface *failures* into reactive error state (which the page
funnels into one shared ERROR banner). What is missing is a per-action **running** and **success**
signal at the view, and a tighter per-action **error** signal than the single shared banner. This
goal adds honest per-action visual feedback (running / success / error) for all three actions,
modelled on the instrument-state pattern the Test-Connection action already uses
(`linkStatus` in `SettingsPage.vue` → `ConnectionMonitorCell.vue`). It is the constellation's first
real-code dogfood run (Phase 8 of the build-half plan) and is deliberately a small, single-domain
(frontend-only) slice.

## Decisions locked

- Frontend-only. The services and stores already do the real work and already report errors honestly
  (CONVENTIONS 7.16–7.18); this goal does **not** change them. All new state is view-layer
  action-status state, seeded from the existing service/store outcomes (the one-way layer graph —
  feedback lives at the view, never reaches down to invent a new store field).
- Feedback must be literally true (ETHOS C7): "success" renders only after the action's promise
  resolves without surfacing an error; "running" renders only while the promise is in flight; "error"
  renders the real surfaced message. No optimistic or fixed-duration fake states, no fake meters
  (`nc-750-frontend-presentation` honest-reading rule).

## Phases

### Phase 1 — Action-status primitive for the Settings page
- **Goal:** Establish one honest per-action status representation (idle / running / success / error
  with its message) that the page can hold for each of the three actions, mirroring the existing
  `linkStatus` instrument-state pattern.
- **Depends on:** —
- **Parallel-safe with:** —
- **Domain:** frontend
- **Doctrine likely cited:** `nc-750-web-frontend-architecture` (one-way layer graph — view holds
  action state seeded from service/store outcomes; CONVENTIONS 7.17–7.18 one error strategy per
  layer); `nc-750-frontend-presentation` (honest instrument state, no fake meters);
  `brand/ETHOS.md` C7 (claims literally true).

### Phase 2 — Wire save / delete / import to drive their status, and render per-action feedback
- **Goal:** Make each of the three action handlers in `SettingsPage.vue` transition its status
  through running → success/error around the real async call, and render that status on the action's
  own operable Cell (`LLMConfigCell` for save; `DataManagementCell` for import and delete) as an
  honest running/success/error reading.
- **Depends on:** Phase 1
- **Parallel-safe with:** —
- **Domain:** frontend
- **Doctrine likely cited:** `nc-750-web-frontend-architecture` (handlers orchestrate, view renders
  outcomes; props-down/events-up Cell contract); `nc-750-frontend-presentation` (operable-Cell
  instrument state — a button's pending/done reading vs the monitor cavity; one loud signal);
  `brand/ETHOS.md` C7 (success shown only on a genuinely resolved action; error shows the real
  surfaced message).

## Dependency graph

```
Phase 1  →  Phase 2
```

- Strictly sequential. Phase 2 consumes the status representation Phase 1 defines.
- No phases are parallel-safe: there are only two, and the second reads the first's output.

## Deferred / out of scope

- **Changing the services or stores** (`PersonaTransfer`, `PersonaLifecycle`, `SettingsStore`,
  `PersonaStore`). They already run the actions and surface errors honestly; this goal only surfaces
  *state* at the view. Reworking their error contracts is out of scope.
- **FOLLOW-UP (surfaced in Phase 2 build-review, 2026-06-24):** `SettingsStore.persist()` sets
  `error` on failure but never clears it to `null` on a successful save (unlike `loadSettings` /
  `clearSettings`). Phase 2's `onSave` works around this with a before/after snapshot compare, which
  leaves one narrow residual: two *consecutive* saves that fail with the **exact same** error message
  render SUCCESS on the second. The honest fix — have `persist()` clear `error` on success (or expose
  a per-attempt error token) — touches the walled store and belongs to a later phase that revisits the
  store error contract. Recorded here so it is not silently lost.
- **The shared ERROR banner at the bottom of `SettingsPage.vue`.** Per-action error feedback is in
  scope; whether the global banner is then redundant and should be removed is an adjacent UX call,
  not part of adding the per-action signal. Left as-is.
- **The Test-Connection action** (`linkStatus` / `ConnectionMonitorCell`). It already has honest
  per-action feedback — it is the precedent this plan mirrors, not a target to change.
- **Other Settings actions** — Clear LLM config, Factory reset, Fetch models, Debug toggle. The goal
  names exactly three actions (save, delete, import); extending feedback to the danger-zone or
  utility actions is the most tempting "while we're in here" overreach and is explicitly walled off.
- **A new reusable Lab component** (e.g. a generic action-status badge in `@nc-750/lab-vue`). This
  slice solves three actions on one page; promoting a shared primitive into the design system is a
  speculative future, out of scope. Phase 2 uses existing Lab components (`Button` states, `Acquire`,
  `Badge`, `nc-led`/`nc-lcd`) — which exact ones is a planning detail for `nc-750-plan`.
- **Persistence / history of action outcomes.** Feedback is transient view state (like `linkStatus`);
  it is not written to IndexedDB.

## DECISION NEEDED — feedback surface for the three actions

> **RESOLVED (2026-06-23, user):** Option B-style — render the feedback through a **MonitorCell**
> showing the **last action result as label + LED status** (not a full event log). The user prefers
> reusing the MonitorCell already on the page rather than adding a new cavity, and explicitly accepts
> the "attention may not be caught vs a modal/tooltip" tradeoff for now ("let's try"). Phase 2 planning
> must resolve the resulting presentation-honesty tension (ETHOS C7 / `nc-750-frontend-presentation`):
> a cavity themed as *connection* status now also reading out *save/delete/import* results — either by
> generalizing the cavity's meaning honestly or by a dedicated data-operations MonitorCell. Left to
> `nc-750-plan` (and the challenge/ethos gate) to settle.

This is a genuine presentation fork that changes where each phase draws its boundary, so it is raised
rather than chosen silently. The Test action renders its reading in a **dedicated monitor cavity**
(`ConnectionMonitorCell`, a dark read-only `MonitorCell`). The three actions in this goal each sit on
a **light operable Cell** (`LLMConfigCell` for save; `DataManagementCell` for import + delete) whose
buttons are the trigger. There are two honest ways to show their state:

- **Option A — in-place on the operable Cell (recommended).** Each action's button/Cell shows its own
  running → success → error reading next to the control that triggered it (e.g. a pending button
  state plus an inline status line per action). Keeps the signal attached to the action, no new
  cavity, and `DataManagementCell` already owns both import and delete. Fits "one loud signal per
  action, where the user acted."
- **Option B — a shared data-operations monitor cavity.** Add a `MonitorCell` to the data-management
  Band that reads out the running/success/error of save, delete, and import, the way
  `ConnectionMonitorCell` reads out the link test. More consistent with the existing Test precedent,
  but `nc-750-frontend-presentation` holds that a monitor is a *read-only reading* and must not
  conflate three unrelated operable actions into one cavity; it also adds a surface the goal did not
  ask for.

The choice does not change the *number* of phases (still Phase 1 then Phase 2), but it changes where
Phase 2 renders. Recommendation: **Option A** — it keeps each signal honestly bound to the action the
user took and adds no speculative surface. The orchestrator should gate this with the user before
`nc-750-plan` expands Phase 2.
