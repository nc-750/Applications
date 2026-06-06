# Lab Design System — Application Guide (DESIGN_USE)

How to *assemble* the Lab design system into real screens. This is the **how**;
`DESIGN.md` is the **what** (the authoritative token + component catalogue, in a
tool-consumable format) and `../brand/VISUAL_IDENTITY.md` is the **why** (the
constitution). When this guide and `VISUAL_IDENTITY.md` disagree, the constitution wins.
When this guide names a token or component, `DESIGN.md` is the source of truth for its
exact definition.

Audience: humans (verification) and LLMs (generation). Every rule below is phrased so it
can be checked against a rendered screen.

---

## 1. Anatomy of a screen

Every NC-750 screen is assembled top-down in this order. Omitting a layer is a regression.

```
FIELD              textured page background (the material the device rests on)
└─ CHASSIS         the framed device (.nc-chassis): vertical flex, ink-seam border
   ├─ HEADER       dark status bar (cavity surface), full width
   ├─ [TABS]       optional navigation row
   ├─ BANDS        rows of cells joined by 1px seams (.nc-band of .nc-cell)
   │  └─ CELLS     raised panels (chrome) OR recessed drafting plates (diagrams)
   └─ FOOTER       dark bar (cavity surface), full width
```

**Rule A1.** A screen has exactly one chassis as its outermost framed object. Content
never sits directly on the browser canvas.

**Rule A2.** The field is always textured (subtle brushed grain or low-opacity noise),
never a flat fill. The texture says "material surface"; keep it below ~5% contrast.

---

## 2. Chassis

- The chassis is `.nc-chassis`: a vertical flex column, **1.5px ink-seam border**,
  16px (`xl`) outer radius, `overflow: hidden` so seams meet the rounded edge cleanly.
- It carries a single raised edge bevel — never a drop shadow.
- **Screws (`.nc-screw`) are optional.** Use them on hardware-flavoured or hero surfaces;
  omit them in dense data screens where they would add noise. Four corners or none —
  never two.

**Rule C1.** One outer radius for the chassis; inner cells are square against the seams.
Rounded cells inside a rounded chassis read as bubbles — forbidden.

---

## 3. Header & footer

- The top status bar and the footer use the **dark monitor surface** (`.nc-monitor`),
  full-bleed across the chassis width, separated from the body by the ink seam.
- The header carries, left to right: the part-number label (`NC-750 // NODE-XX // …`),
  live status LEDs (`.nc-led`), and a right-aligned readout (clock, revision, or
  `0x00` stamp) in LCD type.
- The footer carries a part-number label and a technical mark (barcode, serial). It is
  quiet; it is a nameplate, not a navigation surface.

**Rule H1.** Header and footer are always the darkest surfaces on a light screen — they
frame the instrument like the bezel of a device. Do not lighten them to "match" content.

---

## 4. Seams — the spatial grammar

- Surfaces are separated by **1px seams**: either a real border (`--nc-line` family) or a
  1px flex gap whose background shows through as the seam colour (`.nc-band` with
  `gap: 1px` over a line-coloured background).
- Seam weights: `--nc-line` (standard), `--nc-line-subtle` (table rows, minor
  divisions), `--nc-line-strong` (control borders, dimension lines), `--nc-line-ink`
  (1.5px, module outer + section underlines).

**Rule S1 — Seams never break.** Every cell butts against its neighbour at a continuous
1px line. No gaps of bare field between cells inside a band, no rounded cell corners
interrupting a seam, no shadow standing in for a seam. A broken seam is the #1 visual
regression and the thing the previous implementation got wrong.

**Rule S2 — No shadowed seams.** Depth comes from recession and brightness, plus thin
edge bevels (`--nc-edge-raised`, `--nc-edge-inset`) that simulate light on a machined
edge. Drop/ambient shadows, glow-as-elevation, and floating cards are forbidden.

---

## 5. Cell anatomy

A cell (`.nc-cell` / `.nc-panel`) has a consistent header and a body.

```
┌─────────────────────────────────────────────┐
│ CELL TITLE                    SPEC // DETAIL  │  ← cell header
│                                               │
│  …cell body (chrome or drafting plate)…       │
└─────────────────────────────────────────────┘
```

