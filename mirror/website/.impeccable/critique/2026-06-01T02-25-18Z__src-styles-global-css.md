---
target: src/styles/global.css
total_score: 24
p0_count: 1
p1_count: 5
timestamp: 2026-06-01T02-25-18Z
slug: src-styles-global-css
---
# Critique: `src/styles/global.css` — Persona Marketing Site Design System

---

## Design Health Score

> Nielsen's 10 Usability Heuristics scored 0–4

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No loading states, skeletons, or progress indicators defined anywhere in the CSS |
| 2 | Match Between System and Real World | 3 | Warm-earth metaphor (ember, ink, linen) maps naturally to the product's trusted-advisor north star |
| 3 | User Control and Freedom | 2 | Escape key dismisses mobile menu; theme toggle persists; but no back-to-top, breadcrumbs, or animated spatial transitions |
| 4 | Consistency and Standards | 3 | Internally coherent: identical section boundaries, consistent padding rhythm, uniform token usage across 19 components |
| 5 | Error Prevention | 2 | Focus-visible ring, nav active highlighting, theme flash prevention; but no skip-to-content link, no font-display strategy, no confirmation patterns |
| 6 | Recognition Rather Than Recall | 3 | Terracotta accent has consistent semantic meaning; tonal layering is predictable; prose follows web conventions |
| 7 | Flexibility and Efficiency of Use | 2 | Responsive breakpoints, persistent theme toggle; but no keyboard shortcuts, no skip-link, no `prefers-reduced-motion` query, no tablet breakpoint |
| 8 | Aesthetic and Minimalist Design | 3 | Genuinely disciplined — zero decorative cruft, no banned patterns; but near-zero affirmative visual personality for a brand surface |
| 9 | Error Recovery | 2 | Error tokens defined and 404 page exists; but no toast/notification patterns, no undo mechanisms, no form recovery styling |
| 10 | Help and Documentation | 2 | Prose block provides solid doc rendering (70ch, clear h1-h3, code blocks, tables); but no contextual help, no tooltip pattern, no search-in-docs styling |
| **Total** | | **24/40** | **Acceptable — significant improvements needed** |

---

## Anti-Patterns Verdict

### Does this look AI-generated?

**LLM assessment**: Not in the first-order sense. The design system makes deliberate, unusual choices: warm-tinted neutrals instead of cool gray, a single terracotta accent instead of the SaaS indigo/teal default, tonal layering instead of box-shadows, system fonts as a privacy stance, and a palette that rigorously avoids #000, #fff, gradient text, glassmorphism, and every other SaaS cliché. These are not training-data reflexes.

However, the system falls into a **second-order trap**: it defines itself entirely by what it excludes. Every anti-pattern ban is satisfied, but no affirmative visual signature replaces them. The result is a beautiful frame with no painting inside — a site that no one would call "AI slop" but few would call "memorable" either. For a brand surface asking visitors to trust their career narrative to a tool, "not generic" is table stakes; "distinctive" is the bar.

**Deterministic scan**: The automated detector (`detect.mjs`) was unavailable — the detector subdirectory is missing from the impeccable installation. A manual CSS quality audit was performed instead, yielding concrete findings detailed in Priority Issues below. The manual audit confirmed 9 contrast violations (2 P0, 7 P1), uncovered the duplicate light-mode token block, flagged missing `prefers-reduced-motion` support, identified zero OKLCH fallback strategy, and catalogued 22 individual findings across 9 audit categories.

**Visual overlays**: Not attempted. The target is a CSS-only file (`src/styles/global.css`), which cannot be independently rendered in a browser for overlay injection. No live server was started.

**Where the audit caught what the design review missed**: The manual CSS audit found 9 WCAG AA contrast violations that the design review (scoring "Aesthetic and Minimalist Design" at 3/4) didn't surface. The primary CTA button fails 4.5:1 contrast at 3.63:1 — a measurable, objective accessibility failure on the most important interactive element on any marketing page. The audit also identified the complete absence of OKLCH fallback colors, meaning the entire design system renders as transparent-on-black in Safari <15.4 (a P1 compatibility failure).

**Where the design review caught what the audit missed**: The design review identified that the system's typographic character is invisible — system fonts on a marketing site communicate "no budget for design" to skeptical first-time visitors (Jordan persona). This is not a technical failure (the audit confirms correct font-family syntax and no remote font requests) but a strategic one for a brand surface.

