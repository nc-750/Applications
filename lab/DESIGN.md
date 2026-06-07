---
name: Lab
description: The Lab design system — machine-documentation instrument panels. A framed chassis of cells joined by 1px seams; diagrams and readouts on recessed drafting plates; one loud signal, never decoration; identity is structural, not chromatic.
colors:
  # ── Surface Ramp (Aluminium Finishes) ──
  machined-aluminium-field: "#D3D8DE"   # neutral-bg
  sunken-aluminium: "#C8CED5"           # neutral-bg-sunken
  polished-white-panel: "#F7F9FB"       # neutral-surface
  brushed-aluminium-panel: "#EAEDF1"    # neutral-surface-alt
  bare-aluminium: "#DCE0E5"             # neutral-surface-low
  recessed-well: "#E1E4E9"              # neutral-inset
  warm-aluminium-hover: "#E1E5EA"       # neutral-hover
  pressed-aluminium: "#D7DCE2"          # neutral-active
  # ── Console / LCD Cavity ──
  lcd-cavity: "#16181D"                 # neutral-console
  lcd-border: "#21242A"                 # neutral-console-alt
  lcd-seam: "#3A3E45"                   # neutral-console-line
  # ── Ink (Text on Light) ──
  etched-black: "#161A1F"               # neutral-text
  engraved-grey: "#444A52"              # neutral-text-secondary
  silkscreen-grey: "#6B727B"            # neutral-text-muted
  faded-mark: "#8D949C"                 # neutral-text-faint
  white-on-black: "#E8ECF1"             # neutral-text-invert
  dim-console-text: "#949BA3"           # neutral-text-invert-secondary
  on-ink-white: "#F7F9FB"               # neutral-on-ink
  # ── Seams / Lines ──
  panel-seam: "#B3B9C1"                 # neutral-border
  hairline-seam: "#C6CCD3"              # neutral-border-subtle
  structural-seam: "#8B94A1"            # neutral-border-strong
  ink-seam: "#161A1F"                   # neutral-border-ink
  # ── Accent (Safety Orange) ──
  safety-orange: "#FF570F"              # primary
  safety-orange-hover: "#FF6B1F"        # primary-hover
  safety-orange-pressed: "#E6490A"      # primary-active
  burnt-orange-ink: "#B33D0A"           # primary-text
  dark-on-orange: "#29140A"             # primary-on
  # ── Semantic ──
  signal-green: "#3D8C62"               # semantic-success
  signal-amber: "#D4950E"               # semantic-warning
  signal-red: "#D13B3B"                 # semantic-error
  signal-blue: "#3B7DBF"                # semantic-info
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
  drafting-plate:
    backgroundColor: "{colors.recessed-well}"
    rounded: "{rounded.md}"
    padding: "{spacing.5}"
  facet-tag:
    backgroundColor: "{colors.recessed-well}"
    textColor: "{colors.burnt-orange-ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.sm}"
    padding: "4px 9px"
  coverage-meter:
    backgroundColor: "{colors.recessed-well}"
    rounded: "{rounded.full}"
    height: "7px"
  glyph:
    textColor: "{colors.engraved-grey}"
    size: "34px"
---

# Design System: Lab

## 1. Overview

**Creative North Star: "The Calibrated Faceplate"**

