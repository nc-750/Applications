# Mirror App's Structure

```
mirror/app/
├── assets              # Static design assets used outside the build (e.g. logo.png)
├── bun.lock            # Bun lockfile — pinned dependency versions
├── CHANGELOG.md        # Human-facing release/change history
├── CLAUDE.md           # Mirror app guide for Claude Code (stack, architecture, decisions)
├── CONVENTIONS.md      # Binding coding conventions (data modeling, layering, stores, naming)
├── devenv.lock         # devenv lockfile for the reproducible dev environment
├── devenv.nix          # devenv environment definition (tooling, shell)
├── devenv.yaml         # devenv inputs/config
├── dist                # Production build output (generated)
├── docs                # Project documentation (architecture, guides, plans, this file)
├── index.html          # Vite/PWA HTML entry point; CSP meta for the browser build
├── issues              # Tracked issue notes/repros (e.g. broken-layout)
├── node_modules        # Installed dependencies (generated)
├── package.json        # Package manifest — scripts and dependencies
├── public              # Static files served as-is (fonts, icons, CNAME, .nojekyll)
├── README.md           # Project overview and getting-started notes
├── scripts             # Build/maintenance scripts (icon generation, Pages postbuild)
├── src                 # Application source (Vue 3 + TS, layered per feature)
├── src-tauri           # Tauri v2 desktop shell (Rust): config, commands, OS keyring
├── TODO.md             # Outstanding tasks
├── tsconfig.json       # TypeScript config for the app
├── tsconfig.node.json  # TypeScript config for Node-side tooling (Vite config, scripts)
├── vite.config.ts      # Vite build + dev server + PWA plugin config
└── vitest.config.ts    # Vitest test runner config
```
