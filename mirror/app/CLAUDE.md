# Mirror (NODE-0M)

Cross-platform desktop + PWA that wraps the mirror-interview, mirror-insight, and mirror-profile skills with a bring-your-own-AI model.

## Stack

- **Vue 3 + TypeScript** — frontend framework (`<script setup>` SFCs)
- **Vite 7** — build tool, `npm run dev` starts the dev server on port 1420
- **enclosure-vue** — design system; the `.nc-*` stylesheet is imported once in `src/main.ts`
  (`enclosure-vue/style.css`), with app-level layout patterns in `src/styles/global.css`. Color
  seeds are supplied in `src/index.css` (the published package CSS ships them as `{{…}}` template
  tokens). No Tailwind.
- **Tauri v2** — desktop wrapper; `npm run tauri dev` starts the full Tauri app
- **Pinia** — state management (`src/stores/`, setup stores); each store reads/writes IndexedDB
  directly. `persona`/`interview` records use `shallowRef` so whole-object records stay
  structured-cloneable for IndexedDB.
- **idb** — IndexedDB wrapper (`src/db/schema.ts` owns the connection + types)
- **vite-plugin-pwa** — PWA service worker + manifest

## Dev commands

```bash
npm run dev          # Vite dev server (browser, port 1420)
npm run tauri dev    # Full Tauri desktop app
npm run build        # Production build + TypeScript check
npx tsc --noEmit     # Type check only
```

## Architecture

```
src/
├── types/persona.ts          # PersonaJSON Zod schema + inferred types (canonical)
├── db/schema.ts              # IndexedDB connection, record types, wipe helper
├── stores/                   # Pinia setup stores (settings, persona, interview) — write to idb directly
├── llm/                      # LLM client: two wire shapes + a provider config table
│   ├── types.ts              # LLMProvider / LLMConfig / Message / Provider
│   ├── openai.ts             # openaiShape() — /chat/completions + /models (OpenAI, Mistral, compatible)
│   ├── anthropic.ts          # anthropicShape() — /messages + /models
│   └── index.ts              # PROVIDERS table, createLLMProvider, listModels, testConnection
├── skills/                   # Flat: one file per skill function
│   ├── html.ts               # Shared renderer helpers (esc, groupSkills)
│   ├── interviewPrompt.ts    # buildSystemPrompt()
│   ├── interviewExtractor.ts # extractPersonaJSON() — scans assistant msg for a valid persona.json
│   ├── insightRenderer.ts    # renderInsight() — deterministic private HTML
│   ├── profileRenderer.ts    # renderProfile() — deterministic public HTML
│   └── profileSynthesizer.ts # synthesizeHowIWorkBest() — one-shot LLM call
└── components/
    ├── layout/AppShell       # Sidebar (desktop) + bottom nav (mobile)
    ├── settings/             # Provider/model/key + data management
    ├── interview/            # Full chat UI, welcome, data input, completion
    ├── insight/              # Insight iframe view + download
    └── profile/              # Profile iframe view + download
```

## Key design decisions

- **One mirror per device** — stored under key `"default"` in IndexedDB
- **"How I Work Best"** — synthesized by LLM exactly once at interview completion, then cached in `persona.derived.how_i_work_best`. All subsequent profile renders are LLM-free.
- **Renderers are deterministic** — `skills/insightRenderer.ts` and `skills/profileRenderer.ts` are pure TypeScript functions: `PersonaJSON → HTML string`. No randomness. Shared escaping/grouping helpers live in `skills/html.ts`.
- **LLM client is data, not classes** — `src/llm/` has exactly two wire-format implementations (`openaiShape`, `anthropicShape`). Each provider is one row in the `PROVIDERS` table in `index.ts` mapping `provider → { shape, baseUrl }`. Adding a provider that speaks an existing format is a one-line table entry.
- **Models are fetched live** — the Settings panel calls `listModels(config)` which hits the provider's `/models` endpoint. There is no hardcoded model list to keep up to date; the user can still type any model name.
- **No data-access layer** — Pinia stores call `getDB()` and read/write IndexedDB directly. There is no repository/`operations` indirection; each persisted mutation is written to disk and to in-memory state in a single store action.
- **Insight/Profile shown in iframes** — `<iframe :srcdoc="html" sandbox="allow-same-origin">` isolates their CSS from the app shell.
- **Rendered HTML is self-contained** — no remote font, image, or script references. A `default-src 'none'; style-src 'unsafe-inline'` CSP meta tag is baked into every exported document so opening it from disk or hosting it can't execute scripts.
- **Persona import/extract validation** — both the JSON import flow and the interview extractor go through the same Zod schema (`PersonaJSONSchema` in `src/types/persona.ts`). Schema and TS types share a single source of truth via `z.infer`.
- **CSP is enforced** in both `tauri.conf.json` and `index.html` (PWA). The policy pins `connect-src` to OpenAI / Anthropic / Mistral plus a permissive `https:` to cover user-supplied openai-compatible endpoints. A future enhancement (TODO in `index.html`) is to regenerate CSP from settings so `connect-src` matches the active endpoint exactly.
- **Local key store** — `src/lib/keyStore.ts` stores the API key via OS-native credential storage (`keyring` Rust crate): Windows Credential Manager on Windows, Keychain on macOS, Secret Service on Linux. The key is never written to disk as plaintext. In the PWA, the key falls back to IndexedDB.

## Data model

| Store | Key | Content |
|-------|-----|---------|
| `settings` | `"default"` | provider, model, apiKey (PWA only — empty string on Tauri), endpoint |
| `persona` | `"default"` | data (PersonaJSON) + derived.how_i_work_best |
| `interview` | `"default"` | status, messages[], initialData |

On Tauri, the API key lives exclusively in the OS credential store (not in IndexedDB).

## Supported LLM providers

| Provider | Wire shape | Config |
|----------|-----------|--------|
| OpenAI | openai | apiKey only |
| Mistral | openai | apiKey only |
| Anthropic | anthropic | apiKey only |
| OpenAI-compatible | openai | apiKey + endpoint (Groq, Together, OpenRouter, Ollama) |
