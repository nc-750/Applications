# NC-750 - Applications

**Project Name:** NC-750  
**Project Description:** NC-750 is a brand which develops software solution with a heavy focus on user data respect and privacy with as minimum telemetry as possible.   
**Current Repository:** The applications being developed under the NC-750 branding and ethos

## Organization

```
nc-750/
├── Libs
│   ├── Lab     # Implementation of the NC-750 visual design language called Lab
│   └── LLM     # LLM library to be integrated in the different NC-750 projects
├── Mirror      # Project that interviews the user, finds patterns you missed, and produces a private insight document and a polished public profile
└── Devenv      # Devenv root files to be shared by each projects relying on it for its dev environment management
```

## Cross-cutting conventions

- **NC-750 brand philosophy**: total data ownership (local-first; user content never hits an NC-750 server, is never sold, never trains anything), "you are never the product" (no person is tracked; any product metrics are opt-in, anonymous, aggregate, self-hosted), BYOK or a no-log relay for AI integrations, themeable industrial design. Read `brand/BRAND.md` for the dossier and **`brand/ETHOS.md` for the binding product constraints** every NODE/UNIT/CORE must satisfy.

## Reference per project

- [brand/docs/STRUCTURE.md](brand/docs/STRUCTURE.md) - Brand manifesto folder structure
- [lab/docs/STRUCTURE.md](lab/docs/STRUCTURE.md) - Lab design system folder structure
- [llm/docs/STRUCTURE.md](llm/docs/STRUCTURE.md) - LLM lib folder structure
- [mirror/docs/STRUCTURE.md](mirror/docs/STRUCTURE.md) - Mirror project folder structure
  - [mirror/app/docs/STRUCTURE.md](mirror/app/docs/STRUCTURE.md) - Mirror app's structure