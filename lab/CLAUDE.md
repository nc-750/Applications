# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this directory.

## What this is

The Lab design system — a "Tactile Industrial Hardware" aesthetic. Token-driven CSS, Vue 3 component library, and a theme generator app. Read `lab/DESIGN.md` for the complete design spec (colors, typography, components, elevation, rules) and `lab/PRODUCT.md` for product framing and anti-references.

## Packages

| Package | Purpose |
|---------|---------|
| `lab-vue/` | Vue 3 component library — typed facade emitting class strings only |
| `generator-app/` | Tauri desktop app — showcases the system, customizes themes, exports CSS |

## Dev commands

### lab-vue

```bash
cd lab/lab-vue
npm run dev          # playground on localhost:5173
npm run build        # type-check (vue-tsc) + library build (es + umd + style.css)
```

### generator-app

```bash
cd lab/generator-app
npm run dev          # Vite dev server (port 1420)
npm run tauri dev    # Full Tauri v2 desktop app
npm run verify       # WCAG-AA + static output verification (vite-node)
```

## Canonical CSS source

`generator-app/css/` — 17 modular CSS files. `enclosure.tokens.css` defines every `--nc-*` custom property. The seed system (`--nc-seed-h/s/l` for surfaces, `--nc-accent-h/s/l` for accent) drives all color tokens through `hsl()` + `calc()`. Component sheets (buttons, inputs, surfaces, console, etc.) reference tokens exclusively — no hardcoded colors.

`lab-vue/src/style.css` is a vendored flat copy of the generated enclosure.css. It ships as the library's `style.css` export.

## Generator engine

`generator-app/src/generator/` — three-stage pipeline:

1. **`derive.ts`** — declarative token specs (`TokenSpec[]`) for light and dark themes. `deriveAll(seed, accent)` resolves every CSS variable to HSL.
2. **`wcag.ts`** — auto-adjusts foreground lightness to meet WCAG 2.1 AA on critical pairs. Entry point: `buildAdjustedThemes()`.
3. **`flatten.ts`** — concatenates modular CSS into a single file. Two modes: rethemable (keeps `calc()`/`var()`) and static (pre-computed `hsl()` literals, no `--nc-seed-*`).

`verify.ts` validates WCAG compliance across adversarial seed matrices and static output correctness.

## lab-vue conventions

Components are a **class-string facade** — they render the real HTML tag the CSS expects, carry the base `.nc-*` class, and map typed props to modifier classes. No `<style>` blocks, no color/spacing props. Form controls and behavioral controls (`Switch`, `Knob`, `Fader`, `Segmented`) support `v-model`.

The library build copies `src/style.css` verbatim to `dist/style.css` via a custom Vite plugin. No component imports the stylesheet — consumers `import "lab-vue/style.css"` once at their app root.
