# NC-750 Visual Identity — The Lab Design System

This document is the **constitution** of the NC-750 visual language. It defines *what
the visual language is and why it looks the way it does* — the durable worldview that
every product surface must express. It does **not** list color values or component specs
(see `lab/DESIGN.md`), and it does **not** give layout recipes (see
`lab/DESIGN_USE.md`). When a concrete rule and this document disagree, this
document wins and the rule is the bug.

- **`brand/BRAND.md`** — who NC-750 is: voice, naming architecture, the `0x00` mark.
- **`brand/ETHOS.md`** — what NC-750 may and may not ship (privacy/data constraints). Untouched by visual decisions.
- **`brand/VISUAL_IDENTITY.md`** — *this file*: the visual worldview.
- **`lab/DESIGN.md`** — the token + component catalogue (the *what*).
- **`lab/DESIGN_USE.md`** — how to assemble it: layout, responsive, motion, interaction recipes (the *how*).

Audience: humans (for verification and validation) and LLMs (for guidance and
generation). Read it before generating any NC-750 interface.

---

## 1. The one line

**The Lab design system: software presented as a precision laboratory instrument,
documented like a technical manual.**

The style descriptor is **machine-documentation instrument panels**. Three influences
fuse into one language: the *chassis* of a machined enclosure, the *page* of an
engineering manual, and the *behaviour* of a measurement instrument. None of the three
alone is the system; the synthesis is.

---

## 2. The three grammars

Every NC-750 surface is built from three grammars operating at different scales. They
do not compete — each owns a different job.

### Chassis — the container
The framed device that sits on the page. A textured background field, a dark header and
footer, panels joined by seams, optional corner screws. The chassis is *always present
and never broken*; it is what makes a screen read as one assembled instrument rather
than a web document. This is the layer the old name "Enclosure" described — now only one
third of the system.

### Document — the content
What is printed on and around the chassis: schematics, spec sheets, dimension lines,
callouts, part numbers, registration marks, and the `0x00` null mark. The Document
grammar exists to *communicate reality and prove claims*, the way a service manual or a
calibration sheet does — not to sell. Where a marketing site writes "Private by design,"
the Lab draws the data-flow and stamps the server `0x00`.

### Instrument — the behaviour
How the interface *acts* when operated: it presents measurements, not conversations;
saturation, not counters; acquisition, not spinners. Products are **operated like
instruments**, not browsed like apps. This is the newest and most distinctive layer, and
the one most easily lost — guard it.

> **Worked examples.** Canonical, production-grade reference implementations (a component
> showcase plus desktop and mobile application mocks, built as if shipped) will be authored
> once the system and its documentation stabilise, and will become the visual tie-breaker.
> Until they exist, this document together with `DESIGN.md` and `DESIGN_USE.md` governs.

---

## 3. Founding principles

These are the *why*. The concrete rules in `DESIGN_USE.md` are downstream of them.

### P1 — The identity is structural, not chromatic
The brand is carried by seams, density, recession, the dark cavity, and the
machine-documentation grammar — **not** by any particular colour. The system must remain
unmistakably NC-750 in steel-blue, in candy-pink, in dark plum. Colour is a user-owned
variable; structure is the constant. (Proven in `color-system-demo.html`: change the two
seeds, the device rethemes, the identity survives.)

### P2 — Containment: the chassis wraps the page
Content does not float freely on a browser canvas. It sits inside a chassis with a
textured field. The texture is subtle — it tells the eye "this is a material surface,"
nothing more. An NC-750 screen without a chassis is a regression.

Containment does **not** mean stasis. The chassis is a live device, not a fixed poster:
cells may enable and disable, bands may be swapped as the app changes state, and genuine
interrupts may open an overlay or modal *over* the chassis. "The chassis is never broken"
forbids *floating, chassis-less content adrift on the canvas* — it does not forbid motion,
modals, or status-driven recomposition. A modal is still framed in the grammar (seams,
recession, no drop-shadow card, per **P3**); it is the chassis reconfiguring, not
dissolving. This dynamic layer is deliberately under-specified for now and will grow with
real products — treat it as open, not settled.

