---
name: Enclosure
description: A tactile industrial hardware design system — machined aluminium faceplate, panels joined by seams, one loud safety-orange signal.
colors:
  # ── Primary: Safety Orange Signal ──
  safety-orange: "#ff570f"
  safety-orange-hover: "#ff6929"
  safety-orange-pressed: "#e6410a"
  burnt-orange-ink: "#b63c0c"
  dark-on-orange: "#29140a"
  # ── Neutral: Surface Ramp (Aluminium Finishes) ──
  machined-aluminium-field: "#d3d8de"
  sunken-aluminium: "#c5cbd3"
  polished-white-panel: "#f9fafb"
  brushed-aluminium-panel: "#eaedf0"
  bare-aluminium: "#dce0e5"
  recessed-well: "#e2e5e9"
  warm-aluminium-hover: "#e1e5ea"
  pressed-aluminium: "#d6dbe1"
  # ── Neutral: Console / LCD Cavity ──
  lcd-cavity: "#15181e"
  lcd-border: "#21242c"
  lcd-seam: "#3a404a"
  # ── Neutral: Ink (Text Hierarchy) ──
  etched-black: "#161a22"
  engraved-grey: "#444a55"
  silkscreen-grey: "#6b7380"
  faded-mark: "#9097a2"
  white-on-black: "#eaedf0"
  dim-console-text: "#949da8"
  on-ink-white: "#f9fafb"
  # ── Neutral: Seams & Lines ──
  panel-seam: "#b1b9c4"
  hairline-seam: "#c5cbd3"
  structural-seam: "#8996a9"
  ink-seam: "#161a22"
  # ── Semantic ──
  signal-green: "#35825c"
  signal-amber: "#dc8f09"
  signal-red: "#e3291c"
  signal-blue: "#287ab8"
typography:
  display:
    fontFamily: "ClashDisplay-Variable, ClashDisplay, Archivo, system-ui, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "Chillax-Variable, Chillax, system-ui, sans-serif"
    fontWeight: 400
  mono:
    fontFamily: "ui-monospace, Cascadia Mono, Cascadia Code, Consolas, SFMono-Regular, Menlo, JetBrains Mono, monospace"
    fontWeight: 500
rounded:
  sm: "3px"
  md: "5px"
  lg: "10px"
  xl: "16px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  20: "80px"
components:
  button-accent:
    backgroundColor: "{colors.safety-orange}"
    textColor: "{colors.dark-on-orange}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
    typography: "{typography.body}"
  button-accent-hover:
    backgroundColor: "{colors.safety-orange-hover}"
  button-primary:
    backgroundColor: "{colors.etched-black}"
    textColor: "{colors.on-ink-white}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
    typography: "{typography.body}"
  button-default:
    backgroundColor: "linear-gradient(180deg, #FCFDFE 0%, #EEF1F5 48%, #DFE3E9 100%)"
    textColor: "{colors.etched-black}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.engraved-grey}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  input:
    backgroundColor: "{colors.recessed-well}"
    textColor: "{colors.etched-black}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 12px"
  panel:
    backgroundColor: "{colors.polished-white-panel}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: Enclosure

## 1. Overview

**Creative North Star: "The Calibrated Faceplate"**

Enclosure is a design system for interfaces that feel like the front panel of a precision-machined modular synthesiser. The default theme is a light aluminium field — cool, bright, tool-like — with polished white cells joined by crisp 1px seams. A single loud accent signal (safety-orange) cuts through the monochrome: primary actions, focus rings, the checked toggle, the glowing LCD readout. The dark theme (`data-theme="dark"`) inverts to a gunmetal console for night sessions, keeping the same hue character and the same accent pulse.

The system is driven by a **seed architecture**: six CSS custom properties (`--nc-seed-h`, `--nc-seed-s`, `--nc-seed-l` for the background material and `--nc-accent-h`, `--nc-accent-s`, `--nc-accent-l` for the chromatic signal) control every color token through `hsl()` + `calc()` derivations. Change two color pickers, retheme the entire system. The seed is the API. Current seed values: seed hue=214, seed saturation=14%, seed lightness=85%; accent hue=18, accent saturation=100%, accent lightness=53%.

