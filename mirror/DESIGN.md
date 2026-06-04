---
name: Persona
description: Private AI-powered personal profile tool — interview, insight, profile, all on your device.
colors:
  # Dark theme — Warm Midnight
  dark-bg: "oklch(13% 0.008 55)"
  dark-surface: "oklch(18% 0.010 55)"
  dark-elevated: "oklch(22% 0.012 55)"
  dark-border: "oklch(28% 0.014 55)"
  dark-text-primary: "oklch(91% 0.006 80)"
  dark-text-secondary: "oklch(68% 0.008 70)"
  dark-text-muted: "oklch(48% 0.008 65)"
  # Light theme — Aged Vellum
  light-bg: "oklch(96% 0.006 80)"
  light-surface: "oklch(93% 0.008 75)"
  light-elevated: "oklch(98% 0.004 80)"
  light-border: "oklch(83% 0.010 70)"
  light-text-primary: "oklch(18% 0.012 50)"
  light-text-secondary: "oklch(40% 0.012 55)"
  light-text-muted: "oklch(58% 0.010 60)"
  # Accent — Terracotta (restrained; appears on ≤10% of any given screen)
  accent: "oklch(64% 0.13 38)"
  accent-on-light: "oklch(50% 0.14 38)"
  accent-subtle-dark: "oklch(22% 0.06 38)"
  accent-subtle-light: "oklch(90% 0.06 38)"
  # Destructive
  error-dark: "oklch(55% 0.14 25)"
  error-light: "oklch(45% 0.15 25)"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI Variable', sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI Variable', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI Variable', sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI Variable', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI Variable', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  none: "0"
  sm: "4px"
  md: "6px"
  lg: "10px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.light-elevated}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "oklch(58% 0.14 38)"
    textColor: "{colors.light-elevated}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.dark-text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.dark-text-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input-default:
    backgroundColor: "{colors.dark-elevated}"
    textColor: "{colors.dark-text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.dark-text-muted}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  nav-item-active:
    backgroundColor: "{colors.dark-elevated}"
    textColor: "{colors.dark-text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: Persona

## 1. Overview

**Creative North Star: "The Trusted Advisor's Office"**

Imagine a room with warm low light, shelved books, and surfaces worn smooth by use. Nothing calls for your attention. Nothing performs. The furniture is quality without ostentation; the light is warm without flattery. You sit down and think clearly because the room asks nothing of you except presence. That is the experience this design system builds toward.

Persona is a private tool for self-reflection. The interface is the room, not the subject. It recedes completely so the interview, the insight document, and the profile can occupy the user's full attention. Warmth is expressed through restraint and tone, not through color quantity. The accent — a terracotta derived from fired clay and aged leather — appears sparingly, only where it carries meaning.

This system is emphatically not a product dashboard, a SaaS landing page, or a personal branding tool. It has no metrics, no engagement loops, no CTAs competing for attention. Generic SaaS aesthetics (gradient heroes, floating cards, glowing accents) are incompatible with the premise that the user's private self-knowledge is the product. Corporate navy and "professional" formality in the LinkedIn sense are equally off-limits: this tool is personal, not institutional. The system runs in both dark and light themes, each resolving the same warmth through different physical metaphors — candlelight in dark mode, aged vellum in light mode.

**Key Characteristics:**
- Dual-theme warm palette: deep warm charcoal (dark) and cream vellum (light), both tinted toward amber/sienna rather than cool blue-gray
- Single accent: terracotta, used on ≤10% of any given screen
- System humanist sans throughout — no remote font dependencies, consistent with the privacy-first stance
- Flat surface hierarchy via tonal layering, no decorative shadows
- State-change-only motion: nothing animates unless the state changes; nothing choreographs itself

## 2. Colors: The Ember & Vellum Palette

A two-theme warm-neutral system with a single terracotta accent used with deliberate economy.

### Primary (Accent)
- **Terracotta** (`oklch(64% 0.13 38)`): The one voice. Used on interactive elements (primary buttons, active navigation, progress indicators, links) and nowhere else. On dark surfaces its warmth is vivid; on light surfaces, use `accent-on-light` (`oklch(50% 0.14 38)`) to maintain contrast. Its rarity is the point.

### Neutral — Dark Theme (Warm Midnight)
- **Warm Midnight** (`oklch(13% 0.008 55)`): The base — body background, full-bleed areas. Barely distinguishable from black but tinted toward amber so it reads as charcoal, not void.
- **Ember Surface** (`oklch(18% 0.010 55)`): The primary UI surface — sidebar, header bar, chat background. One clear step above the base.
- **Lifted Surface** (`oklch(22% 0.012 55)`): Elevated panels, input backgrounds, selected items. Structural without using shadows.
- **Ash Border** (`oklch(28% 0.014 55)`): Dividers, input outlines, separator rules. Warm enough to read but quiet enough to disappear.
- **Warm Ivory** (`oklch(91% 0.006 80)`): Primary text. Off-white with a faint amber tint — never pure white.
- **Faded Linen** (`oklch(68% 0.008 70)`): Secondary text, labels, metadata.
- **Weathered Stone** (`oklch(48% 0.008 65)`): Muted text, placeholders, disabled states.

