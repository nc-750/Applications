---
name: nc-750-frontend-presentation
description: >-
  Binding presentation doctrine for the NC-750 "Lab" design language: how a feature is presented as
  a precision instrument rather than a generic app. A platform-agnostic philosophy core — the
  industrial readout stance (foreground the artifact, speak in honest instrument state, no fake
  meters), the Chassis → Band → Cell mental model, seams-not-shadows, recession-holds-content, one
  loud signal, and the rule that a monitor / cavity readout is a live read-only reading and NEVER
  hosts input — plus per-target implementation modules (web authored now; flutter / swiftui stubbed).
  Accepts a target argument (web | flutter | swiftui). Use this skill WHENEVER composing, building,
  styling, or reviewing how a screen or component LOOKS and READS in this design system: laying a
  screen out as Chassis/Bands/Cells, deciding whether something is a Cell vs a MonitorCell vs a
  drafting plate, choosing a design-system class (`.nc-*`) vs a Tailwind utility vs custom CSS,
  deciding what surface a diagram/readout/control belongs on, naming a component after its Lab root
  (Band/Cell/MonitorCell suffix), judging whether a meter/progress/coverage reading is honest, making
  a view "look like the instrument" / "match the Lab" / stop looking like a SaaS dashboard or chat or
  terminal, or reviewing a view for visual-contract conformance. Trigger even when the user never
  says "design system", "Lab", or "instrument": any "how should this screen look / be laid out",
  "which class do I use here", "where does this diagram/readout go", "is this the right component",
  or "this view looks like a generic app" situation on an NC-750 surface. Do NOT trigger for the
  code-structure axis (layering view→service→store→db, stores, services, mappers, data models,
  error-handling strategy, function/file/boolean naming, dead-code/duplication policy) — that is the
  nc-750-web-frontend-architecture skill; nor for seed/token color math, theme generation, WCAG contrast
  computation, brand copywriting, registering/importing the Lab plugin or stylesheet (tooling setup),
  responsive-CSS breakpoint debugging, or generic Vue/CSS syntax questions.
---

# Instrument design system (NC-750 "Lab")

A binding **presentation** doctrine: how a feature is presented as a **precision laboratory
instrument, documented like a technical manual** — not as a generic app, dashboard, chat, or
terminal. It answers one question precisely: **given a screen or piece of UI, how must it look, what
surface does it sit on, and which design-system element owns it?**

> **This skill is the visual / presentation axis.** Its companion, **`nc-750-web-frontend-architecture`**, owns
> the *code-structure* axis — layering (`view → service → store → db`), stores, services, mappers,
> data models, error strategy, naming, and the dead-code / duplication / one-job-per-component
> doctrine. When a question is about *where logic lives or how code is shaped*, that is the other
> skill. This skill covers only *how the result is presented*. Reference it; do not restate it.

> **Stack-generic core, per-target contract.** The philosophy below is platform-agnostic — the same
> instrument stance governs a web app, a Flutter app, or a SwiftUI app. The *concrete vocabulary*
> (class names, component APIs, which utility does layout) lives in a per-target module. Apply the
> *principles* to whatever you are building; read the target module for the literal contract.

## Target dispatch — read this first

This skill accepts a **target** argument: `web` | `flutter` | `swiftui`.

1. **Resolve the target.** Use the argument if given. Otherwise infer from the project: a Vue / web
   front-end (a `package.json` with `vue`, a `@nc-750/lab-vue` import, or `.nc-*` classes in the
   tree) → **web**. A Flutter (`pubspec.yaml`, Dart) project → **flutter**. A SwiftUI (`*.swift`,
   Xcode) project → **swiftui**. If you cannot tell, ask the user which target before proceeding.
2. **Read the matching module** for the binding implementation contract:
   - **web** → [references/web.md](references/web.md) — **authored.** The Lab contract (CONVENTIONS
     §7.2–7.7), the `.nc-*` class vocabulary, the `@nc-750/lab-vue` component surface, and the
     Tailwind-in-Cell rule.
   - **flutter** → [references/flutter.md](references/flutter.md) — **stub, not yet authored.**
   - **swiftui** → [references/swiftui.md](references/swiftui.md) — **stub, not yet authored.**
3. **If the target module is a stub**, say so plainly: the philosophy core below still applies, but
   there is no concrete component/class contract for that platform yet — do not invent one or port
   the web vocabulary onto it. Report "the `<target>` target is not yet authored" and either work
   from the platform-agnostic principles alone or stop, per the user's intent.

The rest of this file is the platform-agnostic core. It always applies, on every target.

## The one line

**Software presented as a precision laboratory instrument, documented like a technical manual.** The
descriptor is *machine-documentation instrument panels*: interfaces feel like the front panel of a
precision instrument, annotated like a service manual, that you **operate** rather than browse.

## The three grammars

Every NC-750 surface is built from three grammars at different scales. They do not compete — each
owns a different job.

- **Chassis — the container.** The framed device that sits on a textured field: a dark header/footer,
  panels joined by seams. *Always present, never broken.* It is what makes a screen read as one
  assembled instrument instead of a web document.
