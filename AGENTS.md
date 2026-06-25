# AGENTS.md

AI coding agent instructions for **nc750**

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