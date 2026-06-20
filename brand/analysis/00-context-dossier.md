# 00 — Context Dossier (Agent 1: Raw-data holder)

> **Stance.** This file contains FACTS, QUOTES, and FAITHFUL DESCRIPTION only — no
> interpretation, no judgment. Citation tags reference the four source documents and the
> inspiration images. Downstream agents (philosophical, technical) build their analyses on
> top of this. Sources read: `brand/BRAND.md`, `brand/VISUAL_IDENTITY.md`,
> `lab/DESIGN_USE.md`, `brand/ETHOS.md`, and every image under `brand/inspiration/` and
> `brand/inspiration/machine_documentation/`.
>
> **Citation convention.** `BRAND.md §N` = section N. `VISUAL_IDENTITY.md §N PX` = section N,
> principle PX. `DESIGN_USE.md §N RuleXX` = section N, rule. `ETHOS.md CX.Y` = constraint.
> Quoted lines are verbatim from the source.

---

## A. Per-document fact extraction

### A.1 `BRAND.md` — identity, voice, naming

**Genesis / lineage.**
- The brand began as "Cassette Futurism" under working name *NeoCassette*, source of the `nc` prefix. `BRAND.md §1`:
  > "The brand originally began as an exploration of the "Cassette Futurism" art style under the design working name *NeoCassette* (which established the legacy `nc` prefix across its code and system assets)."
- It matured into the **Lab** design system. `BRAND.md §1`:
  > "matured into its current form — the **Lab** design system: *machine-documentation instrument panels*, where software is presented as a precision laboratory instrument documented like a technical manual"
- Parent brand name derived from hardware module identifiers. `BRAND.md §1`:
  > "the parent brand was formally designated as **NC-750**—derived directly from low-level system layout variables and internal hardware module identifiers (`// MODULE NC-750-B`)."

**The four brand pillars** (`BRAND.md §1`, "The Pillars"). The brand "operates at the intersection of premium industrial design (inspired by the ethos of *Nothing* and *Teenage Engineering*) and absolute user sovereignty."

1. **Data Integrity, Not Absolutism.** `BRAND.md §1`:
   > "the brand's promise is *integrity in how data is collected and used* — not a literally-false absolute. The goal is **zero user-data collection wherever that is possible**, with a local-first, nothing-leaves-the-device path as the default… **One line is absolute and is never crossed: user data is never sold.**"
2. **You Are Never the Product.** `BRAND.md §1`:
   > "NC-750 collects nothing *about a person* by default. Any metrics about a *product* are opt-in, off by default, anonymous, aggregate, self-hosted… the commitment is **no person is tracked**, not the literally-false absolute that *no number is ever counted*."
3. **Bring Your Own Key (BYOK), or a No-Log Relay.** `BRAND.md §1`:
   > "users may supply their own API key… or run a fully local model (nothing leaves the device at all). An optional NC-750-hosted relay exists purely for zero-setup convenience; when used, it is stateless and content-free by design — it forwards the request and retains nothing."
4. **Structural, Not Chromatic, Identity.** `BRAND.md §1`:
   > "The visual identity is carried by structure — a framed chassis, dense geometric layouts, crisp seams, recessed readouts — not by any single palette. Colour is a user-owned variable; the system stays unmistakably NC-750 in any theme."

**Naming architecture** (`BRAND.md §2`):
- **`NODE-XX` (Software Ecosystem):** "software points of connection within a decentralized, local-first network." E.g. `NODE-0M` for Mirror. UI logs use "strict lowercase wide-tracked monospace syntax: `sys // node-0m // active`."
- **`UNIT-XX` (Hardware Line):** "physical, modular hardware components, machine enclosures, or self-hosted server chassis." Chassis formatting "Stamped or laser-etched… `NC-750 // UNIT-01 // LOCALHOST`."
- **`CORE-XX` (System Primitives):** "the underlying, invisible infrastructure: open-source protocol libraries, database architectures, or system-wide configuration files running directly on bare metal."
- **`0x00` (The Cryptographic Mark):** `BRAND.md §2`:
  > "The hexadecimal notation for a null byte—**`0x00`**—serves as the official graphic stamp… it acts as a technical signature certifying an absolute zero-data-tracking environment."
- **`NC-750`:** "The brand uses its name as its logo."

**Visual one-liner** (`BRAND.md §3`):
> "a framed, textured **chassis** holds cells joined by crisp 1px **seams**; diagrams and readouts sit on recessed **drafting plates**; a single loud accent acts as a **signal**, never decoration; type runs at extreme contrast (heavy display against tiny wide-tracked mono labels); and the identity is **structural, not chromatic**… Products are *operated like instruments*, not browsed like apps."

**Mirror case study** (`BRAND.md §4`): `Mirror (NODE-0M) by NC-750`, formerly "Persona." Core utility: "a deeply analytical career reflection tool… conducts a text-based, conversational AI interview… outputs two documents: a private insight dossier and a polished public profile." Hero copy: "Your career, understood honestly." / "Nothing leaves your device." CTA: "`[ Download Mirror ]` — no fake urgency, no dark patterns." "The interview interface — Mirror as an **instrument** rather than a chat — is the reference example in `lab/DESIGN_USE.md` §10."

---

### A.2 `VISUAL_IDENTITY.md` — the visual worldview (constitution)

