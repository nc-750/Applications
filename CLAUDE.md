# CLAUDE.md

## Project Overview

**Project Name:** NC-750
**Project Description:** NC-750 is a brand which develops software solution with a heavy focus on user data respect and privacy with as minimum telemetry as possible. 

## Organization

```
nc-750/
├── brand           # Brand manifesto, philosophy, naming, visual language and ethos
├── lab             # Implementation of the NC-750 visual design language called Lab
├── llm             # LLM library to be integrated in the different NC-750 projects
├── mirror          # Project that interviews the user, finds patterns you missed, and produces a private insight document and a polished public profile
├── shared          # Devenv root files to be shared by each projects relying on it for its dev environment management
├── AGENTS.md       # This file
└── CLAUDE.md       # Equivalent of this file, but for Claude Code
```

## Cross-cutting conventions

- **NC-750 brand philosophy**: total data ownership (local-first; user content never hits an NC-750 server, is never sold, never trains anything), "you are never the product" (no person is tracked; any product metrics are opt-in, anonymous, aggregate, self-hosted), BYOK or a no-log relay for AI integrations, themeable industrial design. Read `brand/BRAND.md` for the dossier and **`brand/ETHOS.md` for the binding product constraints** every NODE/UNIT/CORE must satisfy.

## Reference per project

- [brand/docs/STRUCTURE.md](brand/docs/STRUCTURE.md) - Brand manifesto folder structure
- [lab/docs/STRUCTURE.md](lab/docs/STRUCTURE.md) - Lab design system folder structure
- [llm/docs/STRUCTURE.md](llm/docs/STRUCTURE.md) - LLM lib folder structure
- [mirror/docs/STRUCTURE.md](mirror/docs/STRUCTURE.md) - Mirror project folder structure
  - [mirror/app/docs/STRUCTURE.md](mirror/app/docs/STRUCTURE.md) - Mirror app's structure


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
