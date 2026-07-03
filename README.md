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

- **NC-750 brand philosophy**: 
  - Data Sovereignity: You own your data. We do not sell it.
  - Pragmatic Telemetry: Zero telemetry when possible, product metrics only, opt-in, anonymous. 
  - User Always In Control: Bring Your Own Key, never locked to the ecosystem, leave it whenever you wish.

You can read more about the philosophy behind the project in its [Manifesto](https://github.com/nc-750/Manifesto).

## Reference per project

- [Libs/Lab/docs/STRUCTURE.md](Libs/Lab/docs/STRUCTURE.md) - Lab design system folder structure
- [Libs/LLM/docs/STRUCTURE.md](Libs/LLM/docs/STRUCTURE.md) - LLM lib folder structure
- [Mirror/Docs/STRUCTURE.md](Mirror/Docs/STRUCTURE.md) - Mirror project folder structure
  - [Mirror/App/docs/STRUCTURE.md](Mirror/App/docs/STRUCTURE.md) - Mirror app's structure