**Status.** `VISUAL_IDENTITY.md §0` (preamble): "This document is the **constitution** of the NC-750 visual language… When a concrete rule and this document disagree, this document wins and the rule is the bug."

**The one line** (`VISUAL_IDENTITY.md §1`):
> "**The Lab design system: software presented as a precision laboratory instrument, documented like a technical manual.**"
> "The style descriptor is **machine-documentation instrument panels**. Three influences fuse into one language: the *chassis* of a machined enclosure, the *page* of an engineering manual, and the *behaviour* of a measurement instrument. None of the three alone is the system; the synthesis is."

**The three grammars** (`VISUAL_IDENTITY.md §2`):
- **Chassis — the container.** "The framed device that sits on the page. A textured background field, a dark header and footer, panels joined by seams, optional corner screws. The chassis is *always present and never broken*… This is the layer the old name "Enclosure" described — now only one third of the system."
- **Document — the content.** "schematics, spec sheets, dimension lines, callouts, part numbers, registration marks, and the `0x00` null mark. The Document grammar exists to *communicate reality and prove claims*… Where a marketing site writes "Private by design," the Lab draws the data-flow and stamps the server `0x00`."
- **Instrument — the behaviour.** "How the interface *acts* when operated: it presents measurements, not conversations; saturation, not counters; acquisition, not spinners. Products are **operated like instruments**, not browsed like apps. This is the newest and most distinctive layer, and the one most easily lost — guard it."

**The nine founding principles** (`VISUAL_IDENTITY.md §3`, P1–P9, verbatim heads + key clauses):
- **P1 — The identity is structural, not chromatic.** "carried by seams, density, recession, the dark cavity, and the machine-documentation grammar — **not** by any particular colour… unmistakably NC-750 in steel-blue, in candy-pink, in dark plum. Colour is a user-owned variable; structure is the constant."
- **P2 — Containment: the chassis wraps the page.** "Content does not float freely on a browser canvas. It sits inside a chassis with a textured field… An NC-750 screen without a chassis is a regression."
- **P3 — Seams, not shadows.** "Surfaces are separated by **crisp 1px seams and tonal shifts**, never by drop-shadows… Depth is conveyed by *recession and brightness* (brighter sits closer), and the only permitted shadows are thin edge bevels that simulate light catching a machined edge."
- **P4 — Recession holds the content.** "Dense chrome (controls, specs, tables, navigation) lives on raised panels. **Diagrams, schematics, and readouts live on recessed drafting plates**… The recession is the affordance that says "study this." Whitespace is permitted *inside* a recessed plate and nowhere else."
- **P5 — Document over decoration.** "Every graphic element should communicate something true… `0x00` is load-bearing vocabulary (null / zero / none), not a corner sticker."
- **P6 — Instrument over app.** "The interface is *operated*, not *used*. Favour readouts, probes, signal language, acquisition states, and one-directional input over chat bubbles, infinite feeds, and generic form fields. Explicitly reject the terminal/console aesthetic… An instrument reveals truth; a terminal just accepts commands."
- **P7 — Ownership through customization.** "The user's chosen theme seed is the unit's fingerprint… converts customization… into *evidence of ownership*… "this belongs to me." Anonymous-manufacture language ("milled from a billet") is out; owned-unit language is in."
- **P8 — One loud signal, held in reserve.** "The accent colour is a *signal*, not a palette. It marks the primary action, the current selection, focus, the active/live state, and the `0x00`/null mark — and nothing else. It appears on ≤10% of any screen… Linework in diagrams stays neutral."
- **P9 — Honest motion.** "Motion is subtle, non-intrusive, and either functional… or quietly alive… The one moment motion earns prominence is **acquisition** — when the instrument is genuinely working… it *shows the signal being read* rather than a generic spinner… Respect `prefers-reduced-motion`."

**What it must never feel like** (`VISUAL_IDENTITY.md §4`): "a **SaaS dashboard**… a **hacker terminal** (CRT, scanlines… `>_` prompt, matrix rain)… a **crypto/web3 network graph**… a **marketing landing page**… a **chat client**… **Material / Bootstrap**." Corrective: "return to the three grammars — frame it in a chassis, document it instead of decorating it, and make it behave like an instrument."

**Layer→product map** (`VISUAL_IDENTITY.md §6`): NODE = "full three-grammar expression. Mirror is the reference — the interview is an *instrument* (probe → acquisition → readout), not a chat." UNIT = "chassis and document grammars are literal (stamped chassis, etched part numbers); the instrument grammar is the physical control feel." CORE = "mostly document grammar — its surfaces are specs, schematics, and logs."

---

### A.3 `lab/DESIGN_USE.md` — application guide (the *how*)

**Status.** Subordinate to the constitution: "When this guide and `VISUAL_IDENTITY.md` disagree, the constitution wins" (`DESIGN_USE.md §0`).

**Screen anatomy** (`DESIGN_USE.md §1`): assembled top-down — FIELD → CHASSIS → (HEADER, [TABS], BANDS→CELLS, FOOTER). `Rule A1`: "A screen has exactly one chassis as its outermost framed object. Content never sits directly on the browser canvas." `Rule A2`: field is "always textured… never a flat fill… keep it below ~5% contrast."