The personality is surgical, industrial, and tactile. Typography runs at extreme contrast: ClashDisplay set huge and tight for display numerals and headings, Chillax for body, and a system monospace stack for the tiny wide-tracked uppercase labels that carry the technical voice. Material simulation — brushed metal gradients, edge bevels that flip on press, fractal noise textures — sells the physicality without decoration.

This system explicitly rejects: floating cards, box-shadow elevation, gradients as decoration, glassmorphism, hero-metric SaaS templates, and anything that reads as a Bootstrap or Material Design app. The interface should feel like it was milled from a billet of aluminium and assembled on a workbench, not arranged in a design tool.

**Key Characteristics:**
- Seed-driven: every color derives from 6 channel variables; the theme is programmable
- Light-first: default is a bright machined aluminium field; dark is a gunmetal console
- Seam grammar: 1px borders and tonal shifts separate surfaces; nothing floats
- Metal materials: gradients, textures, and edge bevels simulate machined metal, not elevation
- Accent signal: the single chromatic signal — loud, industrial, used on ≤10% of any screen
- Extreme type contrast: enormous tight display against tiny wide-tracked monospace labels
- Hardware controls: knobs, switches, faders, keycaps, toggles — the interface feels operable

## 2. Colors: The Metal + Signal Palette

The neutrals are strictly aluminium finishes — raw, brushed, polished, anodised. The accent is industrial — not decorative, functional. Like a warning label on a machine, its loudness is the point.

Every color is derived from the seed channels. Changing `--nc-seed-h` from 214 (cool aluminium blue) toward 30 (warm beige) shifts the entire surface ramp toward gold; dropping `--nc-seed-l` from 85 to 30 inverts to dark mode by hand. The palette is a function, not a set of constants. The hex values listed below represent the default light-theme resolved values at the current seed settings.

### Primary

The single chromatic signal. Used on accent buttons, focus rings, active tab underlines, checked toggles/checkboxes/radios, progress bar fills, the glowing LCD readout, knob indicators, and the hatch pattern fill. Appears on ≤10% of any screen. Its loudness is the point — a warning label, not a decoration.

- **Safety Orange** (`safety-orange`): The signal. 100% saturated, never desaturates, never goes pastel. Used for accent buttons, focus rings, active indicators.
- **Safety Orange Hover** (`safety-orange-hover`): Brightened hover state, saturation held at maximum.
- **Safety Orange Pressed** (`safety-orange-pressed`): Darker, slightly hue-shifted active state. Simulates physical depression.
- **Burnt Orange Ink** (`burnt-orange-ink`): Dark accent-colored text on light backgrounds. Section numbers, accent labels, `nc-text-accent`.
- **Dark on Orange** (`dark-on-orange`): Near-black with an accent cast. Text on solid accent backgrounds.

### Neutral: Surface Ramp

The four aluminium finishes that define the spatial hierarchy. Brighter surfaces are closer to the user; darker surfaces are recessed.

- **Machined Aluminium Field** (`machined-aluminium-field`): The page-level background. A cool, faintly blue-grey aluminium with a brushed grain texture overlay.
- **Polished White Panel** (`polished-white-panel`): The brightest surface. Near-white with a cool cast. Cells within modules, standard panels. Reads as a polished faceplate.
- **Brushed Aluminium Panel** (`brushed-aluminium-panel`): Slightly darker panel with the brushed metal gradient. Alternate cell background.
- **Bare Aluminium** (`bare-aluminium`): The lowest panel tier, just above the field. Subtle surface differentiation.
- **Recessed Well** (`recessed-well`): A cutout below the field level. Input fields, textareas, select dropdowns, code blocks, toggle tracks, segmented control backgrounds. The edge-inset bevel reinforces the recession.
- **Warm Aluminium Hover** (`warm-aluminium-hover`): Interactive hover state for panels and rows. Warmer and brighter than the base.
- **Pressed Aluminium** (`pressed-aluminium`): Active/pressed state for interactive panels.
- **Sunken Aluminium** (`sunken-aluminium`): 5% darker than the field. Deep recesses only.

### Neutral: Console / LCD Cavity

These tokens serve a single purpose in the light theme: the black cavity of a display screen. In the dark theme, they invert to become the surface ramp.

- **LCD Cavity** (`lcd-cavity`): Deep near-black with a cool blue cast. Console surfaces, terminal windows, the masthead bar.
- **LCD Border** (`lcd-border`): Slightly lighter console variant. Terminal title bars.
- **LCD Seam** (`lcd-seam`): Borders and lines within console surfaces.