- **Cell title** — left-aligned, mono uppercase **Label** type (`--nc-text` colour for the
  primary title). It names the cell's function (`DATA FLOW ANALYSIS`, `CONTROL`,
  `SYSTEM PROPERTIES`).
- **Spec-detail** — right-aligned on the same baseline, mono uppercase Label type in a
  muted colour (`--nc-text-muted`). It carries the technical address of the cell:
  `DOC // 0x00-DF`, `RAIL // 0x01`, `SPEC // NODE-0M`. Format is slash-delimited tokens,
  wide-tracked.

**Rule CE1.** Title left, spec-detail right, same row, same baseline. The spec-detail is
always present — even a terse `// 0x00` — because it is what makes the cell read as an
addressed component of a machine rather than a generic box.

**Rule CE2.** Titles state function, not marketing. `SYSTEM PROPERTIES`, not `Why we're
private`.

---

## 6. Surface assignment — chrome vs drafting plate

This is the operational form of constitution principle **P4 (recession holds content)**.

| Content type | Surface | Why |
|---|---|---|
| Controls, specs, tables, navigation, status | **Raised panel** (`.nc-panel`, polished/brushed) | Dense chrome sits close to the user |
| Diagrams, schematics, exploded views, readouts to study | **Recessed drafting plate** (a cell interior on `--nc-inset` with `--nc-edge-inset`) | The cut-in surface says "study this"; it may breathe |

**Rule SF1 — The cell frame is always chassis grammar; only the interior may open.** A
diagram cell still has its seam, header, and spec-detail. Inside, it drops to a recessed
drafting plate where whitespace is permitted. *The panel contains the whitespace; the
whitespace never dissolves the panel.*

**Rule SF2 — Whitespace is bounded.** Open, breathing layout is allowed **only** inside a
drafting plate. Chrome cells stay packed. A screen that is open everywhere has become a
marketing page; a screen that is dense everywhere is the old mistake.

**Rule SF3 — Live readouts use the cavity.** Anything that updates in real time (an
analyzer, a status console, an LCD value) sits on the dark cavity surface, not a light
panel. Dark = alive/measuring; light = static/operable.

---

## 7. The grid — non-uniform by design

- The chassis body is a stack of **bands**; each band is a `.nc-band` (flex row) with its own column
  template. Bands do **not** share a column count.
- A band may be `[rail | plate]`, `[spec | console]`, `[single full-width cell]`, or any
  mix. Column spans are expected, not exceptional.

**Rule G1 — The grid is not uniform.** Do not force every band to the same column count.
A narrow control rail beside a wide schematic, then a two-up spec/console, then a
full-width sampler, is the correct rhythm. Uniform grids read as dashboards.

**Rule G2 — Pair dense with open.** The strongest band places a packed chrome cell beside
an open drafting-plate cell (e.g. control rail + data-flow schematic). The contrast is the
system's signature; lean on it.

---

## 8. Responsive — Desktop / Tablet

- **Desktop (≥1024px):** full multi-band grid. Side-by-side dense+open bands. The
  instrument readout and its input sit **side by side** so the readout climbs in the
  user's periphery while they act.
- **Tablet (640–1024px):** keep the chassis and seams. Collapse 3-column bands to 2;
  collapse 2-column bands to stacked only when a cell would fall below ~320px. Drafting
  plates keep their aspect where possible; let them scroll horizontally before you let a
  schematic shrink to illegibility.

**Rule R1.** Seams, chassis, header/footer, and cell anatomy are **invariant** across
desktop and tablet. Only the column counts change. Never drop the chassis to "save space."

**Rule R2.** Below a cell's minimum legible width, stack — do not shrink type or seams.
Type and seams are fixed; layout flexes around them.

---

## 9. Responsive — Mobile

Mobile (<640px) cannot show the side-by-side readout + input at full size, so the model
changes deliberately: **simultaneous-peripheral becomes sequential-focal.**

- **Single column.** One band per row, full width.
- **The readout demotes to a sticky strip** at the top of the screen (compact confidence
  + mini waveform + micro coverage bars). The instrument is always present as a glance,
  never the hero on mobile.