### Neutral — Light Theme (Aged Vellum)
- **Aged Vellum** (`oklch(96% 0.006 80)`): The base — body background. A warm cream that reads like good paper.
- **Worn Parchment** (`oklch(93% 0.008 75)`): Sidebar, header, surface areas. Slightly deeper than the base.
- **Fresh Leaf** (`oklch(98% 0.004 80)`): Elevated panels, modals, popovers. Higher than the base.
- **Pale Reed** (`oklch(83% 0.010 70)`): Borders and dividers.
- **Dark Walnut** (`oklch(18% 0.012 50)`): Primary text. Deep warm near-black.
- **Aged Ink** (`oklch(40% 0.012 55)`): Secondary text.
- **Faded Pencil** (`oklch(58% 0.010 60)`): Muted text, placeholders.

### Error
- **Ember Error** (`oklch(55% 0.14 25)`): Error state on dark. A sienna-red adjacent to the terracotta family — error states read as warm and serious, not clinical red.
- **Deep Ember Error** (`oklch(45% 0.15 25)`): Error state on light.

### Named Rules
**The One Voice Rule.** The terracotta accent appears on ≤10% of any given screen. It marks interactive elements and active states exclusively. It is never used decoratively — no gradient fills, no colored card headers, no tinted section backgrounds. Its scarcity is what makes it mean something.

**The Warm Tint Rule.** Every neutral — background, surface, border, text — carries a faint warm tint toward hue 55–80 (amber/sienna). Pure gray (`chroma 0`) and pure blue-gray are prohibited. If a neutral reads as "slate" or "cool gray", increase the hue tint until it settles into the amber family.

## 3. Typography

**Body/UI Font:** System humanist sans — `system-ui, -apple-system, 'Segoe UI Variable', sans-serif`

No remote font is loaded. The system stack maps to SF Pro Text (macOS/iOS), Segoe UI Variable (Windows 11), and Roboto (Android/Linux) — all warm, humanist, and legible at the sizes this interface uses. This is a deliberate choice: it respects the privacy-first posture and eliminates any font-loading network request from the CSP surface.

**Character:** Understated and familiar. The type system creates warmth through weight contrast and scale ratios rather than expressive letterforms. The advisor speaks clearly and without flourish.

### Hierarchy

- **Display** (600, clamp 1.5rem→2rem, lh 1.2, ls −0.02em): Section titles in insight and profile outputs. Not used in chat UI.
- **Headline** (600, 1.25rem, lh 1.3, ls −0.01em): Page/panel titles. Welcome screen heading.
- **Title** (600, 1rem, lh 1.4): Section headers, settings group labels, completion headings.
- **Body** (400, 0.9375rem, lh 1.6): Chat messages, prose in insight/profile documents. Cap at 65–75ch.
- **Label** (500, 0.75rem, lh 1.4, ls +0.04em): Nav labels, metadata tags, status text, input labels. Use muted text color.

### Named Rules
**The System Font Rule.** No web font may be loaded from a remote URL. The CSP enforces this, and it should remain enforced. If the project ever adds a custom font, bundle it locally and update the CSP accordingly.

**The Weight Contrast Rule.** Hierarchy is expressed through weight (400 → 600) and scale (0.75rem → 2rem), never through color alone. Avoid `font-weight: 300` or lighter — at the interface's density it reads as fragile, not elegant.

## 4. Elevation

Persona uses **tonal layering**, not decorative shadows. Depth is expressed by stepping through the neutral stack — base → surface → elevated — each approximately 5 percentage points lighter in OKLCH. No box shadows appear on resting elements.

This is both an aesthetic and a CSP-compatible choice: the flat-tonal approach avoids any dependency on blur filters or rgba shadow stacks that might conflict with sandbox rules in iframe contexts.

### Shadow Vocabulary

- **Focus ring** (`0 0 0 2px {accent}, 0 0 0 4px transparent`): The only "shadow" in the system. Applied to keyboard-focused interactive elements. Uses the terracotta accent so focus is legible without being aggressive.
- **Ambient lift** (`0 4px 16px oklch(0% 0 0 / 0.25)`): Reserved for popovers and dropdowns only. Not for cards, panels, or resting surfaces.

### Named Rules
**The Flat-by-Default Rule.** Surfaces are flat at rest. Depth comes from tonal step, not shadow. The focus ring is the only element that uses a shadow-like treatment at rest. Any new component should first exhaust tonal stepping before reaching for a shadow.

## 5. Components

### Buttons

Purposeful and slightly understated. They do not compete with the content.