### Neutral: Ink

Text hierarchy on light surfaces, from near-black to barely-there.

- **Etched Black** (`etched-black`): Primary text on light surfaces. Body copy, headings, active states.
- **Engraved Grey** (`engraved-grey`): Secondary text. Captions, breadcrumb ancestors, ghost button text.
- **Silkscreen Grey** (`silkscreen-grey`): Tertiary text. Help text, placeholder text, disabled states.
- **Faded Mark** (`faded-mark`): Quaternary text. The faintest readable ink. Breadcrumb separators, inactive LED dots.
- **White on Black** (`white-on-black`): Primary text on console/LCD surfaces. Near-white with a cool cast.
- **Dim Console Text** (`dim-console-text`): Secondary text on console surfaces. LCD subtitles.
- **On Ink White** (`on-ink-white`): Text on solid ink backgrounds (primary buttons).

### Neutral: Seams & Lines

The spatial grammar. Surfaces are separated by 1px borders, never by shadows.

- **Panel Seam** (`panel-seam`): Standard 1px border between adjacent panels.
- **Hairline Seam** (`hairline-seam`): Lower-contrast border. Table row dividers, subtle separators.
- **Structural Seam** (`structural-seam`): Higher-contrast border. Button borders, input borders, dimension lines.
- **Ink Seam** (`ink-seam`): The boldest framing line. Module outer borders and section header underlines. Uses 1.5px width.

### Semantic

- **Signal Green** (`signal-green`): Success states, "online" LED.
- **Signal Amber** (`signal-amber`): Warning states, warning LED.
- **Signal Red** (`signal-red`): Error/danger states, error LED, terminal close-dot.
- **Signal Blue** (`signal-blue`): Info states.

Each semantic color has a `-subtle` variant at ~12% opacity for badge and alert backgrounds.

### Material Tokens

These are CSS compositions, not simple color values. They live in the CSS as custom properties and are documented in the sidecar rather than the frontmatter, since Stitch's schema cannot hold gradients or textures.

- **Metal Key** (`--nc-metal-key`): 180deg linear gradient. Near-white catch-light through warm aluminium to bare metal. The top face of a machined keycap.
- **Brushed Disc** (`--nc-metal-brushed`): Radial + conic gradient composite. Circular brushing on a rotary knob.
- **Brushed Grain** (`--nc-grain-brushed`): 2px repeating linear gradient overlay. Horizontal grain on raised panels.
- **Fractal Noise** (`--nc-texture-noise`): SVG turbulence filter at 5% opacity. Breaks flat colour fields.
- **Edge Raised** (`--nc-edge-raised`): 1px top catch-light + subtle bottom shadow. Convex bevel.
- **Edge Inset** (`--nc-edge-inset`): 1-2px top inner shadow + subtle bottom catch-light. Concave recess.

### Named Rules

**The Seed Rule.** Every color token derives from six channel variables (`--nc-seed-h/s/l`, `--nc-accent-h/s/l`). Never hardcode a color in a component; reference the token. To retheme, change the seeds.

**The Accent Rule.** The accent is a 100% saturated signal color. It never desaturates, never shifts hue dramatically, never goes pastel. Its loudness is functional, not decorative. Use on ≤10% of any screen.

**The Metal Finishes Rule.** The surface ramp has exactly four finishes: raw field, bare aluminium, brushed panel, polished white. Darker surfaces are recessed (inset, console); lighter surfaces are raised (panel, polished). If you need a fifth surface, you've misused one of the four.

## 3. Typography

**Display Font:** ClashDisplay-Variable (with ClashDisplay, Archivo, system-ui fallbacks)
**Body Font:** Chillax-Variable (with Chillax, system-ui fallbacks)
**Mono Font:** System monospace stack (ui-monospace, Cascadia Mono/Code, Consolas, SF Mono, Menlo, JetBrains Mono)

**Character:** The typographic voice is extreme contrast. ClashDisplay is deployed at enormous sizes with tight negative tracking for display numerals and headings — it reads like a brand mark etched into a faceplate. Chillax is warmer and more readable at operational sizes. The monospace stack anchors the technical voice: tiny (11px), wide-tracked (0.14em), uppercase labels that read as silkscreened annotations on a control panel. The three faces never swap roles.