### P3 — Seams, not shadows
Surfaces are separated by **crisp 1px seams and tonal shifts**, never by drop-shadows,
ambient shadows, or glow-as-elevation. Depth is conveyed by *recession and brightness*
(brighter sits closer), and the only permitted shadows are thin edge bevels that
simulate light catching a machined edge. The previous implementation drifted into
shadowed, floating seams; that is the single most important thing to *not* do.

### P4 — Recession holds the content
Dense chrome (controls, specs, tables, navigation) lives on raised panels. **Diagrams,
schematics, and readouts live on recessed drafting plates** — a flatter, cut-in surface
with an inset bevel. The recession is the affordance that says "study this." Whitespace
is permitted *inside* a recessed plate and nowhere else; the panel contains the
whitespace, the whitespace never dissolves the panel.

### P5 — Document over decoration
Every graphic element should communicate something true. A schematic must match real
behaviour; a spec row must be verifiable; the `0x00` mark must certify an actual
zero-state. Decoration that means nothing is forbidden — it is the opposite of the
machine-documentation stance and it dilutes the marks that *do* mean something. `0x00`
is load-bearing vocabulary (null / zero / none), not a corner sticker.

The honesty this principle demands is **presentational**: the grammar proves the
*product's own* behaviour — what it does, where data goes — not the truth of whatever a
user feeds it. A readout shows the real value the system computed from its input; it is
not expected to certify that the input itself is true (that is an application-domain
concern — see `ETHOS.md §7`). And "document over decoration" is in service of *utility*,
not exposure for its own sake: it exists to help the operator get work done and trust what
they see — internals may be hidden when hiding them serves the task, not flaunted as proof
of depth.

### P6 — Instrument over app
The interface is *operated*, not *used* — and "operated" means the **operator leads**: the
instrument responds to a deliberate action, presents an honest reading, and waits. It does
not drive the session. Favour readouts, probes, signal language, acquisition states, and
one-directional input over chat bubbles, infinite feeds, and generic form fields. That
measurement vocabulary is the *characteristic expression* of the instrument stance, but it
is downstream of the deeper rule that the system reacts to the user (**P10**): reach for a
reading because it hands interpretation back to the operator, not because every screen must
look like a gauge. Explicitly reject the terminal/console aesthetic — it is the overused
cliché of privacy and AI tooling, and it is not what an instrument looks like. An instrument
reveals truth; a terminal just accepts commands.

### P7 — Ownership through customization
The user's chosen theme seed is the unit's fingerprint. Surfacing it (a stamped seed
hex, a "configured by operator" mark) converts customization — already a strength — into
*evidence of ownership*, which is the brand's hardest claim to make visually: "this
belongs to me." Anonymous-manufacture language ("milled from a billet") is out;
owned-unit language is in.

### P8 — One loud signal, held in reserve
The accent colour is a *signal*, not a palette. It marks the primary action, the current
selection, focus, the active/live state, and the `0x00`/null mark — and nothing else. It
appears on ≤10% of any screen. Its loudness is functional, like a warning label. Linework
in diagrams stays neutral; the accent is never spent on decoration, and never replaced by
a second decorative hue (no blueprint-cyan stealing the signal).

### P9 — Honest motion
Motion is subtle, non-intrusive, and either functional (state change, tactile press) or
quietly alive (a slow waveform shimmer in a live cell). The one moment motion earns
prominence is **acquisition** — when the instrument is genuinely working (e.g. an AI
request in flight), it *shows the signal being read* rather than a generic spinner. No
page-load choreography, no scroll-reveals, no bounce. Respect `prefers-reduced-motion`.