- **Shape:** Gently rounded (6px radius). Not capsule-shaped; not square.
- **Primary:** Terracotta fill (`accent`), off-white text. Padding 10px × 20px. Used for the single most important action on any given screen (submit interview, download).
- **Primary hover:** Deepened terracotta (`oklch(58% 0.14 38)`), 150ms ease-out transition on background.
- **Secondary:** Transparent fill, `Ash Border` stroke (1px), primary text color. Same padding as primary. Used for secondary actions alongside a primary.
- **Ghost:** No fill, no border, muted text color. Padding 8px × 12px. Used for tertiary actions (cancel, skip).
- **Focus:** 2px terracotta focus ring, 4px transparent offset.
- **Disabled:** Opacity 0.4, cursor `not-allowed`. Do not swap colors.

### Text Inputs & Textareas

- **Style:** `Lifted Surface` fill, `Ash Border` 1px stroke, 6px radius, 10px × 14px padding.
- **Focus:** Border shifts to `accent` (1px → 1.5px), no glow.
- **Placeholder:** `Weathered Stone` color.
- **Error:** Border shifts to `Ember Error`. Error message below in `Ember Error` color, label style.
- **Disabled:** Opacity 0.4.

### Navigation

- **Desktop sidebar:** `Ember Surface` background. Nav items full-width, 8px × 12px padding, 6px radius. Default text `Weathered Stone`; hover text `Warm Ivory`, background `Lifted Surface`; active text `Warm Ivory`, background `Lifted Surface`, terracotta left mark (2px, flush to item left edge, not decorative stripe — it is an active indicator, sized to its role).
- **Mobile bottom nav:** Same surface as sidebar. Icons + labels in `label` type scale. Active item accent-colored icon, primary text label.
- **Section labels in sidebar:** `label` type scale, `Weathered Stone` color, uppercase, tracked. Not interactive.

### Chat Bubbles

The signature component. The conversation IS the product.

- **User messages:** Right-aligned. `accent-subtle-dark` / `accent-subtle-light` fill (a faint terracotta tint). Primary text color. 6px radius, flattened on the trailing bottom corner (bottom-right in LTR). 12px × 16px padding. Max width 80%.
- **AI messages:** Left-aligned. `Lifted Surface` fill. Primary text color. 6px radius, flattened on the leading bottom corner. Same padding. Avatar: initials or icon in `accent` on `accent-subtle-dark` background, 28px circle.
- **Timestamp / metadata:** `label` scale, `Weathered Stone` color, outside the bubble.
- **Streaming state:** Cursor blink only. No animation on the bubble itself.

### Settings Sections

- **Group container:** No card chrome. Settings sections are separated by spacing (`xl: 40px`) and a `Ash Border` divider, not by card borders or backgrounds. The settings page background IS the surface.
- **Row:** Label in `title` scale, description in `body` scale `Faded Linen` / `Aged Ink` color. Value/control right-aligned. 16px × 0 padding (full-width row, no horizontal card padding needed).
- **Destructive zone:** At bottom of settings, separated by extra space. Labels in `Ember Error` color. Otherwise same treatment.

### Provider / Model Select

- **Style:** Same as Text Input. Value display uses `title` weight. Options in a minimal dropdown (no checkmarks, no icons unless critical). Active option: `accent` color text.

## 6. Do's and Don'ts

### Do:
- **Do** keep the accent (terracotta) on ≤10% of any given screen. Its scarcity is the design.
- **Do** use tonal stepping (base → surface → elevated) to express depth before reaching for shadows or borders.
- **Do** tint every neutral toward hue 55–80 (amber/sienna). `oklch(N% 0.008–0.015 55–80)` is the formula for any neutral step you need to add.
- **Do** cap body text at 65–75ch. Long prose in the insight and profile outputs is the primary use case; unconstrained line length destroys readability.
- **Do** use `font-weight: 600` for headings and `400` for body. The weight contrast is the hierarchy.
- **Do** load only fonts bundled locally. No `@font-face` pointing to Google Fonts or any CDN.
- **Do** respect `prefers-reduced-motion`. Any transition can be removed; nothing in the UI depends on motion to be understood.

### Don't:
- **Don't** use the terracotta accent decoratively — no tinted section headers, no gradient fills, no colored card backgrounds. It marks interactive state only.
- **Don't** use generic SaaS aesthetics: gradient hero sections, floating cards with drop shadows, hero-metric templates (big number + small label + supporting stats). This app is the opposite of a VC pitch deck.
- **Don't** use corporate navy, formal gray, or any cold blue-gray neutral. If it looks like a bank or an enterprise dashboard, the neutrals aren't warm enough.
- **Don't** introduce LinkedIn-style "professional" visual language: connection counts, endorsement badges, activity feeds, engagement metrics. Persona is private and inward-facing.
- **Don't** use `border-left` greater than 1px as a colored accent stripe on any card, list item, callout, or bubble. Rewrite with tonal backgrounds or leading indicators instead.
- **Don't** use gradient text (`background-clip: text`). Emphasis is through weight or size, never gradient.
- **Don't** use glassmorphism (`backdrop-filter: blur`) decoratively. If a blur is needed for a functional overlay (modal backdrop), it is functional — not a style choice.
- **Don't** add animations that aren't triggered by a user action or state change. The interface is still at rest.
- **Don't** use `#000` or `#fff`. Every color in this system carries a warm tint. Pure black and pure white are outside the palette.