### Agreed false positives

- **Prose blockquote `border-left: 2px`**: Assessment A flagged this as a DESIGN.md violation. Assessment B correctly identified it as explicitly permitted — DESIGN.md states the ban applies to strict >2px, and a subsequent section carves out blockquote left borders as "functional indicators, not ornamental stripes." This is NOT a violation.

---

## Overall Impression

The design system is a disciplined, well-engineered warm-neutral palette with a single restrained accent, ported faithfully from the Persona app's DESIGN.md. It perfectly avoids every SaaS cliché it set out to avoid. But for a marketing site — a brand surface where design IS the product — it reads as a frame waiting for a painting. The warmth is real, the restraint is real, but distinctiveness requires more than the absence of slop. The contrast failures on the primary CTA button and muted text are the most urgent issues; the invisible typographic character is the most strategic one.

---

## What's Working

**1. Disciplined single-accent color system with warm-tinted neutrals.** Every neutral carries a deliberate amber/sienna tint (hue 55–80) instead of the ubiquitous cool gray. The terracotta accent at `oklch(64% 0.13 38)` is used for interactive elements only — no decorative accent fills, no tinted section headers. This scarcity makes the accent meaningful. The "no #000, no #fff" rule is followed everywhere.

**2. Tonal layering over shadows for depth hierarchy.** Using lightness steps (app → surface → raised → edge) instead of box-shadows is distinctive, cleaner than the floating-card SaaS default, and communicates the product's values (honest, straightforward, no tricks) through the visual system itself.

**3. Consistent section-level rhythm.** Every section uses `border-t border-edge` with identical padding (`py-20 sm:py-28`), creating a predictable, calm reading rhythm. Section transitions feel like turning pages in a book, aligned with the "trusted advisor's office" metaphor.

**4. Focus-visible ring is keyboard-only and well-executed.** Using `:focus-visible` (not `:focus`) ensures mouse users never see focus rings while keyboard users get clear, branded terracotta indicators. The two-layer box-shadow approach (2px accent + 4px transparent gap) is WCAG 2.4.13 compliant and doesn't interfere with layout.

**5. Hero watermark and layout variety per section.** The background logo watermark at opacity 0.2 is the only decorative element in the system and it works — it adds brand texture without distracting. Alternating layout strategies (centered hero, left-aligned HowItWorks, centered Comparison, left-aligned Pricing) prevent page monotony without requiring multiple visual languages.

---

## Priority Issues

### [P0] Muted text fails WCAG AA contrast in dark mode
**Why it matters**: `--ink-3` on `--app` achieves only 2.74:1 contrast (fails even the 3:1 large-text threshold). This affects footer metadata, comparison table headers, pricing subtext, the hero privacy footnote, and every other muted-text instance. Users with low vision literally cannot read secondary content. Combined with `-webkit-font-smoothing: antialiased` thinning text on macOS, this is a compounding accessibility failure.
**Fix**: Increase `--ink-3` lightness in dark mode from `oklch(48% 0.008 65)` to approximately `oklch(58% 0.008 65)` to achieve ≥4.5:1 on the app background. Adjust `--ink-2` and `--edge` proportionally if needed to maintain the three-step text hierarchy.
**Suggested command**: `/impeccable clarify src/styles/global.css`

### [P1] Primary CTA button text fails WCAG AA contrast
**Why it matters**: The most important interactive element on any marketing page — the "Download Persona" button — has white-warm text on terracotta at only 3.63:1 (fails 4.5:1 AA). This is the conversion target and it's legally/accessibility non-compliant.
**Fix**: Lighten the terracotta slightly in dark mode from `oklch(64% 0.13 38)` to `oklch(60% 0.13 38)` to improve contrast against `--white-warm`, or use --ink as the button text color (which achieves >7:1 on terracotta). Test both light and dark modes.
**Suggested command**: `/impeccable colorize src/styles/global.css`