- **Document — the content.** What is printed on and around the chassis: schematics, spec rows,
  dimension lines, part numbers, the `0x00` null mark. Its job is to **communicate reality and prove
  claims** the way a calibration sheet does — never to decorate. Where a marketing site writes
  "Private by design," the Lab *draws the data-flow and stamps the server `0x00`*.
- **Instrument — the behaviour.** How the interface acts when operated: it presents **measurements,
  not conversations; saturation, not counters; acquisition, not spinners.** This is the most
  distinctive layer and the easiest to lose — guard it.

## The instrument stance (the essence)

When an interaction is redesigned from a generic app flow (a chat, a feed, a form wizard) into an
instrument, four things change. These transfer across every product and platform; the specific
widgets do not.

1. **Foreground the artifact, not the exchange.** The hero is the thing being *produced, measured, or
   revealed* — not the log of back-and-forth. Ask "what is this interaction *building*?", put that at
   the centre, and demote the turn-by-turn history.
2. **Speak in instrument state — honestly.** Express system state as a *reading* (level, coverage,
   lock, signal, present/null) **only when that is genuinely the truth of the process.** Never invent
   a reading the system isn't actually taking. The instrument metaphor is a way to tell the truth
   more vividly, not a costume.
3. **Match feedback to the nature of the work.** *Foreground / blocking* work (the user is waiting on
   this result) shows as **acquisition** — the signal being read (`ANALYZING …`, an animating
   readout), not a generic spinner. *Background / non-blocking* work (export, sync, a long generation
   the user can step away from) shows as a **quiet ambient indicator** and notifies on completion —
   it never seizes the screen.
4. **Shape the input to the intent.** Constrain input where you want focus and depth; open it where
   you want exploration. The shape of the input is a deliberate decision, not a default text box.

> **Derive the patterns from the product's own task.** The essence above is universal; the concrete
> patterns are not. A sustained foreground inquiry (e.g. an interview) resolves into probe / readout
> / saturation / collapsing-log. A background export resolves into an ambient indicator and nothing
> else. A settings surface may need almost no instrument behaviour beyond honest live status. Do not
> port one product's pattern set onto a product whose interaction has a different shape.

## The mental model: Chassis → Band → Cell

Every screen is assembled top-down in this order. Omitting a layer is a regression.

```
FIELD            textured page background — the material the device rests on (never a flat fill)
└─ CHASSIS       the one framed device: dark header + footer, ink-seam border, the outer radius
   ├─ HEADER     darkest surface — a status bar / nameplate (part number, status, a readout)
   ├─ [TABS]     optional navigation row
   ├─ BANDS      rows of cells joined by 1px seams; bands do NOT share a column count
   │  └─ CELLS   raised panels (dense chrome) OR recessed drafting plates (diagrams/readouts)
   └─ FOOTER     darkest surface — a quiet nameplate, not a navigation surface
```

- A **Cell** carries a consistent header: a function title on the left, a right-aligned mono
  **spec-detail** (`DOC // 0x00-DF`) on the same baseline. The spec-detail is always present — it is
  what makes a cell read as an *addressed component of a machine* rather than a generic box. Titles
  state **function**, not marketing (`SYSTEM PROPERTIES`, not `Why we're private`).
- A **MonitorCell / cavity** is a dark recessed surface for **live, read-only readouts** (an
  analyzer, a status console, an LCD value). **Dark = alive / measuring; light = static / operable.**

## The platform-agnostic invariants

These hold on every target. The per-target module says *how* to express each one.

- **Seams, not shadows.** Surfaces separate by crisp **1px seams** (a border or a 1px gap showing a
  seam-coloured background) and tonal shifts — never by drop shadows, ambient shadows, floating
  cards, or glow-as-elevation. Depth is *recession + brightness* (brighter sits closer), plus thin
  **edge bevels** that simulate light catching a machined edge. A broken seam — a bare-field gap
  between cells, a shadow standing in for a line, a rounded cell corner interrupting a seam — is the
  #1 visual regression.
- **Recession holds the content.** Dense chrome (controls, specs, tables, navigation, status) lives
  on **raised panels**. Diagrams, schematics, and readouts-to-study live on a **recessed drafting
  plate** — a flatter, cut-in surface with an inset bevel that says "study this." *Whitespace is
  permitted inside a drafting plate and nowhere else* — the panel contains the whitespace; the
  whitespace never dissolves the panel. **Pair dense with open**: a packed chrome cell beside an open
  plate is the system's signature rhythm. A screen that is open everywhere is a marketing page; a
  screen that is dense everywhere is the old mistake.
- **The grid is non-uniform by design.** A narrow control rail beside a wide schematic, then a
  two-up spec/console, then a full-width sampler, is the correct rhythm. A uniform N-column grid
  across all bands reads as a dashboard — vary the bands.