### Hierarchy

- **Display / Readout** (Bold 700, clamp(3.5rem, 8vw, 6rem) to clamp(5rem, 14vw, 11rem), line-height 1.0, tracking -0.035em): Hero masthead titles and giant numeral readouts. ClashDisplay only. The biggest thing on the page by a factor of 2. Applied via `.nc-display` and `.nc-readout`.
- **Heading 1** (Bold 700, 3.25rem / 52px, line-height 1.08, tracking -0.035em): Page-level headings. Once per view. `.nc-heading-1`.
- **Heading 2** (Bold 700, 2.25rem / 36px, line-height 1.08, tracking -0.035em): Section headers. `.nc-heading-2`.
- **Heading 3** (Semibold 600, 1.75rem / 28px, line-height 1.08, tracking -0.015em): Sub-section headers. `.nc-heading-3`.
- **Heading 4** (Semibold 600, 1.375rem / 22px, line-height 1.08, tracking -0.015em): Card and panel titles. `.nc-heading-4`.
- **Body** (Regular 400, 0.875rem / 14px, line-height 1.5): All body copy, form labels, table cells. Chillax. Max line length 65ch for prose.
- **Small / Caption** (Regular 400, 0.8125rem / 13px): Secondary information, captions. `.nc-caption`.
- **Label** (Medium 500, 0.6875rem / 11px, line-height 1.4, tracking 0.14em, uppercase): The technical voice. Section kickers, field labels, table headers, badge text. Always monospace, always uppercase, always wide-tracked. `.nc-label`.
- **Part Number** (Medium 500, 0.6875rem / 11px, tracking 0.04em): Narrower tracking variant for part numbers and spec labels. `.nc-partno`.
- **Code / KBD** (Regular 400, 0.92em, monospace): Inline code on an inset background with accent color. KBD elements get the metal key gradient and edge-raised bevel.
- **LCD** (Medium 500, monospace, tracking 0.04em): Console text with accent glow (`text-shadow: 0 0 8px`). Timecode, frequency readouts, status values. Tabular-nums for aligned digits. `.nc-lcd`.

### Scale Ratio

The type scale extends across 10 steps from 11px to 11rem, using a roughly 1.25–1.33 ratio between adjacent steps. The jump from body (14px) to display (52px+) is deliberately violent — the system does not do gentle hierarchy.

### Named Rules

**The Three-Face Rule.** ClashDisplay for display/headings. Chillax for body/buttons/operational text. Monospace for technical labels/annotations. Never swap. A heading in Chillax loses the architectural voice; a label in ClashDisplay reads as a branding mistake; a button in monospace reads as a terminal command.

**The Tight/Loose Rule.** The larger the type, the tighter the tracking. Display numerals at -0.035em. Body at 0. Labels at +0.14em. The contrast in tracking is as important as the contrast in size.

## 4. Elevation

Enclosure conveys depth through **panel assembly**, not shadow elevation. Surfaces butt against each other at 1px seams; brighter surfaces sit closer to the user. The surface hierarchy is: sunken field → bare aluminium → brushed panel → polished white (closest to user), with recessed well and LCD cavity cutting below the field.

### Physical Bevels, Not Depth

Box-shadow is permitted only as **edge lighting** — the way light catches a machined bevel on physical hardware. Two bevel tokens serve the entire system:

- **Edge Raised** (`--nc-edge-raised`): `inset 0 1px 0 hsl(0 0% 100% / 0.7), inset 0 -1px 0 hsl(220 20% 30% / 0.12)`. A bright top catch-light and a subtle bottom shadow. Applied to buttons, keycaps, knobs, raised panels, and avatars. Simulates a convex surface catching overhead light.
- **Edge Inset** (`--nc-edge-inset`): `inset 0 1px 2px hsl(220 20% 20% / 0.16), inset 0 -1px 0 hsl(0 0% 100% / 0.5)`. A dark top shadow and a subtle bottom catch-light. Applied to input fields, toggle tracks, inset panels, and the segmented control background. Simulates a concave recess.

These bevels **flip on press**: a button uses Edge Raised at rest and Edge Inset on `:active`, simulating physical depression. This is the system's primary tactile feedback mechanism.

### The Dark Theme