### [P1] Zero typographic character on a brand surface
**Why it matters**: System fonts are a principled choice for the product app (privacy, no network requests). On a marketing site, they communicate "no budget for design." The brand.md font selection procedure requires picking a font with genuine voice, avoiding the reflex-reject list. The current choice ("none") is not a valid alternative — it makes the site visually anonymous.
**Fix**: Select a warm grotesque or restrained humanist variable font — something with presence but not decoration. Avoid the reflex-reject list (Inter, DM Sans, Space Grotesk, Fraunces, etc.). Apply at display sizes (headings, hero) while optionally keeping body text in system fonts for performance. Bundle locally to preserve the no-remote-requests privacy posture.
**Suggested command**: `/impeccable typeset src/styles/global.css`

### [P1] No motion system and no `prefers-reduced-motion` support
**Why it matters**: The brand register explicitly grants permission for "ambitious first-load motion." The current CSS has one 150ms opacity transition on a/button, and zero `@media (prefers-reduced-motion: reduce)` query despite DESIGN.md requiring it. Static sites feel like PDFs. A marketing site without motion signals no craftsmanship. Users with motion sensitivity get no adaptation.
**Fix**: Add `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` immediately. Then define entrance animations for hero/staggered features, scroll-triggered section reveals, and hover micro-interactions. Keep durations under 400ms for functional, under 800ms for entrance.
**Suggested command**: `/impeccable animate src/styles/global.css`

### [P1] No OKLCH fallback — entire design system breaks in older browsers
**Why it matters**: Safari <15.4, Chrome <111, and Firefox <113 don't support `oklch()`. In those browsers, every `var(--app)`, `var(--ink)`, etc. resolves to `transparent` — the page body has transparent background with black browser-default text. No `@supports` wrapper, no hex fallback chain. This is a single-point-of-failure for the entire visual system.
**Fix**: Add hex fallbacks using the CSS custom property fallback chain: `background-color: var(--app, #1e1c18)`. Define a `@supports not (color: oklch(0% 0 0))` block with sRGB-equivalent hex values for all 14 tokens. Or add fallback values to every `var()` call.
**Suggested command**: `/impeccable harden src/styles/global.css`

### [P1] Duplicate light-mode token block — triple maintenance burden
**Why it matters**: The 14 light-mode declarations appear identically in both `:root.light` (lines 24–38) and `@media (prefers-color-scheme: light) :root:not(.dark):not(.light)` (lines 41–57). Every token adjustment requires three edits (dark root, light class, @media query). The `@media` block is redundant with the JS theme-detection logic in BaseLayout.astro and uses fragile `:not()` guards.
**Fix**: Remove the `@media (prefers-color-scheme: light)` block entirely. The inline JS in BaseLayout.astro already detects system preference and applies the `.light` class before first paint, making the `@media` query a redundant 14-line copy. Keep `:root.light` as the single source of truth for light-mode tokens.
**Suggested command**: `/impeccable distill src/styles/global.css`

### [P2] Button component missing disabled, active, and loading states
**Why it matters**: DESIGN.md specifies "Disabled: Opacity 0.4, cursor not-allowed" for buttons, but neither global.css nor Button.astro implements disabled styling. No active (pressed) state exists. No loading/skeleton pattern. The component vocabulary is incomplete per the product register's component requirements.
**Fix**: Add disabled state (opacity 0.4, cursor not-allowed, pointer-events: none) to Button.astro and global.css. Add an active state (subtle scale or brightness shift). Consider a loading prop with a spinner or skeleton.
**Suggested command**: `/impeccable harden src/components/Button.astro`

### [P2] Missing prose element styling: h4-h6, img, overflow-wrap
**Why it matters**: When docs use h4, h5, or h6 headings, they render with browser defaults (bold ~700 weight instead of design system 600). Images in docs content can overflow their container. Long inline code or URLs can break layout on narrow viewports. The docs are this site's primary content — incomplete prose styling undermines the documentation's credibility.
**Fix**: Add `.prose h4 { font-size: 0.9375rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }` (and similarly for h5/h6). Add `.prose img { max-width: 100%; height: auto; border-radius: var(--radius-md); }`. Add `overflow-wrap: break-word` to `.prose`.
**Suggested command**: `/impeccable polish src/styles/global.css`

### [P2] No `prefers-contrast` media query support
**Why it matters**: Users who set OS-level "increased contrast" preferences get no adaptation, despite multiple confirmed contrast failures (P0, P1). The `prefers-contrast: more` query could swap `--ink-3` for `--ink-2` and bump `--ink` to pure white to rescue readability.
**Fix**: Add `@media (prefers-contrast: more) { :root { --ink-3: var(--ink-2); --edge: var(--ink-3); } }` to boost the lowest-contrast tokens.
**Suggested command**: `/impeccable adapt src/styles/global.css`