**Chassis** (`§2`): `.nc-chassis`, 1.5px ink-seam border, 16px outer radius, single raised edge bevel "never a drop shadow." Screws optional, "Four corners or none — never two." `Rule C1`: "One outer radius for the chassis; inner cells are square against the seams. Rounded cells inside a rounded chassis read as bubbles — forbidden."

**Header/footer** (`§3`): use the dark monitor surface (`.nc-monitor`). Header carries part-number label, live status LEDs (`.nc-led`), right-aligned LCD readout. Footer is "quiet; it is a nameplate, not a navigation surface." `Rule H1`: header/footer "always the darkest surfaces on a light screen — they frame the instrument like the bezel of a device."

**Seams** (`§4`): "1px seams." Weights: `--nc-line`, `--nc-line-subtle`, `--nc-line-strong`, `--nc-line-ink` (1.5px). `Rule S1 — Seams never break`: "A broken seam is the #1 visual regression and the thing the previous implementation got wrong." `Rule S2 — No shadowed seams`: depth from recession/brightness + thin edge bevels; "Drop/ambient shadows, glow-as-elevation, and floating cards are forbidden."

**Cell anatomy** (`§5`): cell = header + body. **Cell title** left-aligned, mono uppercase, "names the cell's function (`DATA FLOW ANALYSIS`, `CONTROL`, `SYSTEM PROPERTIES`)." **Spec-detail** right-aligned, muted, "carries the technical address of the cell: `DOC // 0x00-DF`, `RAIL // 0x01`, `SPEC // NODE-0M`." `Rule CE1`: spec-detail "always present… because it is what makes the cell read as an addressed component of a machine rather than a generic box." `Rule CE2`: "Titles state function, not marketing. `SYSTEM PROPERTIES`, not `Why we're private`."

**Surface assignment — chrome vs drafting plate** (`§6`, operational form of P4):
- Controls/specs/tables/nav/status → **Cell** (raised, "Dense chrome sits close to the user").
- Diagrams/schematics/exploded views/readouts → **Recessed drafting plate** ("The cut-in surface says "study this"; it may breathe").
- `Rule SF1`: "The cell frame is always chassis grammar; only the interior may open."
- `Rule SF2`: "Whitespace is bounded… allowed **only** inside a drafting plate."
- `Rule SF3 — Live readouts use the cavity`: "Dark = alive/measuring; light = static/operable."
- **Readout example** (§6): "A readout is not a CSS class. It is an application-level composition of existing primitives assembled inside a `.nc-monitor` cavity." Parts: `.nc-cell`, `.nc-monitor`, `.nc-facet`, `.nc-coverage` ("per-item saturation bars, filling toward "locked.""), `.nc-lcd`/`.nc-lcd-sub`, `.nc-led--rec`. Example fields: `PATTERNS DETECTED`, `CONFIDENCE`, `EVIDENCE POINTS: 7`, `STATUS: ACQUIRING …`.

**Grid** (`§7`): "non-uniform by design." Bands do not share a column count. `Rule G1`: "Uniform grids read as dashboards." `Rule G2 — Pair dense with open`: "a packed chrome cell beside an open drafting-plate cell… The contrast is the system's signature."

**Responsive** (`§8–9`): Desktop ≥1024px — "the instrument readout and its input sit **side by side** so the readout climbs in the user's periphery while they act." Mobile <640px — "**simultaneous-peripheral becomes sequential-focal**." Readout "demotes to a sticky strip"; "Acquisition becomes a full-screen takeover"; `Rule M2`: "The instrument must never disappear."

**Instrument interaction — the essence** (`§10`, operational form of P6). "It is **not** a fixed recipe." The essence (transferable):
- "**Foreground the artifact, not the exchange.** The hero is the thing being produced, measured, or revealed — not the log of back-and-forth."
- "**Speak in instrument state — honestly.** Express system state as a reading (level, coverage, lock, signal, present/null) *when that is genuinely the truth of the process*. Never invent a reading the system isn't actually taking — no fake progress, no decorative meter."
- "**Match feedback to the nature of the work**" (Latency: foreground/blocking → acquisition; background/non-blocking → quiet ambient indicator. `Rule I1`: "Never block the user with an acquisition takeover for work that could run in the background.").
- "**Shape the input to the intent.** Constrain input where you want focus and depth; open it where you want exploration."

**Worked example — Mirror's interview** (`§10`), "a *sustained, single-focus, foreground inquiry of unknown length*":
- "**Probe, not chat turn** — one facet-tagged observation at a time."
- "**Readout, not transcript** — the accumulating reading (patterns, evidence, confidence) is the hero."
- "**Saturation, not a counter** — coverage meters fill toward "sufficient signal"; conclude when saturated."
- "**Acquisition, not a spinner** — the user waits on each turn, so latency shows as the signal being read."
- "**Collapsing log, not a feed.**" / "**Append-only** — entries are added to, never silently rewritten." / "**One-directional, generous input** — the instrument asks; the user supplies evidence via an explicit affordance, not a free chat box."
- `Rule I2`: "Apply the essence; derive the patterns from the *product's own task*. Do not port Mirror's probe / acquisition / saturation / log set onto a product whose interaction is not a sustained foreground inquiry."

**Motion** (`§11`): functional (90–280ms), ambient ("only inside important live cells," ≥600ms cycles), acquisition (the one prominent moment). `Rule MO2`: honour `prefers-reduced-motion`.