In the dark theme (`data-theme="dark"`), the surface ramp inverts: the field drops to 13% lightness, panels sit at 14–18%, and the console tokens (7–11%) become the deepest recesses. The edge bevels adjust: raised top catch-light drops from 70% to 8% opacity, and the inset shadow deepens. The grammar is identical; the values are inverted.

### Named Rules

**The Bevel-Only Rule.** Box-shadow is permitted exclusively for edge bevels (`--nc-edge-raised`, `--nc-edge-inset`). No drop shadows, no ambient shadows, no glow-as-elevation, no blur-based depth. If a shadow doesn't simulate light hitting a machined edge, it doesn't belong.

**The Press-Flip Rule.** Interactive elements that use Edge Raised at rest must flip to Edge Inset on `:active`. The bevel reversal is the tactile confirmation — no ripple, no color pulse, no scale bounce. A physical key doesn't glow when pressed; it sinks.

## 5. Components

### Buttons & Keys

**Character:** Machined switchgear. Default buttons are metal keys with a gradient face and edge bevel; accent buttons are solid with a subtle top catch-light. All buttons press down: the gradient inverts and the bevel flips from raised to inset.

- **Shape:** 5px border radius (`{rounded.md}`). Icon buttons are square (width = height). Button groups fuse adjacent buttons with negative margins.
- **Default (`.nc-btn`):** Metal Key gradient background, 1px Structural Seam border, Edge Raised bevel. Hover brightens (brightness 1.03); active inverts to Metal Key Press gradient and Edge Inset bevel with a 1px translateY.
- **Primary (`.nc-btn--primary`):** Solid Etched Black background, On Ink White text, subtle top catch-light. The bold alternative to accent. Hover lightens (brightness 1.18); active gains a dark inner shadow.
- **Accent (`.nc-btn--accent`):** Solid accent background, dark text, semibold weight, subtle top catch-light. The loudest button. Use once per action group. Hover brightens; active darkens and shifts hue slightly.
- **Secondary (`.nc-btn--secondary`):** Transparent background, Ink Seam border, Etched Black text. No bevel. Hover gains Warm Aluminium background.
- **Ghost (`.nc-btn--ghost`):** Fully transparent, no border, no bevel, Engraved Grey text. Gains background on hover.
- **Danger (`.nc-btn--danger`):** Signal Red background, white text. For destructive actions.
- **Sizes:** Small (28px, `.nc-btn--sm`), Medium (36px, default), Large (44px, `.nc-btn--lg`).
- **Disabled:** 40% opacity, pointer-events none.
- **Keycap (`.nc-key`):** Square machined key. Metal Key gradient, 1px Structural Seam border, Edge Raised bevel. Mono font. Active sinks 2px (translateY) and flips to Edge Inset. Accent variant swaps to accent fill.
- **Button Group (`.nc-btn-group`):** Fused inline-flex. Adjacent buttons share borders. First and last children get radius; inner buttons are square.

### Tactile Controls

**Character:** Hardware-feeling input controls that simulate physical components. Each has a distinct mechanical metaphor.