- **One loud signal, held in reserve.** The accent colour is a **signal**, not a palette: it marks
  the primary action, the current selection, focus, the live/active state, and the `0x00`/null mark —
  **nothing else.** It appears on **≤10% of any screen**; its loudness is functional, like a warning
  label. Diagram linework stays **neutral**; the signal is never spent on decoration and never
  replaced by a second decorative hue (no blueprint-cyan stealing the signal). Identity is
  **structural, not chromatic** — the system stays unmistakably NC-750 in any hue.
- **The honest-reading rule (no fake meters).** A meter, coverage bar, confidence, lock, or progress
  reading **must reflect a value the system genuinely computes.** No fake progress, no decorative
  meter. This is a brand-compliance constraint (`brand/ETHOS.md`: claims literally true; `0x00`
  certifies a real zero-state) — not a style preference. A decorative diagram is likewise forbidden:
  a schematic must depict **actual behaviour** or not exist.
- **A monitor is read-only — it never hosts input.** The dark cavity / monitor readout is a
  *supporting display* of live, mutating values. It does not host forms, text fields, or buttons. If
  the user must type or act, that belongs on an operable (light) surface, not in the readout.
- **Honest motion.** Motion is either functional (a state change, a tactile press) or quietly alive
  (a slow shimmer in a live cell). The one moment motion earns prominence is **acquisition**, when
  the instrument is genuinely working. No page-load choreography, no scroll-reveals, no hover bounce,
  no ripple. Honour `prefers-reduced-motion` — the instrument reads correctly perfectly still.

## What it must never feel like

If a screen reads as any of these, it has failed regardless of token correctness. The corrective is
always the same: return to the three grammars — frame it in a chassis, document it instead of
decorating it, make it behave like an instrument.

- a **SaaS dashboard** (hero-metric + sparkline cards, icon-above-heading grids, uniform grid);
- a **hacker terminal** (CRT, scanlines, `>_` prompt, matrix rain) — an instrument *reveals truth*; a
  terminal just accepts commands;
- a **crypto/web3 network graph** (node-and-edge topology as decoration);
- a **marketing landing page** (gradient washes, floating glass cards, stock illustration);
- a **chat client** (a bubble transcript as the main object);
- **Material / Bootstrap** (elevation shadows, ripples, floating action buttons).

## "What surface / element owns this?" — decision table

| You are presenting… | It belongs on… |
|---|---|
| The whole screen | exactly one **Chassis** on a textured field — never bare canvas |
| A row of related panels | a **Band**; spans are flex ratios, not a fixed column count |
| Controls, specs, tables, navigation, forms, status | a **Cell** (raised, light, dense chrome) |
| A diagram, schematic, or readout to study | a **recessed drafting plate** (a cell interior that may breathe) |
| A live, mutating, **read-only** value (analyzer, console, LCD) | a **MonitorCell / cavity** (dark) — never an input |
| The primary action / current selection / focus / live state / null | the **one signal** colour (≤10% of screen) |
| Inner layout *inside* a cell (rows, gaps, alignment) | the target's sanctioned **layout utilities** (see the module) |
| Visual styling of an inner element (button, label, input, badge) | the design system's **components / classes** — not ad-hoc CSS |
| A status bar / nameplate | the **dark header / footer** — the darkest surfaces on the screen |

If a piece of UI seems to fit two rows, it is probably two pieces that should be split across two
surfaces (e.g. a readout *and* its input — readout in the cavity, input on an operable cell).

## Anti-pattern checklist (run against the rendered screen)

If any is true, the screen is wrong:

- [ ] Content floats on the canvas with no chassis → **add a chassis.**
- [ ] A seam is a shadow, or two cells have a bare-field gap between them → **1px seam, no shadow.**
- [ ] Box-shadow used for elevation / floating cards → **bevels only.**
- [ ] Every cell is dense, or every cell is open → **pair dense chrome with open drafting plates.**
- [ ] A diagram is packed edge-to-edge on a raised panel → **move it to a recessed plate, let it breathe.**
- [ ] A cell header has no spec-detail, or a marketing title → **function title left, `// detail` right.**
- [ ] A readout / monitor hosts a form or button → **monitors are read-only; move input to a cell.**
- [ ] Sustained input rendered as a chat / `>_` terminal / multi-page counter → **probe + readout + saturation.**
- [ ] A spinner where the system is actually working → **acquisition readout.**
- [ ] A meter/progress/coverage value the system doesn't truly compute → **honest reading or remove it.**
- [ ] The accent is used as decoration, or a second decorative hue appears → **one signal, ≤10%, linework neutral.**
- [ ] Uniform N-column grid across all bands → **vary the bands.**

## Verification gate (every presentation change)

- The screen passes the **anti-pattern checklist** above.
- The per-target contract in the relevant module is satisfied (e.g. on **web**: only Lab components
  build the UI; structural elements are not restyled; layout inside a Cell uses only the sanctioned
  utility vocabulary; visuals use `.nc-*`; any escape to custom CSS carries a one-line *why*).
- Every instrument reading shown is one the system genuinely computes (honest-reading rule).
- This is a **presentation** review only — code-structure conformance (layering, stores, services,
  errors, naming, dead code) is verified under **`nc-750-web-frontend-architecture`**, not here.