**Accessibility** (`§12`): WCAG 2.1 AA (per `ETHOS.md C8.3`); "visible focus is the orange signal rim." `Rule AX1`: "A theme that fails AA is not a valid theme."

**Migration note** (`§14`): four prior drifts to correct — (1) "Shadowed / floating seams → flat 1px seams"; (2) "Dark-first presentation → light-first… The default is the bright machined field; dark is the cavity and the night theme"; (3) "All-dense layouts → dense+open rhythm"; (4) "Manufacturing language → ownership language."

---

### A.4 `ETHOS.md` — binding product constraints

**Status** (`ETHOS.md §0`): "the **compliance charter**… The brand's promise is **integrity, not absolutism**… a privacy posture you can verify in a network tab, not a slogan. A product that breaks one of these constraints does not get a brand exception; it gets fixed, or it ships without the NC-750 mark."

**§1 Content & Data Ownership** ("The default is **zero collection**"):
- **C1.1** User content "MUST be local-first by default and MUST NOT be written to an NC-750-owned server unless the feature genuinely requires it (C1.6)."
- **C1.2** "User content MUST NEVER be **sold** or shared for advertising — this is absolute and admits no exception." No training "**except** with the user's informed, opt-in consent."
- **C1.3** "A **fully local path** (nothing leaves the device) MUST be offered wherever it is technically feasible, and SHOULD be the default."
- **C1.4** Transmitted content "MUST go *only* to the destination required… document — in plain words — precisely what is sent and to whom."
- **C1.5** Export and hard-delete all local data "with no remote copy left behind."
- **C1.6 (Fallback tier)** When data is genuinely required: minimum necessary; informed opt-in consent off by default; disclosed purpose only; publish what/why/where/how-long; deletion on request. "A feature operating in this tier MUST NOT carry the `0x00` zero-tracking mark."

**§2 Telemetry & Measurement:** **C2.1** "No product may collect data **about a person**." **C2.2** opt-in, off by default. **C2.3** "anonymous and aggregate," no persistent unique ID. **C2.4** "**No third-party analytics SaaS**" (no Google Analytics/Mixpanel-cloud). **C2.5** "IP addresses MUST be stripped." **C2.6** schema published. **C2.7** "**Counting your own infrastructure is allowed**" (downloads, billing, license — aggregate, never joined to a person). **C2.8** license/device ID "MUST NOT enter any telemetry stream."

**§3 AI & Third-Party Processing:** **C3.1** "**BYOK MUST always be available**." **C3.2** "A **fully local model option**… MUST be supported wherever technically feasible." **C3.3** relay "permitted **only** if it is stateless and content-free by design." **C3.4** default hosted processing needs DPA with no-training + bounded retention. **C3.5** CSP pins `connect-src`.

**§4 Identity & Accounts:** **C4.1** "fully usable **without creating an account**." **C4.2** billing identity with the payment processor, not the app. **C4.3** secrets in OS-native credential store, "never in plaintext on disk."

**§5 Monetization & Honesty:** **C5.1** "**No dark patterns.** No fake urgency, no hidden cancellation, no manipulative defaults, no confirm-shaming." **C5.2** help the user "**stop paying when done**." **C5.3** "Paid tiers MUST gate **additional features**, not artificially cripple the core." **C5.4** free tiers honestly labeled. **C5.5** "Marketing claims MUST be **literally true**. No absolute ("nothing ever leaves your device") that the implementation contradicts. State the per-path truth."

**§6 Organizational/Channel Sales:** **C6.1** org end-user privacy "MUST be identical" to consumer. **C6.2** buyer may see "seat utilization… MUST NEVER see an individual's content… This boundary is the line between a channel and surveillance."

**§7 Claims & Terminology Discipline:** **C7.1** no misused crypto terms of art ("zero-knowledge," "end-to-end encrypted," "anonymous") unless literally implemented. **C7.2** docs match shipped reality. **C7.3** "The product SHOULD over-disclose."

**§8 Visual & Naming Surface:** **C8.1** follow `NODE/UNIT/CORE-XX` + Lab design system. **C8.2** "The `0x00` mark certifies a zero-person-tracking environment; it MUST NOT be applied to any surface that violates Sections 1–2." **C8.3** WCAG 2.1 AA, keyboard navigable, `prefers-reduced-motion`.

---

## B. Inspiration read-out

> Per image: filename → literal description → motif it contributes → verbatim legible text.

### B.1 `inspiration/Teenage Engineering OP-1.jpg`
- **Depicts.** The Teenage Engineering OP-1 synthesizer: a tall white/light-grey rectangular machine. Top row of small buttons; a column of four large coloured rotary encoders (orange, white, green, blue) down the left; a black recessed LCD display (lower-left) showing a circular oscilloscope-style readout with small white graphics; a vertical column of numbered (1–8) function buttons and black/pale knobs; a grid of pale rounded rectangular keys on the right; a round speaker grille and a row of small labelled keys at the bottom; one orange accent button bottom-right.
- **Motif.** Tactile single-purpose instrument controls; one-knob-per-function physical operation; a dark recessed "cavity" display set into a light machined body; restrained colour (a few coloured knobs + one orange accent) on a neutral chassis.
- **Legible text.** "OP-1"; numerals "1"–"8" along the function column.