- **The active surface owns the screen** (the current probe / primary cell), with a
  generous input that stays above the on-screen keyboard. Never anchor the primary action
  to the very bottom edge — the keyboard will cover it.
- **Secondary surfaces move into a bottom tab bar** (e.g. `READING / PROBE / LOG`). Demoted,
  one tap away — never deleted.
- **Acquisition becomes a full-screen takeover** — the one moment that *should* own the
  whole display on mobile.
- **The readout-climb returns as a focused beat** between turns (a "reading updated"
  screen) rather than peripheral motion.

**Rule M1.** Mobile keeps the chassis, the dark header, and the seam grammar. It is the
*same instrument*, re-tempo'd — not a separate "mobile app" aesthetic.

**Rule M2.** The instrument must never disappear. If a full readout won't fit, demote it
to the sticky strip; do not drop it for a plain form.

---

## 10. Instrument interaction — the essence, not a template

The operational form of constitution principle **P6 (instrument over app)**. This section
describes *how to think* about turning an interaction into an instrument. It is **not** a
fixed recipe to stamp onto every product. The detailed pattern set further down is **one
worked example** (Mirror's interview); other products express the same essence very
differently, and some need almost none of it.

### The essence

When an interaction is redesigned from a generic app flow (a chat, a feed, a form wizard)
into an instrument, a few things change. These transfer; the specific widgets do not.

- **Foreground the artifact, not the exchange.** The hero is the thing being produced,
  measured, or revealed — not the log of back-and-forth. Ask "what is this interaction
  *building*?" and put that at the centre; demote the turn-by-turn history.
- **Speak in instrument state — honestly.** Express system state as a reading (level,
  coverage, lock, signal, present/null) *when that is genuinely the truth of the process*.
  Never invent a reading the system isn't actually taking — no fake progress, no
  decorative meter. The instrument metaphor is a way to tell the truth more vividly, not a
  costume (ETHOS: claims literally true).
- **Match feedback to the nature of the work** (see *Latency*, below).
- **Shape the input to the intent.** Constrain input where you want focus and depth; open
  it where you want exploration. The shape of the input is a deliberate decision, not a
  default text box.

### Latency — foreground vs background

How the system shows it is working depends on whether the work blocks the user:

- **Foreground / blocking work** (the user is waiting on *this* result and cannot
  meaningfully continue): show it as **acquisition** — the signal being read (animating
  readout, `ANALYZING …`) instead of a generic spinner. This is the on-brand moment *only
  when the user is genuinely waiting on it.*
- **Background / non-blocking work** (export, sync, a long generation the user can step
  away from): do **not** take the screen. Show a quiet ambient indicator (a breathing LED,
  a header status, a small console line) and let the user keep operating the rest of the
  instrument. Notify on completion.

**Rule I1.** Never block the user with an acquisition takeover for work that could run in
the background. Acquisition theatre is for attention the user has already committed — not a
default wrapper for every async call.

### Worked example — Mirror's interview

Mirror's interview is a *sustained, single-focus, foreground inquiry of unknown length.*
For that specific shape, the essence resolves into the patterns below. Read them as an
illustration of the essence applied — **not** as requirements for other products:

- **Probe, not chat turn** — one facet-tagged observation at a time; follow-ups reuse the tag.
- **Readout, not transcript** — the accumulating reading (patterns, evidence, confidence) is the hero.
- **Saturation, not a counter** — coverage meters fill toward "sufficient signal"; conclude when saturated, because the length is genuinely unknown.
- **Acquisition, not a spinner** — the user waits on each turn, so latency shows as the signal being read.
- **Collapsing log, not a feed** — prior turns collapse into a terse, re-openable record.
- **Append-only** — entries are added to, never silently rewritten.
- **One-directional, generous input** — the instrument asks; the user supplies evidence via an explicit affordance, not a free chat box.

### Other product shapes

The same essence lands differently elsewhere — and sometimes barely registers:

- A **background export or long generation** → ambient indicator + completion notice
  (Rule I1); no probes, no takeover.
- A **dashboard or settings surface** → mostly chassis + document grammar; instrument
  behaviour may amount to nothing more than honest live status and well-shaped controls.
- A **multi-step configuration with truly finite, known steps** → keep a real step model;
  do *not* fake "saturation" where an honest "step 3 of 5" is the truth.

**Rule I2.** Apply the essence; derive the patterns from the *product's own task*. Do not
port Mirror's probe / acquisition / saturation / log set onto a product whose interaction
is not a sustained foreground inquiry.

---

## 11. Motion

Constitution principle **P9 (honest motion)**, made concrete.

- **Functional motion:** state changes and the tactile press (raised→inset bevel flip).
  Durations 90–280ms; the press uses a slight overshoot (`cubic-bezier(0.34,1.56,0.64,1)`,
  ~120ms).
- **Ambient motion:** *subtle, non-intrusive, non-distracting, even if only decorative* —
  permitted **only inside important live cells** (e.g. a slow waveform shimmer in an
  analyzer cavity, a faint LED breath). It must be slow (≥600ms cycles), low-amplitude, and
  never pull the eye from the primary task.
- **Acquisition motion:** the one moment ambient motion may become prominent — because the
  instrument is genuinely working.

**Rule MO1.** No page-load choreography, no scroll-triggered reveals, no hover bounce, no
ripple. If motion does not signal a state change or quietly indicate "this cell is live,"
it does not ship.

**Rule MO2.** Honour `prefers-reduced-motion`: collapse all transitions and stop ambient
loops. The instrument still reads correctly when perfectly still.

---

## 12. Accessibility

- Target **WCAG 2.1 AA** (mandated by `ETHOS.md` C8.3). Keyboard-navigable; visible focus
  is the orange signal rim on inputs/controls.
- The seed engine auto-adjusts foreground lightness to meet AA on critical pairs
  (`generator-app/src/generator/wcag.ts`). **Do not bypass it.**
- Saturated, low-contrast seeds (the candy-pink stress test) are for *demonstrating that
  structure survives any hue* — they are **not** a shipping default. Production themes pass
  the AA adjuster before they ship.

**Rule AX1.** A theme that fails AA is not a valid theme, regardless of how good it looks.

---

## 13. Anti-patterns (quick check)

Mirror of `VISUAL_IDENTITY.md §4`, in checklist form. If any is true, the screen is wrong:

- [ ] Content floats on the canvas with no chassis → **add a chassis.**
- [ ] A seam is a shadow, or two cells have a bare-field gap between them → **1px seam, no shadow.**
- [ ] Box-shadow used for elevation / floating cards → **bevels only.**
- [ ] Every cell is dense, or every cell is open → **pair dense chrome with open drafting plates.**
- [ ] A diagram is packed edge-to-edge on a raised panel → **move it to a recessed plate and let it breathe.**
- [ ] A cell header has no spec-detail, or a marketing title → **function title left, `// detail` right.**
- [ ] Sustained input rendered as a chat / `>_` terminal / multi-page counter form → **probe + readout + saturation.**
- [ ] A spinner where the system is actually working → **acquisition readout.**
- [ ] The accent is used as decoration, or a second decorative hue appears → **one signal, ≤10%, linework neutral.**
- [ ] Uniform N-column grid across all bands → **vary the bands.**

---

## 14. Migration note (correcting the current implementation)

The shipped implementation drifted from intent in four ways. When updating existing code,
correct these specifically:

1. **Shadowed / floating seams → flat 1px seams.** Remove box-shadow-based separation;
   restore continuous seam lines and bevel-only depth (Rules S1, S2).
2. **Dark-first presentation → light-first.** The default is the bright machined field;
   dark is the cavity and the night theme, not the marketing face.
3. **All-dense layouts → dense+open rhythm.** Introduce recessed drafting plates for
   diagrams and readouts (Section 6).
4. **Manufacturing language → ownership language.** In copy and naming, retire
   "milled from a billet / assembled in a factory" framing in favour of the user's unit
   and its seed fingerprint (constitution P7).

These four are the difference between "looks like the Lab" and "looks like a generic dark
dashboard."
