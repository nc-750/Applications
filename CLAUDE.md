# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mono-repo structure

| Directory | Purpose | Own CLAUDE.md |
|-----------|---------|---------------|
| `brand/` | NC-750 brand manifesto, philosophy, naming, visual language | — |
| `lab/` | Lab design system (CSS, Vue 3 library, theme generator) | `lab/CLAUDE.md` |
| `mirror/` | Mirror (NODE-0M) — BYOK career reflection app | `mirror/persona-app/CLAUDE.md` |

Each directory is an independent package with its own `package.json`, `tsconfig.json`, and build tooling. There is no monorepo-level orchestrator (no workspaces, no Turborepo).

## Cross-cutting conventions

- **NC-750 brand philosophy**: total data ownership (local-first; user content never hits an NC-750 server, is never sold, never trains anything), "you are never the product" (no person is tracked; any product metrics are opt-in, anonymous, aggregate, self-hosted), BYOK or a no-log relay for AI integrations, themeable industrial design. Read `brand/BRAND.md` for the dossier and **`brand/ETHOS.md` for the binding product constraints** every NODE/UNIT/CORE must satisfy.
- **No Tailwind in Lab design-system CSS**. The design system is pure custom properties + hand-written component rules. Tailwind v4 is used only in the generator-app and persona-app for app-level layout utilities.
- **TypeScript strict mode** throughout with `noUnusedLocals` and `noUnusedParameters`.
- **Tauri v2** is used by both `lab/generator-app` (port 1420) and `mirror/persona-app` (port 1421).

## Key reference files

- `brand/BRAND.md` — brand identity, product naming architecture (NODE/UNIT/CORE), visual guidelines
- `lab/DESIGN.md` — complete design spec: seed-driven color system, typography hierarchy, component catalog, elevation model, do's and don'ts
- `lab/PRODUCT.md` — product framing and anti-references for the design system
- `mirror/persona-app/CLAUDE.md` — Mirror app architecture, stack, data model, design decisions, dev commands