### B.2 `inspiration/Element #1513157357.jpg`
- **Depicts.** A close-up 3D render of a light-grey machined device at an angle. A hex-perforated speaker grille on the left; an upper panel with two large round knobs, small line-icon legends above them, and a recessed 4-way directional pad with orange arrow markers; below, a row of numbered (2–5+) pale rounded-rectangle pad keys. On the right edge, a phone/screen shows large bold orange display type. Small orange accent dots mark active states near the knobs.
- **Motif.** Machined light-grey enclosure with framed control "cells," icon-legended knobs, recessed directional control, and the single orange accent used only to mark live/active states; bold orange display type paired with the neutral chassis.
- **Legible text.** Partial display words "Hel…", "Bri…", "Le…", "so…"; "Late…" (truncated). Knob legends "CAP1 / CAP2 / CAP3" (approx.).

### B.3 `inspiration/download (2).jpg`
- **Depicts.** The Teenage Engineering TX-6 mixer: a silver milled rectangular unit. Three rows of small knobs across the top (top row dark caps, middle row orange caps, bottom row pale caps); a small monochrome LCD top-right showing "L R" meters and the value "50"; a large white rotary encoder; six vertical channel faders in machined slots; a row of small pale buttons at the bottom; FX buttons (one dark with "I", one orange with "II"); a "shift" button with a dot; a knurled metal thumbwheel projecting from the bottom edge.
- **Motif.** Dense, addressed control surface (rows of identical controls = channels); a small recessed LCD readout with meter + numeric value; faders as one-directional input; the orange accent reserved for one row of knobs and one FX button; knurled machined detail.
- **Legible text.** "TX-6"; "L R"; "50"; "FX"; "shift"; "I", "II".

### B.4 `inspiration/Modpods - Andrew Walla.jpg`
- **Depicts.** Seven small square modular control "pods" arranged on a dark surface. Variants include large single rotary knobs, fader/slider pads, a 4-button quad pad, and a cross/plus pad. Colours: one orange (with cable), one navy-blue, several silver/grey, one black. Each pod has a small label strip and tiny edge pin/port markings.
- **Motif.** Modular single-purpose instrument units (one pod, one job); a family of identical chassis re-skinnable in different colours (structural identity surviving colour change); part-number labels on each unit; one orange unit acting as the loud accent in a neutral set.
- **Legible text.** "Patch" / "MOPatch" (logo, repeated); part-number strings approx. "MP-01", "MP-22", "MP-300" on the label strips.

### B.5 `inspiration/nothing_phone.jpg`
- **Depicts.** The back of a white Nothing Phone, photographed close. The semi-transparent rear reveals internal chassis architecture: exposed screws at the corners, dotted/perforated texture zones, curved white LED light strips (Glyph) around the camera module, a triple-camera oval lens housing, and a single small **red** square accent set into the lower-right of the camera plate. Fine etched part-number/regulatory text runs vertically near the bottom edge.
- **Motif.** Honest exposed chassis — the internal structure is the aesthetic; visible screws and assembly seams; etched part numbers/serials as ornament; a single red accent square on an otherwise white/neutral body.
- **Legible text.** Vertical etched text (partly legible) "…NOTHING TECHNOLOGY LIMITED / …DON, ENGLAND / PN …" and a model/serial string.

### B.6 `inspiration/nothing_phone_3.jpg`
- **Depicts.** A transparent-backed Nothing Phone render showing the full internal layout through a clear case: multiple camera lenses (top-left and centre), a circular dot-matrix **micro-LED display** (top-right) showing a white audio-waveform graphic, exposed circular and rectangular component outlines, screw points, a small fingerprint/sensor circle, and a single small **red** square accent between the two main lenses. Etched "NOTHING" wordmark runs vertically up the left edge; regulatory marks (CE, recycling) at the bottom-right.
- **Motif.** Fully exposed chassis / x-ray transparency as identity; a small dot-matrix readout showing a live waveform (signal being read); the single red accent square; etched wordmark + regulatory/part marks as authentic documentation.
- **Legible text.** "NOTHING" (vertical, left edge); "CE" and recycling/regulatory glyphs (bottom-right); a faint serial/part string.

### B.7 `inspiration/machine_documentation/01.jpg` — "Making Software"
- **Depicts.** A blue-on-light-grey engineering-manual page. Title top-left; subtitle and author top-right. Left column: explanatory body text with small blue diagrams (a layered touchscreen-electrode stack as an exploded grid, a 3D Gaussian-blur surface plot over a pixel grid, a bezier-curve control-point diagram). Right side: a large **exploded isometric line diagram of a 3.5″ floppy disk** with leader-line callouts naming each part. Bottom-right: a large "Aa" letterform on a grid demonstrating rasterisation.
- **Motif.** Software depicted as an exploded engineering diagram; the thesis of deep tool understanding vs. shallow abstracted use; leader-line callouts + part labelling; blue linework on a neutral page (one-colour technical drawing).
- **Legible text (verbatim, selected).** "Making Software"; "A reference manual for people who design and build software."; "Written and illustrated by Dan Hollick."; callouts "NO NOTCH", "TOP SHELL", "DUST LINER", "MAGNETIC DISK", "HUB", "WRITE PROTECT TAB", "WRITE PROTECT NOTCH", "BOTTOM SHELL", "SHUTTER", "SHUTTER SPRING", "LIFTER". Body: "It won't make you a better designer or programmer tomorrow - there's nothing actionable in here. But knowing how things work comes in handy when you find yourself out of your depth."; "today we understand them in a shallow, abstracted way."; "You just need to be curious."; "t = 0.5".