### [P3] Design system defined by bans rather than affirmative choices
**Why it matters**: The system perfectly satisfies every anti-pattern ban but doesn't offer anything affirmatively distinctive in their place. Visitors can tell what the site ISN'T but not what it IS. For a brand surface, "not generic" is table stakes — "memorable" is the bar. The LogoMark's rotated-diamond motif is the most distinctive visual element and remains entirely unextended into the design system.
**Fix**: Extend the logo mark's visual language (rounded rects + rotated diamonds) into section dividers, callout containers, loading indicators, or a bento-grid layout. Define 1–2 affirmative visual signatures the site owns rather than just the absence of patterns it refuses.
**Suggested command**: `/impeccable bolder src/styles/global.css`

---

## Persona Red Flags

> Landing page / marketing → **Jordan** (first-timer), **Riley** (deliberate evaluator), **Casey** (distracted mobile)

**Jordan (first-time visitor, skeptical)**:
- System fonts may read as "underfunded" — Jordan opens the site, sees no distinctive typography, and mentally categorizes it as a side project rather than a tool worth trusting with career data
- No animation or entrance sequence — nothing signals "crafted experience" on first load; the page appears fully formed with no reveal rhythm
- No social proof signals (logos, testimonials, user count) — Jordan has no external validation to overcome initial skepticism about an unknown AI tool
- The restrained palette doesn't visually communicate "AI interview tool" — the hero text carries all the explanatory burden with no visual shorthand

**Riley (comparison shopper, evaluating before committing)**:
- Comparison table is visually flat — no icons, no color coding beyond a pale ember tint on the Pro column header, no visual hierarchy helping Riley prioritize feature differences
- No visual distinction between "this is the product" and "this is the marketing" — the same tonal hierarchy treats screenshots and marketing copy identically, so Riley can't visually discern what the actual product UI looks like
- No performance signals — no loading states, no perceived-performance optimization; Riley on a slower connection infers the product itself is slow

**Casey (returning visitor, ready to decide)**:
- End of page (Download section) has no emotional echo of the peak (Hero) — Casey scrolls to the bottom ready to commit but finds two flat bordered cards with no brand texture, no warmth, no sense of occasion
- No community or activity signal — Casey wondering "is this project active?" gets no cues (no GitHub stars count, no version currency, no download count); the flat design doesn't signal vitality
- Prose docs use the same visual language as marketing — Casey reading docs to make a final decision can't distinguish between documentation and sales content because both share the same ink/edge/ember tokens

---

## Minor Observations

- Body font-size 0.9375rem (15px) is slightly below the 16px web accessibility baseline — worth A/B testing for readability
- No `::selection` color defined — a warm terracotta-tinted selection would be a cheap brand-consistency win
- Prose `pre` and `blockquote` both use `--surface` as background, making two semantically different elements visually indistinguishable
- Firefox receives no custom scrollbar styling (only `::-webkit-*` selectors provided) — should add `scrollbar-width: thin; scrollbar-color: var(--edge) transparent;` for Firefox
- Footer heading labels use uppercase tracking-wider — borderline with the brand.md ban on all-caps body copy (these are headings, not body, so technically fine)
- No `scroll-behavior: smooth` on html — in-page anchor links (`#how-it-works`, `#compare`) jump without animation
- `@theme inline` block placement between token declarations and `@layer` declarations is semantically unclear; consider moving to the top for readability
- DocSidebar component uses `border-l-2` for active nav state — same pattern as the blockquote; this appears to also be a DESIGN.md exception for functional indicators

---

## Questions to Consider

- If the Persona product is "private, local-first, warm, honest" — does the marketing site need to feel MORE like the product or DIFFERENT from it? What does the marketing site offer that the product's own UI cannot?
- System fonts are a strong product-value signaling choice. On a marketing site where conversion is the goal, is privacy-signaling through type worth the cost of visual anonymity? What if the type choice actively reduces trust by looking "too cheap for a real product"?
- The design system follows every ban from DESIGN.md perfectly. What would it look like to deliberately break one as a brand statement?
