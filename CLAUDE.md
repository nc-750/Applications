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

## Rationale capture (active experiment — honesty over polish)

At the end of each discrete unit of work that involved a real decision, append
one JSON file to `.rationale-log/` recording that decision. This feeds an
experiment about whether captured rationale is worth more than what a diff
already shows, so honest-and-terse beats thorough-and-polished.

Rules:
- One node per decision that closed off an alternative. Not one per message, not
  one per intermediate step, not one per file changed. Several independent
  decisions in one unit of work => several nodes. No real decision (pure
  mechanical execution) => no node.
- Record the resolved decision, not the search. Do not log what you tried and
  backed out of, intermediate states, or your step-by-step process. Log what was
  decided and why.
- `alternative_not_taken` is required. Name the concrete path you chose against,
  and why. If there was no real fork — the choice was forced or obvious — write
  exactly that. Never invent an alternative to fill the field.
- Be honest and terse. If the reason was obvious, say so briefly. Do not inflate
  a simple decision into a narrative.
- `rationale_source` is always "agent_inferred". You are reporting your own
  reasoning. Leave `human_rationale` as null — the human fills it in later only
  if they hold a reason you could not have known.
- Leave `derived_from` as []. The human links nodes afterward.
- Do not judge whether the decision was good, and do not assess your own
  process. Only record what was decided and the reason.

Write to `.rationale-log/YYYYMMDD-HHMMSS-<short-slug>.json`:

{
  "id": "YYYYMMDD-HHMMSS-<short-slug>",
  "timestamp": "<ISO 8601 timestamp>",
  "derived_from": [],
  "files_touched": ["path/one", "path/two"],
  "decision": "<what was chosen / what changed, 1-2 sentences>",
  "alternative_not_taken": "<the path chosen against and why; or 'none — forced/obvious choice'>",
  "rationale": "<why the chosen path, honestly; terse is fine>",
  "rationale_source": "agent_inferred",
  "human_rationale": null
}