### B.8 `inspiration/machine_documentation/02.jpg` — "Label Vectors"
- **Depicts.** A dense field of black-on-light technical labels, barcodes, QR codes, spec tables, registration crops, and part-number strings tiled edge to edge. Centred over them is one large **orange** label-card with a hazard-stripe header, big black headline, a wireframe globe, and bracketed spec lines.
- **Motif.** Part numbers, serials, barcodes, QR codes, hazard stripes and spec tables as a visual language; a single loud orange element held against an otherwise neutral black/grey field; "editable label" / asset-pack framing of industrial annotation.
- **Legible text (verbatim, selected).** "LABEL VECTORS"; "[ 145 ELEMENTS ]"; "[ SVG  PNG  AI ]"; "145 LABEL GRAPHICS WITH EDITABLE TEXT"; "PRIORITY: A"; "INTERNAL"; "NAS-001", "NASGT-001", "MHV-EDGE", "MHV-RST"; "GENERATED CONTENT"; "INSIDE"; "IMPACT"; "PROFESSIONAL"; "MEDIC"; "RADAR"; "2025"; "01201002"; "DYSTROPHIN" / "RAAVH74" (decorative serial strings); date string "AUG 20  W. 11/4  H. 14/23  D. 23/54".

### B.9 `inspiration/machine_documentation/03.jpg`
- **Depicts.** A large tiled sheet of dozens of small black-on-white **HUD / interface graphic** modules: status blocks, node-and-spoke radial diagrams, dotted clusters, registration marks, segmented bars, small numeric IDs, and CJK characters. Each module reads like a single instrument annotation (status line + value + small glyph).
- **Motif.** A catalogue of machine-status annotations — `STATUS`, `OFFLINE`, `ONLINE`, `REBOOT`, ID/temperature/power readouts — as neutral linework; the "document grammar" vocabulary (logs, IDs, registration marks) at sampler scale; CJK accents.
- **Legible text (verbatim, selected).** "ARCHIVE_LOG"; "ACCESS CONFIRMED"; "EGH-9320"; "OUTPUT: DIGITAL [INDEX] 00000037"; "DRIVE-STATE: INTACT"; "MODULE B43"; "PORT: 07"; "ACTIVE — ID: 7F-C2 — POWER: 92%"; "OFFLINE : STANDBY // PORT 025"; "SYSTEM REBOOT"; "ONLINE"; "PACKET LOSS: 0.3%"; "(ANALOG)"; "VECTOR PATH - STABLE"; "RATE: CONSTANT  TEMP: 26°C"; "007"; "EPOCH"; "70 UNIQUE GRAPHICS"; "0079"; "CRITICAL ERROR — ID — 292C"; "POWER — 3/100"; "REJECTED ... ID — 80-6B"; "ERROR — 0x1D22"; "YEAR // 2026"; "DATACLUSTER"; "MODULE-B7 — STABLE"; "TEMP: 27°C | POWER: 68%"; "CONFIG"; "TARGET: SUBSYSTEM-03"; "UNIT-E9G"; "DEVICE"; "SENSOR ARRAY - PROCESSING".

### B.10 `inspiration/machine_documentation/04.jpg` — "System 05"
- **Depicts.** A graphic-design poster on a light ground. Top-left: an outlined "05." with hazard/diagonal-stripe blocks. A vertical barcode and small dashed registration crops; a blue bar with a QR code and date; a tall vertical "SYSTEM" set in heavy black down the left edge; a spec table of "SYSTEM NO." rows; a body paragraph defining the word "system." Dominating the right two-thirds: a large angular **yellow** glyph/letterform overlapping a large **blue** vertical block. A giant black "05" anchors the bottom. A barcode strips the bottom edge.
- **Motif.** Heavy display numeral + tiny wide-tracked spec labels (extreme type contrast); barcodes, QR, registration crops, control numbers, spec tables; bold flat colour blocks (yellow/blue) against neutral grey; "SYSTEM" framed as a serialized catalogue entry.
- **Legible text (verbatim, selected).** "05."; "ST_No.11"; "CONTROL - 00122 / CONTROL - 00123"; "NO - 001  NO - 002"; "CTL- 00122"; "SYSTEM"; "SYSTEM NO. 001 - 340 … 001 - 344"; "2020-05-11"; "A system means an organization or system in which many elements are gathered together. The origin of the system is English system, which means "organization", "system"…"; "05".

