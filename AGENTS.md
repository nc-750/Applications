# AGENTS.md

NC-750 monorepo — three independent packages with no npm workspaces, Turborepo, or root orchestrator. Always `cd` into a package before running commands.

## Directory map

| Directory | What | Detailed instructions |
|-----------|------|-----------------------|
| `brand/` | Brand manifesto, naming architecture (NODE/UNIT/CORE), visual language | Static docs — see `brand/BRAND.md` |
| `lab/` | Lab design system — Vue 3 component library + theme generator Tauri app | `lab/CLAUDE.md` |
| `mirror/` | Persona — BYOK career reflection Tauri app + Astro marketing site | `mirror/persona-app/CLAUDE.md` |

## Cross-cutting conventions

- `CLAUDE.md` at the repo root covers conventions shared across all packages
- **No Tailwind** in Lab design-system CSS — pure custom properties only
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters` throughout

## Key reference docs

- `brand/BRAND.md` — brand identity, naming, visual guidelines
- `lab/DESIGN.md` — seed-driven color system, typography, component catalog
- `lab/PRODUCT.md` — product framing for the design system
- `mirror/DESIGN.md` — Persona app design spec
- `mirror/PRODUCT.md` — Persona product framing
