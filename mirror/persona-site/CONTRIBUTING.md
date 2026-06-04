# How to edit this site (no LLM needed)

The Persona marketing site is built with [Astro](https://astro.build), but you don't need to know Astro to make most changes. Almost all visible content lives in plain text files.

## Quick start

```bash
git clone https://github.com/vendinois/persona.git
cd persona-site
npm install
npm run dev        # opens http://localhost:4321 — changes hot-reload instantly
```

## Where to change things

### Landing page copy

**File:** `src/config.ts`

This is the single source of truth for all landing page text, pricing, links, and navigation. Open it, find the string you want to change, edit it, save. The browser updates instantly.

Things you can change here:
- `SITE.tagline` — the hero headline
- `SITE.description` — the hero subheadline
- `PRICING.proPriceRange` — the displayed price
- `PRICING.lemonSqueezyUrl` — the purchase link
- `LANDING_FEATURES` — the 3 feature cards
- `HOW_IT_WORKS_STEPS` — the 3-step section
- `COMPARISON_FEATURES` — the Free vs Pro table
- `NAV` — the top navigation links
- `FOOTER_LINK_GROUPS` — the footer links

### Docs pages

**Folder:** `src/content/docs/`

Each doc page is a Markdown file. They look like this:

```markdown
---
title: "Page Title"
description: "What this page is about"
order: 3
---

Content goes here. Regular Markdown works.

## Section heading

- Bullet points
- More content
```

`order` controls the sidebar position (1 = first, 2 = second, etc.).

### Adding a new doc page

1. Create a new `.md` file in `src/content/docs/`.
2. Add frontmatter with `title`, `description`, and `order`.
3. Save — the sidebar auto-generates. No code changes needed.

### Design (colors, fonts, spacing)

**File:** `src/styles/global.css`

The design tokens (colors, border radii) are at the top. These match the Persona app's design system. Change them here and the whole site updates.

### Logo

**File:** `src/assets/logo-mark.svg`

Replace this file to change the logo. It should be a square SVG that uses `currentColor` for strokes.

### Screenshots

**Folder:** `public/screenshots/`

Drop PNG files here organized by device and theme: `desktop/light/`, `desktop/dark/`, `mobile/light/`, `mobile/dark/`. Naming: `<Interview|Insight|Profile>_<Desktop|Mobile>_<Dark|Light>.png`. Use `theme-img-light` and `theme-img-dark` classes for automatic theme switching.

## Things you don't need to touch

| What | Why |
|------|-----|
| `src/pages/` | Page structure and section composition. Only change if adding a new page type. |
| `src/components/` | Reusable components (nav, footer, hero, etc.). Only change for structural redesigns. |
| `astro.config.ts` | Site config. Only change for domain or build settings. |
| `tsconfig.json` | TypeScript config. No need to touch. |

## Deploy

```bash
npm run build     # produces dist/ — pure static HTML/CSS/JS
npm run preview   # previews the built site locally
```

Upload `dist/` to any static host (GitHub Pages, Cloudflare Pages, Netlify, Vercel, any web server). No server software needed — these are static files.

## Tech stack reference

| Layer | What | Why it was chosen |
|-------|------|-------------------|
| Framework | Astro 5 | Zero JS by default, great SEO, markdown content collections |
| Styling | Tailwind CSS v4 | Same stack as the Persona app itself |
| Content | Markdown (`.md`) | Human-editable with any text editor |
| Output | Static HTML | Deploy anywhere, no server needed |