### P10 — The system reacts; the user leads
The instrument responds to the operator; it never predicts, steers, nudges, or harvests to
decide *for* them. The human initiates the action and remains the **sole interpreter** of
what the reading means — the software's job is to present honest state and stop, not to
anticipate the next move or manufacture engagement. This is the root of "instrument over
app" (**P6**): the readout vocabulary exists to hand interpretation back to the user, and
the rejection of feeds, anticipatory nudges, and attention-farming follows from it. The
exception is honest and narrow — software whose *purpose* is prediction or analysis (a
scientific tool, a route planner) may of course predict, **provided the user initiates it**
and owns the result. What is rejected is the *ambient* anticipation that quietly runs the
session on the user's behalf. This is the brand's governing stance, not only a visual rule;
it is stated here because the visual grammar must express it, but it binds every layer.

---

## 4. What it must never feel like

These are **patterns to reject, not shapes to ban.** What fails a screen is the *behaviour*
each of these stands for — attention-farming, anticipation, decoration-as-substance,
dishonesty — not the literal layout. If a screen adopts the *mechanics* below, it has failed
regardless of token correctness:

- a **SaaS dashboard** *as engagement theatre* (hero-metric + sparkline cards that exist to
  look busy rather than to be read);
- a **hacker terminal** (CRT, scanlines-as-theme, `>_` prompt, matrix rain);
- a **crypto/web3 network graph** (node-and-edge topology as decoration);
- a **marketing landing page** (gradient washes, floating glass cards, stock illustration);
- a **chat client** *whose hero is the bubble transcript* and whose loop is built to keep you
  talking;
- **Material / Bootstrap** (elevation shadows, ripples, FABs).

**The form itself may be unavoidable — and that is fine.** Some tasks genuinely *are* a
conversation, a map, or many live metrics at once; a product whose job needs that form keeps
it. The work is then to **integrate the form into the grammar** — frame it in a chassis,
document it, and strip the attention-seeking and dishonest mechanics — rather than contort
the task into a metaphor it does not fit. When a familiar UI is the honest choice, use it;
just without the dark patterns. The corrective in every case is the same: return to the three
grammars and to **P10** — make the surface *react to* the user instead of farming them.

---

## 5. Glossary (shared vocabulary)

Use these terms consistently; humans and LLMs should name the same thing the same way.
Component-level names live in `DESIGN.md`; these are the conceptual grammar terms.

- **Chassis** — the outermost framed container; the device body.
- **Field** — the textured background the chassis and cells sit on.
- **Cell** — a single panel within the chassis grid.
- **Seam** — the 1px line (or tonal shift) where two cells meet. Never a shadow.
- **Cavity** — a dark, recessed surface for live readouts (the "LCD" / console).
- **Drafting plate** — a recessed, flatter cell interior that holds a diagram or schematic and is allowed to breathe.
- **Spec-detail** — the right-aligned technical string in a cell header (e.g. `DOC // 0x00-DF`), opposite the cell title.
- **Signal** — the single accent colour, used only for action/selection/focus/live/null.
- **Probe** — one question/observation in an instrument interaction (not a "chat message").
- **Readout** — the live measurement surface that accumulates as the user feeds the instrument.
- **Acquisition** — the working/processing state, shown as the signal being read.
- **`0x00`** — the null/zero/none mark; certifies an absolute zero-state.

---

## 6. How the layers map to the products

- **NODE-XX (software):** full three-grammar expression. Mirror is the reference — the
  interview is an *instrument* (probe → acquisition → readout), not a chat.
- **UNIT-XX (hardware):** chassis and document grammars are literal (stamped chassis,
  etched part numbers); the instrument grammar is the physical control feel.
- **CORE-XX (infrastructure):** mostly document grammar — its surfaces are specs,
  schematics, and logs, because it is the layer that has no consumer UI.

Every NODE/UNIT/CORE inherits this constitution. A surface that cannot be expressed in
the three grammars is either out of scope or a sign the grammar needs to grow — raise it
deliberately, do not improvise around it.
