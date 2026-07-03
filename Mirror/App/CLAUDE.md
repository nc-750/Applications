# Mirror (NODE-0M)

Cross-platform desktop + PWA that wraps the mirror-interview, mirror-insight, and mirror-profile skills with a bring-your-own-AI model.

**Coding conventions:** see `CONVENTIONS.md` — binding rules for data modeling, layering, stores, services, utilities, naming, components, and error handling. Read it before writing, refactoring, or reviewing code.

> **Build tool:** this repo uses **bun** (`bun run …`, `bunx …`) — not npm/npx/node.

## Stack

- **Vue 3 + TypeScript** — frontend framework (`<script setup>` SFCs)
- **Vite 7** — build tool, `bun run dev` starts the dev server on port 1421
- **@nc-750/lab-vue** — design system (the "Lab"); the `.nc-*` stylesheet ships as `@nc-750/lab-css`
  (`lab.css`) and is imported once in `src/main.ts`. App-level layout patterns live in
  `src/styles/global.css`; color seeds in `src/index.css`. Tailwind is used only for app-level
  layout utilities (no `.nc-*` restyling).
- **Tauri v2** — desktop wrapper; `bun run tauri dev` starts the full Tauri app
- **Pinia** — state management; stores are **per-feature** real `defineStore` setup stores
  (`<feature>/stores/`). Each store commits through its own feature `db/` module. Single-aggregate
  stores (persona, interview) hold one `reactive<Feature>(createEmpty…())` and mutate it in place
  with `Object.assign` (never rebind); the persist path hands the db module a JSON-cloned plain copy.
- **idb** — IndexedDB wrapper; `src/db/Database.ts` owns the single connection, schema, and the
  `wipeDatabase()` primitive.
- **vite-plugin-pwa** — PWA service worker + manifest

## Dev commands

```bash
bun run dev          # Vite dev server (browser, port 1421)
bun run tauri dev    # Full Tauri desktop app
bun run build        # vue-tsc --noEmit (SFC-aware type check) + production build
bunx vue-tsc --noEmit # Type check only — use this, NOT `tsc` (tsc skips .vue files)
bun run test         # vitest
```

## Architecture

Layered per feature, one dependency direction `view → service → store → db` (CONVENTIONS §2).
Each feature folder owns its own model, DTO, store, and services; foundational/shared layers sit
at the top level.

```
src/
├── main.ts                  # Bootstrap; imports lab-css once, mounts App
├── App.vue                  # App root + inline shell layout (sidebar / bottom nav)
├── router/                  # vue-router route table
├── core/                    # Cross-feature lifecycle (Wipe.ts — factory reset, rule 5.7/5.8)
├── db/Database.ts           # Central IndexedDB connection, schema, wipeDatabase() primitive
├── llm/                     # App-side LLM layer (wire clients live in @nc-750/llm-ts)
│   ├── types.ts             # LLMProvider enum / LLMConfig
│   ├── factory.ts           # createClientFromConfig — the ONE place a client is built (4.7/4.8)
│   └── index.ts             # barrel
├── logger/                  # Foundational logger — module-level reactive state (rule 5.3)
├── fileManager/services/    # File text extraction (fileExtractor.ts) + generic file helpers (utils.ts)
└── <feature>/               # settings · persona · interview · insight · profile · privacy · welcome
    ├── models/              # domain model + createEmpty<X>() factory (rules 1.1–1.3)
    ├── reference/           # lookup/reference tables — providers, facets, labels (rule 1.2)
    ├── db/                  # feature DTO + read/write fns over the shared connection (rule 2.8)
    ├── mappers.ts           # to<Target>/from<Source> boundary transforms (rule 1.6)
    ├── stores/              # real defineStore setup store (rules 3.x)
    ├── prompts/             # interview only — LLM prompt builders + Zod schemas for structured output
    ├── services/            # app logic & orchestration (rules 4.x)
    ├── composables/         # reactive adapters only (e.g. interview/useInterviewClient) (rule 4.6)
    ├── components/          # feature Cells / Bands (Lab contract, rules 7.2–7.7)
    └── pages/               # the feature's top-level route view
```

## Key design decisions

- **One mirror per device** — stored under key `"default"` in IndexedDB
- **"How I Work Best"** — synthesized by the LLM exactly once at interview completion (the synthesis
  flow), then cached in `persona.derived.how_i_work_best`. Subsequent profile renders are LLM-free.
- **LLM client construction is centralized** — `createClientFromConfig` in `src/llm/factory.ts` is
  the only code that builds a client from settings, and `PROVIDER_KIND` is the single
  `LLMProvider → ProviderKind` mapping (4.7/4.8). The wire-format clients themselves live in the
  shared `@nc-750/llm-ts` package; its `Result` is unwrapped at the factory boundary and never
  travels up (4.10).
- **Per-feature db modules, no central data-access layer** — each feature owns its `db/` folder (DTO
  + read/write) over the shared `src/db/Database.ts` connection. Stores commit through their feature
  db module; no store/service/view opens its own connection or constructs a DTO (rules 2.2, 2.8).
- **Insight is native Vue** — `insight/pages/InsightPage.vue` composed of `insight/components/*Cell.vue`
  bound directly to the persona store. (The old iframe + deterministic-HTML-renderer approach was
  removed.) **Profile is currently a stub** (`profile/pages/ProfilePage.vue`) pending a layered refactor.
- **Persona import/extract validation** — untrusted input (imported files, LLM output) is validated
  with a Zod boundary schema in the persona feature, then transformed into the hand-written domain
  model; schema and boundary type share one source via `z.infer` (rules 1.9–1.10).
- **CSP is enforced** in both `tauri.conf.json` and `index.html` (PWA): `connect-src` is pinned to
  OpenAI / Anthropic / Mistral plus a permissive `https:` for user-supplied openai-compatible
  endpoints. A future enhancement (TODO in `index.html`) regenerates CSP from settings so
  `connect-src` matches the active endpoint exactly.
- **Local key store** — `src/settings/db/keyStore.ts` stores the API key via OS-native credential
  storage (`keyring` Rust crate): Windows Credential Manager, macOS Keychain, Linux Secret Service.
  The key is never written to disk as plaintext. In the PWA, the key falls back to IndexedDB.

## Data model

| Store | Key | Content |
|-------|-----|---------|
| `settings` | `"default"` | provider, model, apiKey (PWA only — empty string on Tauri), endpoint |
| `persona` | `"default"` | data (Persona) + derived.how_i_work_best |
| `interview` | `"default"` | status, messages[], initialData |

On Tauri, the API key lives exclusively in the OS credential store (not in IndexedDB).

## Supported LLM providers

| Provider | Wire shape | Config |
|----------|-----------|--------|
| OpenAI | openai | apiKey only |
| Mistral | openai | apiKey only |
| Anthropic | anthropic | apiKey only |
| OpenAI-compatible | openai | apiKey + endpoint (Groq, Together, OpenRouter, Ollama) |