Lab is the NC-750 design system — **machine-documentation instrument panels**. Interfaces feel like the front panel of a precision instrument, documented like a technical manual, and are built from three grammars: a framed **chassis**, a **document** layer (schematics, specs, the `0x00` null mark), and an **instrument** layer (live readouts). See `../brand/VISUAL_IDENTITY.md` for the worldview and `DESIGN_USE.md` for how to apply it. The default theme is a light aluminium field — cool, bright, tool-like — with polished white cells joined by crisp 1px seams. A single loud safety-orange signal (#FF570F) cuts through the monochrome: primary actions, focus rings, the checked toggle, the glowing LCD readout. The dark theme (`data-theme="dark"`) inverts to a gunmetal console for night sessions, keeping the same hue character and the same orange pulse.

The system is driven by a **seed architecture**: six CSS custom properties (`--nc-seed-h`, `--nc-seed-s`, `--nc-seed-l` for the background material and `--nc-accent-h`, `--nc-accent-s`, `--nc-accent-l` for the chromatic signal) control every color token through `hsl()` + `calc()` derivations. Change two color pickers, retheme the entire system. The seed is the API.

The personality is surgical, industrial, and tactile. Typography runs at extreme contrast: ClashDisplay set huge and tight for display numerals and headings, Chillax for body, and a system monospace stack for the tiny wide-tracked uppercase labels that carry the technical voice. Material simulation — brushed metal gradients, edge bevels that flip on press, fractal noise textures — sells the physicality without decoration.

This system explicitly rejects: floating cards, box-shadow elevation, gradients as decoration, glassmorphism, hero-metric SaaS templates, and anything that reads as a Bootstrap or Material Design app. The interface should feel like it was milled from a billet of aluminium and assembled on a workbench, not arranged in a design tool.

**Key Characteristics:**
- Seed-driven: every color derives from 6 channel variables; the theme is programmable
- Light-first: default is a bright machined aluminium field; dark is a gunmetal console
- Seam grammar: 1px borders and tonal shifts separate surfaces; nothing floats
- Metal materials: gradients, textures, and edge bevels simulate machined metal, not elevation
- Safety orange: the single chromatic signal — loud, industrial, used on ≤10% of any screen
- Extreme type contrast: enormous tight display against tiny wide-tracked monospace labels
- Hardware controls: knobs, switches, faders, keycaps, toggles — the interface feels operable

## 2. Colors: The Metal + Signal Palette

The neutrals are strictly aluminium finishes — raw, brushed, polished, anodised. The accent is industrial safety orange — not decorative, functional. Like a warning label on a machine, its loudness is the point.

Every color is derived from the seed channels. Changing `--nc-seed-h` from 214 (cool aluminium blue) toward 30 (warm beige) shifts the entire surface ramp toward gold; dropping `--nc-seed-l` from 85 to 30 inverts to dark mode by hand. The palette is a function, not a set of constants.

### Primary

- **Safety Orange** (#FF570F, hsl(18, 100%, 53%)): The single chromatic signal. Used on accent buttons, focus rings, active tab underlines, checked toggles/checkboxes/radios, progress bar fills, the glowing LCD readout, knob indicators, and the hatch pattern fill. Appears on ≤10% of any screen. Its loudness is the point — it's a warning label, not a decoration.
- **Safety Orange Hover** (#FF6B1F, hsl(18, 100%, 58%)): Brightened hover state. Keeps the saturation at 100% — the accent never desaturates.
- **Safety Orange Pressed** (#E6490A, hsl(15, 92%, 47%)): Darker, slightly red-shifted active state. Simulates the physical depression of a button.
- **Burnt Orange Ink** (#B33D0A, hsl(17, 88%, 38%)): Dark orange for accent-colored text on light backgrounds. Used for `nc-text-accent`, section numbers, accent labels.
- **Dark on Orange** (#29140A, hsl(20, 60%, 10%)): Near-black with an orange cast. Used for text on solid orange backgrounds (accent buttons, accent badges, accent cells).

### Neutral: Surface Ramp (Aluminium Finishes)

- **Machined Aluminium Field** (#D3D8DE, hsl(214, 14%, 85%)): The page-level background. A cool, faintly blue-grey aluminium. The brushed grain texture overlays this. Everything sits on this field.
- **Sunken Aluminium** (#C8CED5, hsl(214, 14%, 80%)): 5% darker than the field. Used sparingly for deep recesses.
- **Polished White Panel** (#F7F9FB, hsl(210, 22%, 98%)): The brightest surface in the light theme. Near-white with a cool cast. Used for cells within modules, standard panels. Reads as a polished aluminium faceplate.
- **Brushed Aluminium Panel** (#EAEDF1, hsl(212, 16%, 93%)): Slightly darker panel variant with the brushed metal gradient. Used for the alternate cell background and brushed panel surfaces.
- **Bare Aluminium** (#DCE0E5, hsl(214, 14%, 88%)): The lowest panel tier, just above the field. Used for subtle surface differentiation.
- **Recessed Well** (#E1E4E9, hsl(214, 13%, 90%)): A cutout below the field level. Used for input fields, textareas, select dropdowns, code blocks, inset panels, toggle tracks, and the segmented control background. The edge-inset bevel reinforces the recession.
- **Warm Aluminium Hover** (#E1E5EA, hsl(212, 16%, 90%)): Interactive hover state for panels and rows. Warmer and slightly brighter than the base.
- **Pressed Aluminium** (#D7DCE2, hsl(212, 16%, 86%)): Active/pressed state for interactive panels.

### Neutral: Console / LCD Cavity

These tokens invert in the dark theme to become the surface ramp, but in the light theme they serve a single purpose: the black cavity of a display screen.

- **LCD Cavity** (#16181D, hsl(220, 16%, 10%)): Deep near-black with a cool blue cast. The background for console surfaces, terminal windows, and the masthead bar.
- **LCD Border** (#21242A, hsl(220, 14%, 15%)): Slightly lighter console variant. Terminal title bars, console-2 cells.
- **LCD Seam** (#3A3E45, hsl(220, 12%, 26%)): Borders and lines within console surfaces.

### Neutral: Ink (Text Hierarchy)

- **Etched Black** (#161A1F, hsl(220, 20%, 11%)): Primary text on light surfaces. Near-black with a cool cast. Used for body copy, headings, active states, primary buttons.
- **Engraved Grey** (#444A52, hsl(218, 11%, 30%)): Secondary text. Captions, breadcrumb ancestors, ghost button text, LED labels.
- **Silkscreen Grey** (#6B727B, hsl(216, 9%, 46%)): Tertiary text. Help text, placeholder text, disabled states, part numbers.
- **Faded Mark** (#8D949C, hsl(216, 9%, 60%)): Quaternary text. The faintest readable ink. Breadcrumb separators, inactive LED dots.
- **White on Black** (#E8ECF1, hsl(210, 18%, 93%)): Primary text on console/LCD surfaces. Near-white with a cool cast.
- **Dim Console Text** (#949BA3, hsl(212, 10%, 62%)): Secondary text on console surfaces. LCD subtitles, terminal titles.
- **On Ink White** (#F7F9FB, hsl(210, 22%, 98%)): Text on solid ink (primary button) backgrounds.

### Neutral: Seams & Lines

- **Panel Seam** (#B3B9C1, hsl(214, 14%, 73%)): Standard 1px border between adjacent panels. The primary spatial grammar.
- **Hairline Seam** (#C6CCD3, hsl(214, 13%, 80%)): Lower-contrast border. Table row dividers, subtle dividers, inset panel borders.
- **Structural Seam** (#8B94A1, hsl(216, 16%, 60%)): Higher-contrast border. Button borders, input borders, schematic divider lines, dimension lines.
- **Ink Seam** (#161A1F, hsl(220, 20%, 11%)): The boldest framing line. Module outer borders and section header underlines. Uses 1.5px width (`--nc-border-ink`).

### Semantic

- **Signal Green** (#3D8C62, hsl(150, 42%, 36%)): Success states. Badge text, alert border, progress bar fill, the "online" LED glow.
- **Signal Amber** (#D4950E, hsl(38, 92%, 45%)): Warning states. Badge text, alert border, progress bar fill, the warning LED glow.
- **Signal Red** (#D13B3B, hsl(4, 78%, 50%)): Error and danger states. Danger button background, error badge text, alert border, the error LED glow, terminal close-dot.
- **Signal Blue** (#3B7DBF, hsl(206, 64%, 44%)): Info states. Info badge text, alert border.

Each semantic color has a `-subtle` variant at ~12% opacity for badge and alert backgrounds.

### Material Tokens (no direct color role — these are CSS compositions)

- **Metal Key** (`--nc-metal-key`): A 180deg linear gradient from near-white catch-light through warm aluminium to bare metal. Simulates the top face of a machined keycap.
- **Metal Key Press** (`--nc-metal-key-press`): The inverted gradient — dark at top, lighter at bottom. Simulates a depressed key.
- **Brushed Disc** (`--nc-metal-brushed`): A radial + conic gradient composite that simulates the circular brushing on a rotary knob.
- **Brushed Grain** (`--nc-grain-brushed`): A 2px repeating linear gradient overlay that adds horizontal grain to raised panels.
- **Fractal Noise** (`--nc-texture-noise`): An SVG turbulence filter overlaid on the page body at 5% opacity. Breaks flat color fields on the aluminium background.
- **Edge Raised** (`--nc-edge-raised`): A 1px top catch-light + subtle bottom shadow. Applied as `box-shadow` to buttons, keys, knobs, and raised panels.
- **Edge Inset** (`--nc-edge-inset`): A 1–2px top inner shadow + subtle bottom catch-light. Applied to inputs, toggle tracks, inset panels, and pressed buttons.

### Named Rules

**The Seed Rule.** Every color token derives from six channel variables (`--nc-seed-h/s/l`, `--nc-accent-h/s/l`). Never hardcode a color in a component; reference the token. To retheme, change the seeds.

**The Safety Orange Rule.** The accent is 100% saturated safety orange. It never desaturates, never shifts hue, never goes pastel. Its loudness is functional, not decorative. Use on ≤10% of any screen.

**The Metal Finishes Rule.** The surface ramp has exactly four finishes: raw field, bare aluminium, brushed panel, polished white. Darker surfaces are recessed (inset, console); lighter surfaces are raised (panel, polished). If you need a fifth surface, you've misused one of the four.

## 3. Typography

**Display Font:** ClashDisplay-Variable (with ClashDisplay, Archivo, system-ui fallbacks)
**Body Font:** Chillax-Variable (with Chillax, system-ui fallbacks)
**Mono Font:** System monospace stack (ui-monospace, Cascadia Mono/Code, Consolas, SF Mono, Menlo, JetBrains Mono)

**Character:** The typographic voice is extreme contrast. ClashDisplay is deployed at enormous sizes with tight negative tracking for display numerals and headings — it reads like a brand mark etched into a faceplate. Chillax is warmer and more readable at operational sizes. The monospace stack anchors the technical voice: tiny (11px), wide-tracked (0.14em), uppercase labels that read as silkscreened annotations on a control panel. The three faces never swap roles.

### Hierarchy

- **Display / Readout** (Bold 700, clamp(3.5rem, 8vw, 6rem) to clamp(5rem, 14vw, 11rem), line-height 1.0, tracking -0.035em): Hero masthead titles and giant numeral readouts. ClashDisplay only. The biggest thing on the page by a factor of 2.
- **Heading 1** (Bold 700, 3.25rem / 52px, line-height 1.08, tracking -0.035em): Page-level headings. Once per view.
- **Heading 2** (Bold 700, 2.25rem / 36px, line-height 1.08, tracking -0.035em): Section headers.
- **Heading 3** (Semibold 600, 1.75rem / 28px, line-height 1.08, tracking -0.015em): Sub-section headers. Tracking relaxes slightly.
- **Heading 4** (Semibold 600, 1.375rem / 22px, line-height 1.08, tracking -0.015em): Card and panel titles.
- **Body** (Regular 400, 0.875rem / 14px, line-height 1.5): All body copy, form labels, table cells. Set in Chillax. Max line length 65ch for prose.
- **Small / Caption** (Regular 400, 0.8125rem / 13px): Secondary information, captions. Chillax.
- **Label** (Medium 500, 0.6875rem / 11px, line-height 1.4, tracking 0.14em, uppercase): The technical voice. Section kickers, field labels, table headers, badge text, part numbers. Always monospace, always uppercase, always wide-tracked. Reads as silkscreened annotations.
- **Part Number** (Medium 500, 0.6875rem / 11px, tracking 0.04em): Narrower tracking variant for part numbers and spec labels. Monospace.
- **Code / KBD** (Regular 400, 0.92em, monospace): Inline code on an inset background with accent color. KBD elements get the metal key gradient and edge-raised bevel.
- **LCD** (Medium 500, monospace, tracking 0.04em): Console text with orange glow (`text-shadow: 0 0 8px`). Used for timecode, frequency readouts, status values. Tabular-nums for aligned digits.

### Scale Ratio

The type scale extends across 10 steps from 11px to 11rem, using a roughly 1.25–1.33 ratio between adjacent steps. The jump from body (14px) to display (52px+) is deliberately violent — the system does not do gentle hierarchy.

### Named Rules

**The Three-Face Rule.** ClashDisplay for display/headings. Chillax for body/buttons/operational text. Monospace for technical labels/annotations. Never swap. A heading in Chillax loses the architectural voice; a label in ClashDisplay reads as a branding mistake; a button in monospace reads as a terminal command.

**The Tight/Loose Rule.** The larger the type, the tighter the tracking. Display numerals at -0.035em. Body at 0. Labels at +0.14em. The contrast in tracking is as important as the contrast in size.

## 4. Elevation

Lab conveys depth through **panel assembly**, not shadow elevation. Surfaces butt against each other at 1px seams; brighter surfaces sit closer to the user. The surface hierarchy is: sunken field → bare aluminium → brushed panel → polished white (closest to user), with recessed well and LCD cavity cutting below the field.

### Physical Bevels, Not Depth

Box-shadow is permitted only as **edge lighting** — the way light catches a machined bevel on physical hardware. Two bevel tokens serve the entire system:

- **Edge Raised** (`--nc-edge-raised`): `inset 0 1px 0 hsl(0 0% 100% / 0.7), inset 0 -1px 0 hsl(220 20% 30% / 0.12)`. A bright top catch-light and a subtle bottom shadow. Applied to buttons, keycaps, knobs, raised panels, and avatars. Simulates a convex surface catching overhead light.
- **Edge Inset** (`--nc-edge-inset`): `inset 0 1px 2px hsl(220 20% 20% / 0.16), inset 0 -1px 0 hsl(0 0% 100% / 0.5)`. A dark top shadow and a subtle bottom catch-light. Applied to input fields, toggle tracks, inset panels, and the segmented control background. Simulates a concave recess.

These bevels **flip on press**: a button uses Edge Raised at rest and Edge Inset on `:active`, simulating physical depression. This is the system's primary tactile feedback mechanism.

### The Dark Theme

In the dark theme (`data-theme="dark"`), the surface ramp inverts: the field drops to 13% lightness, panels sit at 14–18%, and the console tokens (now 7–11%) become the deepest recesses. The edge bevels adjust: raised top catch-light drops from 70% to 8% opacity, and the inset shadow deepens. The grammar is identical; the values are inverted.

### Named Rules

**The Bevel-Only Rule.** Box-shadow is permitted exclusively for edge bevels (`--nc-edge-raised`, `--nc-edge-inset`). No drop shadows, no ambient shadows, no glow-as-elevation, no blur-based depth. If a shadow doesn't simulate light hitting a machined edge, it doesn't belong.

**The Press-Flip Rule.** Interactive elements that use Edge Raised at rest must flip to Edge Inset on `:active`. The bevel reversal is the tactile confirmation — no ripple, no color pulse, no scale bounce. A physical key doesn't glow when pressed; it sinks.

## 5. Components

### Buttons & Keys

**Character:** Machined switchgear. Default buttons are metal keys with a gradient face and edge bevel; accent buttons are solid orange with a subtle top catch-light. All buttons press down: the gradient inverts and the bevel flips from raised to inset.

- **Shape:** 5px border radius (md). Icon buttons are square (width = height). Button groups fuse adjacent buttons with negative margins.
- **Default (.nc-btn):** Metal Key gradient background, 1px Structural Seam border, Edge Raised bevel. The standard action button. Hover brightens (filter: brightness(1.03)); active inverts to Metal Key Press gradient and Edge Inset bevel with a 1px translateY.
- **Primary (.nc-btn--primary):** Solid Etched Black background, On Ink White text, subtle top catch-light. The bold alternative to accent. Hover lightens (brightness 1.18); active gains a dark inner shadow.
- **Accent (.nc-btn--accent):** Solid Safety Orange background, Dark on Orange text, semibold weight, subtle top catch-light. The loudest button. Use once per action group. Hover brightens; active darkens and shifts red.
- **Secondary (.nc-btn--secondary):** Transparent background, Ink Seam border, Etched Black text. No bevel. Hover gains Warm Aluminium background.
- **Ghost (.nc-btn--ghost):** Fully transparent, no border, no bevel, Engraved Grey text. Gains background on hover.
- **Danger (.nc-btn--danger):** Signal Red background, white text. For destructive actions.
- **Sizes:** Small (28px), Medium (36px, default), Large (44px). Padding scales: 12px / 16px / 24px horizontal.
- **Disabled:** 40% opacity, pointer-events none.
- **Keycap (.nc-key):** Square machined key. Metal Key gradient, 1px Structural Seam border, Edge Raised bevel. Mono font. Active sinks 2px (translateY) and flips to Edge Inset. Accent variant swaps to Safety Orange fill.
- **Button Group (.nc-btn-group):** Fused inline-flex. Adjacent buttons share borders (negative margin overlap). First and last children get radius; inner buttons are square.

### Tactile Controls

**Character:** Hardware-feeling input controls that simulate physical components. Each has a distinct mechanical metaphor.

- **Toggle (.nc-toggle):** 40×22px track with an 18px circular thumb. Recessed Well track with Edge Inset bevel. Thumb uses Metal Key gradient with Edge Raised bevel. Checked state fills the track with Safety Orange and snaps the thumb 18px right (120ms press transition with slight overshoot: `cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Switch (.nc-switch):** 38×62px vertical slot with a 26px lever. Recessed Well background with Edge Inset. Lever in Metal Key gradient with Edge Raised. The `.is-on` state moves the lever from top (4px) to bottom (28px) and fills it with Safety Orange. Simulates a physical rocker or slide switch.
- **Knob (.nc-knob):** 72×72px circular control. Brushed Disc conic+radial gradient background, Edge Raised bevel, subtle drop shadow for physical presence. A 3px Safety Orange indicator line rotates via `--nc-knob-angle` (CSS custom property, default -120deg). Inner disc (14px inset) with recessed bevel. Grab/grabbing cursor.
- **Fader (.nc-fader):** Vertical range input 26×110px. Custom track (6px wide, Recessed Well with Edge Inset) and thumb (26×16px, Metal Key gradient with Edge Raised). Writing-mode: vertical-lr.
- **Segmented Control (.nc-segment):** Inline-flex of fused buttons inside a 3px-padded Recessed Well with Edge Inset. Inactive segments are transparent with Silkscreen Grey text; active segment gets the Polished White Panel background with Edge Raised bevel. Mono font, uppercase, wide-tracked.

### Inputs & Forms

**Character:** Recessed cutouts. Inputs feel like engraved labels on a control panel — the well is cut into the surface, and focus adds an orange rim.

- **Shape:** 5px border radius (md). Full width by default. 36px height (md). 12px horizontal padding.
- **Default (.nc-input, .nc-textarea, .nc-select):** Recessed Well background, 1px Structural Seam border, Edge Inset bevel. Etched Black text. Placeholder in Faded Mark.
- **Hover:** Border shifts to Ink Seam.
- **Focus:** Border shifts to Safety Orange; adds a 2px Safety Orange Subtle (12% opacity) outer glow. Outline: none (the orange border IS the focus indicator).
- **Disabled:** 50% opacity.
- **Sizes:** Small (28px), Medium (36px), Large (44px).
- **Textarea (.nc-textarea):** No fixed height; min-height 84px; vertical resize only; padding-block added; line-height 1.5.
- **Select (.nc-select):** Custom chevron arrow (inline SVG), right-aligned. Appearance reset.
- **Field Group (.nc-field):** Vertical flex stack with 4px gap. Label uses the Label typography (mono, 11px, uppercase, wide-tracked, Silkscreen Grey). Optional help text in 12px Silkscreen Grey.

### Checkboxes & Radios

- **Shape:** 18×18px. Checkbox: 3px radius (sm). Radio: fully round.
- **Default:** Recessed Well background, 1px Structural Seam border, Edge Inset bevel.
- **Checked (checkbox):** Safety Orange fill with a white SVG checkmark path.
- **Checked (radio):** Recessed Well background with Safety Orange border and a 4px inner Safety Orange dot (inset box-shadow).
- **Hover:** Border shifts to Ink Seam.
- **Disabled:** 40% opacity.

### Surfaces & Modules

**Character:** The "device chassis" grammar. A module is a framed object with a generous outer radius; inside, cells are joined by sharp seams.

- **Chassis (.nc-chassis):** Machined Aluminium Field background, 1.5px Ink Seam border, 16px border radius (xl), overflow hidden. A vertical flexbox column holding the header, bands, and footer. The outermost container — the framed device.
- **Band (.nc-band):** A horizontal flexbox row of cells. The 1px flex `gap` shows through as the Panel Seam color, creating the seam between cells. Cells default to equal width; spans are expressed as flex ratios.
- **Cell (.nc-cell):** Polished White Panel background, 20px padding. Variants: `--2` (Brushed Aluminium), `--dark` (LCD Cavity with inverted text), `--accent` (Safety Orange solid with noise texture overlay), `--brushed` (Brushed Disc gradient).
- **Panel (.nc-panel):** Polished White Panel background, 1px Panel Seam border, 5px radius (md), 16px padding, Edge Raised bevel. The standard standalone surface.
- **Panel Raised (.nc-panel--raised):** Same background with Brushed Grain texture overlay.
- **Panel Inset (.nc-panel--inset):** Recessed Well background, Hairline Seam border, Edge Inset bevel.
- **Panel Interactive (.nc-panel--interactive):** Cursor pointer. Hover shifts to Warm Aluminium background and Structural Seam border. Active shifts to Pressed Aluminium.

### Console / LCD

**Character:** The black display cavity. A separate visual world for readouts, terminals, and status displays.

- **Monitor (.nc-monitor):** LCD Cavity background, White on Black text. The dark "screen" surface; compose it onto a cell or bar — box chrome (border, radius, padding) comes from the cell/plate so it layers cleanly.
- **Scanline (.nc-monitor--scan):** A `::after` pseudo-element with a repeating horizontal line pattern (transparent 0–2px, 18% black 2–3px) overlays the content. Simulates a CRT scanline.
- **LCD Text (.nc-lcd):** Monospace, medium weight, 0.04em tracking, Safety Orange color with an 8px orange text-shadow glow. Tabular-nums. Large variant (`--lg`) at 2.25rem with line-height 1. Green variant swaps to a green phosphor color.
- **LCD Subtitle (.nc-lcd-sub):** Monospace, 11px, uppercase, wide-tracked, Dim Console Text. Labels beneath LCD readouts.
- **Terminal (.nc-terminal):** LCD Cavity background with a title bar (LCD Border, traffic-light dots in Signal Red/Amber/Green, mono title). Body with mono pre-formatted text in White on Black. Amber and green color variants.
- **Dot Matrix (.nc-matrix):** CSS Grid of circular dots (3px gap). Dots are LCD Seam color by default; `.is-on` dots glow Safety Orange with an orange box-shadow. Used for animated waveforms.
- **Bar Meters (.nc-meters):** Inline-flex of vertical bars (7px wide). Plain bars are Etched Black (auto-invert to White on Black inside consoles). Accent bars are Safety Orange.

### Data Display

- **Readout (.nc-readout):** Giant display numerals. ClashDisplay Bold at 6xl size (clamp(5rem, 14vw, 11rem)), line-height 1.0, tracking -0.035em, tabular-nums. Accent variant in Burnt Orange Ink. Vertical variant rotates 180deg via writing-mode.
- **Spec (.nc-spec):** A labelled value pair. Label: mono 11px uppercase wide-tracked Silkscreen Grey. Value: mono 16px medium Etched Black, tabular-nums. Used in the spec strip pattern.
- **Spec Strip (.nc-spec-strip):** Horizontal flex row of spec cells separated by 1px vertical Panel Seam hairlines with a top border. Reads as an engineering specification block.
- **LED (.nc-led):** Inline status indicator. 9px circular dot with optional glow. Variants: on (Signal Green + glow), rec (Safety Orange + glow), warn (Signal Amber + glow), err (Signal Red + glow). Label in mono 12px.
- **Badge (.nc-badge):** 20px-tall inline label. Mono 11px medium, uppercase, 0.04em tracking. Brushed Aluminium background, 1px Panel Seam border, 3px radius. Accent variant: Safety Orange solid with Dark on Orange text. Semantic variants: 12% tint background with matching text, transparent border.
- **Pill (.nc-pill):** Badge with fully round ends (9999px radius, 12px horizontal padding).
- **Progress (.nc-progress):** 6px tall track. Recessed Well background, 1px Panel Seam border, fully round, Edge Inset bevel. Fill bar in Safety Orange (or semantic color). 280ms ease transition.
- **Table (.nc-table):** Separate border model, 5px radius overflow hidden. Header: Bare Aluminium background, mono 11px uppercase labels. Rows: 1px Hairline Seam dividers. Hover highlights the full row in Warm Aluminium.

### Feedback

- **Alert (.nc-alert):** Flex row with 12×16px padding, 5px radius. 1px Panel Seam border with a 3px left border in the semantic color. Background: 12% semantic tint. Icon via `::before` pseudo-element (ⓘ ✓ ⚠ ✕). The left-border accent is the ONE exception to the shared ban on side-stripe borders — it is a functional severity indicator, not decoration.

### Navigation

- **Tabs (.nc-tabs):** Horizontal flex row with a 1px Panel Seam bottom border. Individual tabs: mono 12px medium, uppercase, 0.04em tracking, 8×16px padding, 2px transparent bottom border (margin-bottom -1px to overlap the row border). Active tab: Etched Black text, 2px Safety Orange bottom border. Hover shifts text from Silkscreen Grey to Etched Black.
- **Breadcrumbs (.nc-breadcrumbs):** Horizontal flex row, 8px gap, slash separator in Faded Mark. Mono 12px, 0.04em tracking. Ancestor links in Silkscreen Grey (hover → Etched Black). Current page in Etched Black.

### Technical Marks

- **Divider (.nc-divider):** 1px horizontal rule in Panel Seam, 24px vertical margin. Subtle variant in Hairline Seam.
- **Schematic Divider (.nc-schematic):** Labelled rule. Mono 11px uppercase wide-tracked Silkscreen Grey text flanked by 1px Structural Seam lines (flex: 1). Reads as a blueprint section break.
- **Dimension Line (.nc-dimension):** Horizontal measure with end ticks. Mono 11px labels at each end, 1px Structural Seam line with 1×7px vertical ticks at both ends.
- **Registration Mark (.nc-reg):** 16×16px crosshair. 1px Silkscreen Grey vertical and horizontal lines centered.
- **Hatch (.nc-hatch):** Safety Orange background with a 45deg Etched Black stripe pattern (2px stroke, 7px gap). Reads as a hazard marking.
- **Barcode (.nc-barcode):** 36px-tall CSS-only barcode using a repeating linear gradient of Etched Black stripes at varying widths.
- **Screw (.nc-screw):** 10×10px circular decorative fastener. Radial gradient from near-white to dark grey, with a 42deg rotated slot line. Four position modifiers (tl/tr/bl/br). Used in module corners.

### Diagram & Schematic

**Character:** The machine-documentation grammar. Diagrams sit on a recessed **drafting plate** and communicate real system behaviour, never decoration. Linework is neutral (Structural Seam / Etched Black); the Safety Orange signal marks only the live path and the `0x00` null.

- **Drafting Plate (.nc-plate):** Recessed Well background, Hairline Seam border, Edge Inset bevel, generous padding. The cut-in surface a diagram breathes on. It sits inside a cell that keeps its seam and header — the panel contains the whitespace, the whitespace never dissolves the panel.
- **Schematic Box (.nc-schematic-box):** A labelled node in a diagram. Polished White Panel fill, 1.5px Etched Black stroke, md radius. Carries a mono part-number label and a name. Represents a real component (a device, a provider).
- **Data Path (.nc-path):** A 2px Safety Orange line with a triangular arrowhead, marking the one live route through a diagram (e.g. an encrypted request). The only place the signal appears inside a schematic.
- **Null Box (.nc-null):** A node drawn as a dashed Structural Seam rectangle stamped `0x00`, representing a component deliberately *not* in the path (e.g. the NC-750 server). Usually paired with the Sever Mark.
- **Sever Mark (.nc-sever):** A small Signal Red ✕ on a dashed line, marking a connection that does not exist. The visual proof of a negative claim.
- **Leader / Callout (.nc-leader):** A thin Structural Seam line from a diagram element to a mono label at the margin. Annotates without crowding the figure.
- **Exploded View (.nc-exploded):** A stack of isometric plates pulled apart along a dashed assembly axis, each with a leader to a part-numbered label. A deliberate set-piece (hero, onboarding, privacy page), hand-built per subject — not a per-screen element.
- **Glyph (.nc-glyph):** A small (≈34px) functional mark from the system's fixed symbol set (node, relay, null, active, enclose, local, signal, verify, registration). Stroke-based; neutral by default, Safety Orange = active, Signal Green = verified, dashed = null.

**Named Rules**

**The Real-Diagram Rule.** A schematic must depict actual behaviour. A diagram that does not match what the system really does is worse than none, and violates the brand's literal-truth ethos. Decorative diagrams are forbidden.

**The Neutral-Linework Rule.** Diagram strokes are neutral (Structural Seam / Etched Black). Safety Orange is spent only on the live path and the `0x00` null. Never introduce a second diagram colour (no blueprint-cyan).

### Instrument

**Character:** Surfaces for products *operated as instruments* rather than browsed as apps. These are live-readout surfaces, not chat or form components. See `DESIGN_USE.md` §10 for the interaction model and the rules on when it applies (foreground vs background work).

- **Facet Tag (.nc-facet):** A small mono uppercase label marking what an instrument is currently measuring (`OBSERVATION · PATTERNS`). Recessed Well background, Structural Seam border, Burnt Orange Ink text, sm radius.
- **Live Readout (.nc-readout-live):** The accumulating measurement surface — patterns, evidence count, confidence — rendered in the dark Console cavity. The hero of an instrument interaction; it grows and revises as the user feeds it.
- **Coverage Meter (.nc-coverage):** A saturation bar, not a step counter. Recessed Well track with Edge Inset; the fill rises from Faded Mark toward Signal Green and reads "locked" when sufficient. For open-ended processes of unknown length.
- **Acquisition (.nc-acquire):** The working state. Instead of a spinner, an animating waveform and an `ANALYZING …` readout show the signal being read. Used only for foreground/blocking work (see `DESIGN_USE.md` Rule I1); background work uses a quiet ambient indicator instead.
- **Session Log (.nc-log):** Prior exchanges collapsed into terse, re-openable entries (`OBS 01 ▸ ANSWERED`) — a flight recorder, not a chat feed. Append-only.

**Named Rule**

**The Honest-Reading Rule.** An instrument reading (coverage, confidence, lock) must reflect a value the system genuinely computes. No fake progress, no decorative meter (see `../brand/ETHOS.md`: claims literally true).

### Misc

- **Avatar (.nc-avatar):** 36px circle. Display font initials, Metal Key gradient background, 1px Structural Seam border, Edge Raised bevel. Supports `<img>` with object-fit cover. Sizes: sm (26px), md (36px), lg (46px).
- **Tooltip (.nc-tooltip):** Pure CSS via `::after` on `data-tooltip`. Etched Black background, White on Black text, 3px radius, 4×8px padding. Positioned centered above trigger with 6px gap. Fades in via opacity transition.
- **Row / Stack (.nc-row, .nc-stack):** Flex layout utilities. Row: horizontal with 12px gap and wrap. Stack: vertical column with gap variants (2: 8px, 3: 12px, 4: 16px, 6: 24px).

### Dark Theme

Every component adapts to the dark theme automatically through the token system. The `[data-theme="dark"]` block in `design-tokens.css` redefines all surface, ink, line, console, accent, semantic, and material tokens using the same seed H/S channels but pinned to dark lightness values. Components reference tokens, not hardcoded values, so they follow. The orange accent brightens slightly (L+3) to maintain signal strength against dark backgrounds.

### Named Rules

**The Token-Only Rule.** Components reference CSS custom properties exclusively. No hardcoded colors, radii, spacing, or font stacks in component rules. A component that references a hex value directly is a bug.

**The Dark-Auto Rule.** Every component works in both themes without a single theme-specific selector. The `[data-theme="dark"]` block only redefines tokens, never components. If a component needs a dark-theme override, the token is wrong, not the component.

## 6. Do's and Don'ts

### Do:

- **Do** separate surfaces with 1px seam borders (`--nc-line`, `--nc-line-subtle`, `--nc-line-strong`) or tonal background shifts. The seam is the system's primary spatial grammar.
- **Do** use the Safety Orange accent on ≤10% of any screen. A primary button, or a focus ring, or a checked toggle — never all three competing. Its loudness IS the point; overuse destroys the signal.
- **Do** use the four-finish surface ramp (raw field, bare aluminium, brushed panel, polished white) consistently. Brighter surfaces are closer to the user.
- **Do** set inputs on the Recessed Well background (`--nc-inset`) with the Edge Inset bevel. The cutout IS the affordance.
- **Do** use ClashDisplay for display numerals and headings, Chillax for body and operational text, monospace for technical labels. The three-face rule is non-negotiable.
- **Do** flip Edge Raised to Edge Inset on `:active` for all pressable elements. The bevel reversal is the tactile confirmation.
- **Do** use the seed channels to customize the theme. Change `--nc-seed-h/s/l` and `--nc-accent-h/s/l` on `:root` or via the color pickers; every component follows.
- **Do** keep transitions at 90–280ms. State changes feel immediate (90ms fast, 160ms normal, 280ms slow for fills). The tactile press transition uses a slight overshoot curve (120ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Do** target WCAG 2.1 AA contrast. Etched Black on Polished White achieves ~13:1. Safety Orange on white achieves ~3:1 (acceptable for large UI components). Dark on Orange achieves ~10:1.
- **Do** use the `prefers-reduced-motion` media query to collapse all transitions to 0.01ms. The reset.css already includes this.
- **Do** place diagrams, schematics, and readouts on a recessed drafting plate (`.nc-plate`) and keep dense chrome on raised panels. Pair a dense cell with an open one — that contrast is the system's signature.
- **Do** keep diagram linework neutral and spend Safety Orange only on the live path and the `0x00` null.
- **Do** make every schematic depict real behaviour — a diagram must be verifiable, not illustrative.

### Don't:

- **Don't** use box-shadow for elevation. The only permitted shadows are the physical edge bevels (`--nc-edge-raised`, `--nc-edge-inset`). No drop shadows, no ambient shadows, no glow-as-elevation.
- **Don't** use gradients decoratively. The metal gradients (`--nc-metal-key`, `--nc-metal-brushed`, `--nc-grain-brushed`) simulate machined surfaces. No gradient washes, no gradient text, no gradient backgrounds for visual effect.
- **Don't** use glassmorphism, backdrop-filter blur, or transparency effects. The interface is opaque aluminium, not glass.
- **Don't** add decorative motion. Transitions serve state changes only. No page-load choreography, no hover bounce (the overshoot curve on toggle/button press is mechanical feedback, not decoration), no scroll-triggered reveals.
- **Don't** use rounded corners above 16px (xl) except for fully round elements (badge pills, avatars, knobs). The system is machined, not molded. Tight radii read as precision manufacturing.
- **Don't** hardcode a color value in any component rule. Every visual decision flows through CSS custom properties. Hardcoded hexes or HSL values in component CSS are a bug.
- **Don't** use ClashDisplay in buttons, inputs, labels, or operational text. Display fonts in functional UI read as a branding mistake.
- **Don't** use the accent color as decoration. It marks primary actions, current selection, focus, and the active signal. Nothing else earns it.
- **Don't** add a fifth surface finish. The four-finish ramp (raw field, bare aluminium, brushed panel, polished white) plus recessed well and LCD cavity are the complete vocabulary. If you need more hierarchy, use spacing, typography, or a seam.
- **Don't** use Material Design patterns: no floating action buttons, no ripple effects, no elevation-based shadow hierarchy. If it looks like a Google app, it's wrong.
- **Don't** use generic SaaS template patterns: no hero-metric dashboards (big number + small label + sparkline), no icon-above-heading card grids, no purple-to-blue gradients. If it looks like every startup landing page, it's wrong.
- **Don't** be deliberately raw or brutalist. Industrial means precision-machined, not crude. The system is considered and surgical, not confrontational.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards, list items, or callouts. The alert component's 3px left border is the sole exception — it's a functional severity indicator, not decoration.
- **Don't** render an instrument's reading (coverage, confidence, lock) as fake progress. The value must be one the system actually computes.
- **Don't** invent a decorative glyph alphabet. The symbol set is small and each mark means exactly one thing.
- **Don't** use a second colour for diagram linework (no blueprint-cyan). One signal only — Safety Orange, on the live path and `0x00`.
- **Don't** pack a diagram edge-to-edge on a raised panel. Diagrams go on a recessed drafting plate where they can breathe.