- **Toggle (`.nc-toggle`):** 40×22px track with an 18px circular thumb. Recessed Well track with Edge Inset bevel. Thumb uses Metal Key gradient with Edge Raised bevel. Checked state fills the track with the accent color and snaps the thumb 18px right (120ms press transition with slight overshoot: `cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Switch (`.nc-switch`):** 38×62px vertical slot with a 26px lever. Recessed Well background with Edge Inset. Lever in Metal Key gradient with Edge Raised. The `.is-on` state moves the lever from top (4px) to bottom (28px) and fills it with the accent color.
- **Knob (`.nc-knob`):** 72×72px circular control. Brushed Disc conic+radial gradient background, Edge Raised bevel, subtle drop shadow for physical presence. A 3px accent indicator line rotates via `--nc-knob-angle`. Inner disc (14px inset) with recessed bevel. Grab/grabbing cursor.
- **Fader (`.nc-fader`):** Vertical range input 26×110px. Custom track (6px wide, Recessed Well with Edge Inset) and thumb (26×16px, Metal Key gradient with Edge Raised).
- **Segmented Control (`.nc-segment`):** Inline-flex of fused buttons inside a Recessed Well with Edge Inset. Inactive segments are transparent with Silkscreen Grey text; active segment gets the Polished White Panel background with Edge Raised bevel. Mono font, uppercase, wide-tracked.

### Inputs & Forms

**Character:** Recessed cutouts. Inputs feel like engraved labels on a control panel — the well is cut into the surface, and focus adds an accent rim.

- **Shape:** 5px border radius (`{rounded.md}`). Full width by default. 36px height. 12px horizontal padding.
- **Default (`.nc-input`, `.nc-textarea`, `.nc-select`):** Recessed Well background, 1px Structural Seam border, Edge Inset bevel. Etched Black text. Placeholder in Faded Mark.
- **Hover:** Border shifts to Ink Seam.
- **Focus:** Border shifts to the accent color; adds a 2px accent-subtle (12% opacity) outer glow. Outline: none (the accent border IS the focus indicator).
- **Disabled:** 50% opacity.
- **Sizes:** Small (28px), Medium (36px), Large (44px).
- **Textarea (`.nc-textarea`):** No fixed height; min-height 84px; vertical resize only.
- **Select (`.nc-select`):** Custom chevron arrow (inline SVG), right-aligned. Appearance reset.
- **Field Group (`.nc-field`):** Vertical flex stack with 4px gap. Label uses mono 11px uppercase wide-tracked Silkscreen Grey. Optional help text in 12px.

### Checkboxes & Radios

- **Shape:** 18×18px. Checkbox: 3px radius (`{rounded.sm}`). Radio: fully round.
- **Default:** Recessed Well background, 1px Structural Seam border, Edge Inset bevel.
- **Checked (checkbox):** Accent fill with a white SVG checkmark path.
- **Checked (radio):** Recessed Well background with accent border and a 4px inner accent dot (inset box-shadow).
- **Hover:** Border shifts to Ink Seam.

### Surfaces & Modules

**Character:** The "device chassis" grammar. A module is a framed object with a generous outer radius; inside, cells are joined by sharp seams.

- **Module (`.nc-module`):** Machined Aluminium Field background, 1.5px Ink Seam border, 16px border radius (`{rounded.xl}`). Overflow hidden. The outermost container.
- **Grid (`.nc-grid`):** CSS Grid with 1px gap. The gap shows through as the Panel Seam color, creating hairline divisions between cells. Columns controlled by `--nc-cols`.
- **Cell (`.nc-cell`):** Polished White Panel background, 20px padding. Variants: `--2` (Brushed Aluminium), `--dark` (LCD Cavity with inverted text), `--accent` (Accent solid with noise texture overlay), `--brushed` (Brushed Disc gradient).
- **Panel (`.nc-panel`):** Polished White Panel background, 1px Panel Seam border, 5px radius (`{rounded.md}`), 16px padding, Edge Raised bevel.
- **Panel Raised (`.nc-panel--raised`):** Same background with Brushed Grain texture overlay.
- **Panel Inset (`.nc-panel--inset`):** Recessed Well background, Hairline Seam border, Edge Inset bevel.
- **Panel Interactive (`.nc-panel--interactive`):** Cursor pointer. Hover shifts to Warm Aluminium background and Structural Seam border. Active shifts to Pressed Aluminium.

### Console / LCD

**Character:** The black display cavity. A separate visual world for readouts, terminals, and status displays.

- **Console (`.nc-console`):** LCD Cavity background, 1px LCD Seam border, 5px radius, 16px padding, Edge Inset bevel. White on Black text.
- **Scanline (`.nc-console--scan`):** A `::after` pseudo-element with a repeating horizontal line pattern. Simulates CRT scanlines.
- **LCD Text (`.nc-lcd`):** Monospace, medium weight, 0.04em tracking, accent color with an 8px accent text-shadow glow. Tabular-nums. Large variant (`--lg`) at 2.25rem. Green variant swaps to green phosphor.
- **LCD Subtitle (`.nc-lcd-sub`):** Monospace, 11px, uppercase, wide-tracked, Dim Console Text.
- **Terminal (`.nc-terminal`):** LCD Cavity background with a title bar (LCD Border, traffic-light dots in Signal Red/Amber/Green, mono title). Body with mono pre-formatted text. Amber and green color variants.
- **Dot Matrix (`.nc-matrix`):** CSS Grid of circular dots. Dots are LCD Seam color by default; `.is-on` dots glow in the accent color.
- **Bar Meters (`.nc-meters`):** Inline-flex of vertical bars (7px wide). Plain bars are Etched Black (auto-invert on console). Accent bars use the accent color.

### Data Display

- **Readout (`.nc-readout`):** Giant display numerals. ClashDisplay Bold at 6xl size (clamp(5rem, 14vw, 11rem)), line-height 1.0, tracking -0.035em, tabular-nums. Accent variant in accent ink color.
- **Spec (`.nc-spec`):** A labelled value pair. Label: mono 11px uppercase wide-tracked Silkscreen Grey. Value: mono 16px medium Etched Black, tabular-nums.
- **Spec Strip (`.nc-spec-strip`):** Horizontal flex row of spec cells separated by 1px vertical Panel Seam hairlines with a top border.
- **LED (`.nc-led`):** Inline status indicator. 9px circular dot with optional glow. Variants: on (Signal Green + glow), rec (Accent + glow), warn (Signal Amber + glow), err (Signal Red + glow).
- **Badge (`.nc-badge`):** 20px-tall inline label. Mono 11px medium, uppercase, 0.04em tracking. Brushed Aluminium background, 1px Panel Seam border, 3px radius. Accent and semantic variants available.
- **Pill (`.nc-pill`):** Badge with fully round ends (9999px radius).
- **Progress (`.nc-progress`):** 6px tall track. Recessed Well background, 1px Panel Seam border, fully round, Edge Inset bevel. Fill bar in accent or semantic color. 280ms ease transition.
- **Table (`.nc-table`):** Separate border model, 5px radius overflow hidden. Header: Bare Aluminium background, mono 11px uppercase labels. Rows: 1px Hairline Seam dividers. Hover highlights the full row in Warm Aluminium.

### Feedback

- **Alert (`.nc-alert`):** Flex row with 12×16px padding, 5px radius. 1px Panel Seam border with a 3px left border in the semantic color. Background: 12% semantic tint. Icon via `::before` pseudo-element. The left-border accent is the ONE exception to the ban on side-stripe borders — it is a functional severity indicator, not decoration.

### Navigation

- **Tabs (`.nc-tabs`):** Horizontal flex row with a 1px Panel Seam bottom border. Tabs: mono 12px medium, uppercase, 0.04em tracking, 8×16px padding, 2px transparent bottom border. Active tab: Etched Black text, 2px accent bottom border.
- **Breadcrumbs (`.nc-breadcrumbs`):** Horizontal flex row, 8px gap, slash separator in Faded Mark. Mono 12px, 0.04em tracking.

### Technical Marks

- **Divider (`.nc-divider`):** 1px horizontal rule in Panel Seam, 24px vertical margin. Subtle variant in Hairline Seam.
- **Schematic Divider (`.nc-schematic`):** Labelled rule. Mono 11px uppercase wide-tracked text flanked by 1px Structural Seam lines.
- **Dimension Line (`.nc-dimension`):** Horizontal measure with end ticks.
- **Registration Mark (`.nc-reg`):** 16×16px crosshair. 1px Silkscreen Grey lines centered.
- **Hatch (`.nc-hatch`):** Accent background with a 45deg Etched Black stripe pattern.
- **Barcode (`.nc-barcode`):** 36px-tall CSS-only barcode using repeating linear gradients.
- **Screw (`.nc-screw`):** 10×10px circular decorative fastener. Radial gradient with a 42deg slot line. Four position modifiers.

### Misc

- **Avatar (`.nc-avatar`):** 36px circle. Display font initials, Metal Key gradient, 1px Structural Seam border, Edge Raised bevel. Sizes: sm (26px), md (36px), lg (46px).
- **Tooltip (`.nc-tooltip`):** Pure CSS via `::after` on `data-tooltip`. Etched Black background, White on Black text, 3px radius.
- **Row / Stack (`.nc-row`, `.nc-stack`):** Flex layout utilities. Row: horizontal with 12px gap and wrap. Stack: vertical column with gap variants.

### Layout Utilities

The system includes a set of `nc-` prefixed utility classes for container, display, positioning, flex children, flex alignment, sizing, text alignment, overflow, spacing, gap, grid, borders, radius, and cursor — documented in `src/styles/global.css`. These fill the gap for common layout patterns that the component classes don't cover, keeping the markup self-contained without a separate utility framework.

### Dark Theme

Every component adapts to the dark theme automatically through the token system. The `[data-theme="dark"]` block redefines all surface, ink, line, console, accent, semantic, and material tokens using the same seed H/S channels but pinned to dark lightness values. Components reference tokens, not hardcoded values, so they follow. The accent brightens slightly (L+3) to maintain signal strength against dark backgrounds.

### Named Rules

**The Token-Only Rule.** Components reference CSS custom properties exclusively. No hardcoded colors, radii, spacing, or font stacks in component rules. A component that references a hex value directly is a bug.

**The Dark-Auto Rule.** Every component works in both themes without a single theme-specific selector. The `[data-theme="dark"]` block only redefines tokens, never components. If a component needs a dark-theme override, the token is wrong, not the component.

## 6. Do's and Don'ts

### Do:

- **Do** separate surfaces with 1px seam borders (`--nc-line`, `--nc-line-subtle`, `--nc-line-strong`) or tonal background shifts. The seam is the system's primary spatial grammar.
- **Do** use the accent color on ≤10% of any screen. A primary button, or a focus ring, or a checked toggle — never all three competing. Its loudness IS the point; overuse destroys the signal.
- **Do** use the four aluminium finishes (raw field, bare aluminium, brushed panel, polished white) consistently. Brighter surfaces are closer to the user.
- **Do** set inputs on the Recessed Well background (`--nc-inset`) with the Edge Inset bevel. The cutout IS the affordance.
- **Do** use ClashDisplay for display numerals and headings, Chillax for body and operational text, monospace for technical labels. The three-face rule is non-negotiable.
- **Do** flip Edge Raised to Edge Inset on `:active` for all pressable elements. The bevel reversal is the tactile confirmation.
- **Do** use the seed channels to customize the theme. Change `--nc-seed-h/s/l` and `--nc-accent-h/s/l` on `:root`; every component follows.
- **Do** keep transitions at 90–280ms. State changes feel immediate (90ms fast, 160ms normal, 280ms slow for fills). The tactile press transition uses a slight overshoot curve (120ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Do** target WCAG 2.1 AA contrast. Etched Black on Polished White achieves ~13:1. Text on accent achieves ~10:1.
- **Do** use the `prefers-reduced-motion` media query to collapse all transitions to 0.01ms.

### Don't:

- **Don't** use box-shadow for elevation. The only permitted shadows are the physical edge bevels (`--nc-edge-raised`, `--nc-edge-inset`). No drop shadows, no ambient shadows, no glow-as-elevation.
- **Don't** use gradients decoratively. The metal gradients (`--nc-metal-key`, `--nc-metal-brushed`, `--nc-grain-brushed`) simulate machined surfaces. No gradient washes, no gradient text, no gradient backgrounds for visual effect.
- **Don't** use glassmorphism, backdrop-filter blur, or transparency effects. The interface is opaque aluminium, not glass.
- **Don't** add decorative motion. Transitions serve state changes only. No page-load choreography, no hover bounce (the overshoot curve on toggle/button press is mechanical feedback, not decoration), no scroll-triggered reveals.
- **Don't** use rounded corners above 16px (`{rounded.xl}`) except for fully round elements (badge pills, avatars, knobs). The system is machined, not molded. Tight radii read as precision manufacturing.
- **Don't** hardcode a color value in any component rule. Every visual decision flows through CSS custom properties. Hardcoded hexes or HSL values in component CSS are a bug.
- **Don't** place ClashDisplay in buttons, inputs, labels, or operational text. Display fonts in functional UI read as a branding mistake.
- **Don't** use the accent color as decoration. It marks primary actions, current selection, focus, and the active signal. Nothing else earns it.
- **Don't** add a fifth surface finish. The four-finish ramp (raw field, bare aluminium, brushed panel, polished white) plus recessed well and LCD cavity are the complete vocabulary.
- **Don't** use Material Design patterns: no floating action buttons, no ripple effects, no elevation-based shadow hierarchy. If it looks like a Google app, it's wrong.
- **Don't** use generic SaaS template patterns: no hero-metric dashboards (big number + small label + sparkline), no icon-above-heading card grids, no purple-to-blue gradients. If it looks like every startup landing page, it's wrong.
- **Don't** be deliberately raw or brutalist. Industrial means precision-machined, not crude. The system is considered and surgical, not confrontational.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards, list items, or callouts. The alert component's 3px left border is the sole exception — a functional severity indicator, not decoration.