### B.11 `inspiration/machine_documentation/05.jpg` — "Street Tree ST-01"
- **Depicts.** A printed catalogue/field-guide page (light paper, faint texture). Header: small "street tree" label, large "ST-01" title, right-aligned section title. A boxed serial-number row; a horizontal numbered measurement axis (01–14) with small dots, two highlighted red dots and one yellow/blue legend dot; below, a row of black ink-blot **tree silhouettes** with dimension lines and labels ("tree growth range", "Restricted growth range", "SAMPLE (A):08"). Bottom-left: a 3-row data table (Number/Latitude/Location). Bottom-right: a boxed "Silhouettes" inset with a tiny line drawing and the number "14."
- **Motif.** Catalogue/serial documentation of an ordinary object (a tree) as if a machined part — serial number, numbered axis, latitude/location spec table, sample labels; muted neutral ink with a few tiny coloured legend dots as the only accent.
- **Legible text (verbatim, selected).** "street tree"; "ST-01"; "STREET TREE : stone 「01-13」"; "SERIAL NUMBER  st-s-01-14  ( street tree-stone-01-13 )"; "tree growth range"; "Restricted growth range"; "SAMPLE (A):08"; "Silhouettes: ST S 01 14"; table — "NUMBER 13", "LATITUDE 114.388521 , 30.478319", "LOCATION china - wuhan"; "ST S 01 13"; "「Back to front」 「left to right」".

### B.12 `inspiration/machine_documentation/UI-01.jpg` — Lighting app
- **Depicts.** A clean mobile UI mockup on a pale ground, drawn in thin black line + neutral type. Status bar "14:41" with signal/wifi/battery glyphs. Large serif "Lighting" title + hamburger menu; a tab row (LIVING ROOM / BEDROOM / **BATHROOM** active / KITCHEN / WORKSHOP). Two rounded panels: left shows a line-drawn pendant lamp and room on/off states plus a large **circular tick-marked dial** reading "75.4% / Warm / 2400k"; right is an "ANALYTICS" panel with a "SOLAR PANELS" dropdown, a small bar chart (kWh by weekday), and a "LIVE" timestamped section with a stepped line graph.
- **Motif.** A consumer app rendered as an instrument: a circular dial readout with tick marks; framed panel "cells"; live + analytics readouts; thin neutral linework with no decoration; the reassurance line "you relax, we'll do the math" (the instrument does the work).
- **Legible text (verbatim).** "14:41"; "Lighting"; "LIVING ROOM  BEDROOM  BATHROOM  KITCHEN  WORKSHOP"; "LIVING ROOM ON  BEDROOM ON  KITCHEN OFF"; "75.4%  Warm  2400k"; "ANALYTICS"; "You relax, we'll do the math. Here's your weekly recap."; "SOLAR PANELS"; "200 150 100 50 0  kWh  MON TUE WED THU FRI SAT SUN"; "LIVE  05:43PM Monday January 2nd"; "140 110 90 120 160".

### B.13 `inspiration/machine_documentation/WipEout.jpg`
- **Depicts.** A WipEout-style print spread on white. Top: two **blue line-drawn isometric racing-craft schematics** with thin leader lines and tiny spec labels. Centre: a large blue concentric-ring "C" logo with a swept tail reading "PORTABLE A-G RACING." Bottom: a row of stylized team/manufacturer **logos** with part-number tags, then a strip of blue HUD bars, arrows, barcodes and a serial. Faint orange/yellow vector linework bleeds in from the left edge.
- **Motif.** Futuristic vehicle schematics in single-colour (blue) linework; manufacturer logos with serials/part numbers; HUD bars and directional arrows; the loud accent (orange) kept faint/peripheral while blue carries the linework.
- **Legible text (verbatim, selected).** "PORTABLE A-G RACING"; team names "AG-SYS", "ASSEGAI", "AURICOM", "FEISAR", "horimou", "PIRANHA", "[QIREX-RD]", "X3 TRIAKIS"; serial "21/4440" / "21/4445".

---

## C. Shared glossary

> Defined exactly as the sources define them. Conceptual grammar terms come from
> `VISUAL_IDENTITY.md §5`; component/application terms from `DESIGN_USE.md`.

| Term | Definition (verbatim) | Citation |
|---|---|---|
| **Chassis** | "the outermost framed container; the device body." | `VISUAL_IDENTITY.md §5` |
| **Field** | "the textured background the chassis and cells sit on." | `VISUAL_IDENTITY.md §5` |
| **Cell** | "a single panel within the chassis grid." | `VISUAL_IDENTITY.md §5` |
| **Seam** | "the 1px line (or tonal shift) where two cells meet. Never a shadow." | `VISUAL_IDENTITY.md §5` |
| **Cavity** | "a dark, recessed surface for live readouts (the "LCD" / console)." | `VISUAL_IDENTITY.md §5` |
| **Drafting plate** | "a recessed, flatter cell interior that holds a diagram or schematic and is allowed to breathe." | `VISUAL_IDENTITY.md §5` |
| **Spec-detail** | "the right-aligned technical string in a cell header (e.g. `DOC // 0x00-DF`), opposite the cell title." | `VISUAL_IDENTITY.md §5` |
| **Signal** | "the single accent colour, used only for action/selection/focus/live/null." | `VISUAL_IDENTITY.md §5` |
| **Probe** | "one question/observation in an instrument interaction (not a "chat message")." | `VISUAL_IDENTITY.md §5` |
| **Readout** | "the live measurement surface that accumulates as the user feeds the instrument." | `VISUAL_IDENTITY.md §5` |
| **Acquisition** | "the working/processing state, shown as the signal being read." | `VISUAL_IDENTITY.md §5` |
| **`0x00`** | "the null/zero/none mark; certifies an absolute zero-state." (Also: "load-bearing vocabulary (null / zero / none), not a corner sticker," `VI P5`; certifies "zero-person-tracking," `ETHOS C8.2`.) | `VISUAL_IDENTITY.md §5`; `VI §3 P5`; `ETHOS.md C8.2` |
| **Saturation** | (applied term) "coverage meters fill toward "sufficient signal"; conclude when saturated." | `DESIGN_USE.md §10` |
| **Coverage** (`.nc-coverage`) | "per-item saturation bars, filling toward "locked."" | `DESIGN_USE.md §6` |
| **Facet** (`.nc-facet`) | "labels the measurement category (`PATTERNS DETECTED`)." | `DESIGN_USE.md §6` |

---

## D. Question → passage index

### Q1 — What is an "instrument" in the context of NC-750?

| Citation | Relevance |
|---|---|
| `VISUAL_IDENTITY.md §1` | Defines the synthesis: chassis + manual page + measurement-instrument *behaviour*. |
| `VISUAL_IDENTITY.md §2` (Instrument grammar) | "presents measurements, not conversations; saturation, not counters; acquisition, not spinners… operated like instruments, not browsed like apps." |
| `VISUAL_IDENTITY.md §3 P6` | "operated, not used"; instrument reveals truth vs. terminal accepts commands; rejects terminal aesthetic. |
| `VISUAL_IDENTITY.md §3 P8/P9` | Signal-as-warning-label; acquisition as the one prominent motion (instrument genuinely working). |
| `VISUAL_IDENTITY.md §5` | Glossary defining Probe, Readout, Acquisition, Signal, Cavity. |
| `DESIGN_USE.md §6 (SF3) + readout example` | Live readout = dark cavity composition; "Dark = alive/measuring; light = static/operable." |
| `DESIGN_USE.md §10` | The instrument *essence* (foreground artifact, honest state, latency, shaped input) + Mirror worked example (probe/readout/saturation/acquisition/append-only/one-directional input). |
| `BRAND.md §3, §4` | "operated like instruments, not browsed like apps"; Mirror "as an instrument rather than a chat." |
| Images: OP-1, TX-6, Element, Modpods, UI-01, Nothing (waveform readout) | Physical/visual referents of single-purpose tactile instruments, recessed cavity readouts, dials, faders, honest chassis. |

### Q2 — How can current UI concepts be transformed toward this worldview (return to utilitarian use of a computer)?

| Citation | Relevance |
|---|---|
| `VISUAL_IDENTITY.md §4` | The six "must never feel like" anti-targets (SaaS dashboard, terminal, web3 graph, marketing page, chat client, Material/Bootstrap) — the things to transform *away from*. |
| `VISUAL_IDENTITY.md §2 (Document)` | "Where a marketing site writes "Private by design," the Lab draws the data-flow and stamps the server `0x00`" — replace selling with proving. |
| `VISUAL_IDENTITY.md §3 P5/P6` | Document over decoration; instrument over app — direct transformation principles. |
| `DESIGN_USE.md §5 (CE2)` | Function titles, not marketing titles (`SYSTEM PROPERTIES`, not `Why we're private`). |
| `DESIGN_USE.md §6, §7 (G1/G2)` | Chrome vs. drafting plate; non-uniform grid; "Uniform grids read as dashboards" — recipe for de-dashboarding a UI. |
| `DESIGN_USE.md §10 (I2)` | "Apply the essence; derive the patterns from the product's own task" — transform per task, don't stamp a template. |
| `DESIGN_USE.md §14` | Migration note: the four concrete drifts to correct when transforming existing code. |
| `BRAND.md §1` (genesis) | Lineage from retro-nostalgia → industrial → Lab; "software is presented as a precision laboratory instrument documented like a technical manual." |
| Images: 01 "Making Software", UI-01 Lighting, 03 HUD sampler, 04 System-05 | Deep-tool-understanding thesis; a consumer app re-rendered as instrument; the annotation/spec vocabulary to swap in for chrome decoration. |

### Q3 — What is the essence of the UX of NC-750 and its philosophy?

| Citation | Relevance |
|---|---|
| `BRAND.md §1` (four pillars) | Data integrity / never the product / BYOK-or-no-log-relay / structural-not-chromatic — the philosophical core. |
| `BRAND.md §2` | Naming architecture + `0x00` as certifying mark — identity as serialized system primitives. |
| `VISUAL_IDENTITY.md §1–3` | One line + three grammars + P1–P9: the complete worldview the UX expresses. |
| `VISUAL_IDENTITY.md §3 P7` | Ownership through customization — the seed as "evidence of ownership," "this belongs to me." |
| `DESIGN_USE.md §10 (essence)` | "Foreground the artifact, not the exchange"; "Speak in instrument state — honestly"; shaped input — the UX essence stated directly. |
| `ETHOS.md §0, §1, §5, §7` | Integrity-not-absolutism; local-first/zero-collection default; no dark patterns; literally-true claims — the ethical substrate of the UX. |
| `ETHOS.md C5.5, C8.2` | Claims literally true; `0x00` only on genuine zero-state — honesty is structurally enforced. |
| `BRAND.md §4` (Mirror voice) | "Your career, understood honestly. … Nothing leaves your device." — voice + UX in practice. |
| Images: Nothing phones, Modpods, OP-1, TX-6 | Honesty-as-aesthetic (exposed chassis), ownership/colour-reskin family, restrained single-signal accent — the philosophy made physical. |

---

*End of dossier. Agent 1 remains available to answer follow-up questions from Agents 2–4.*
