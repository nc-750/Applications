# Persona

**A private, bring-your-own-AI app that turns your career history into honest self-knowledge — and a polished public profile you can share.**

Persona interviews you about your work, analyses what you tell it, and produces two outputs:

- **Insight** — a private self-knowledge document: strengths with evidence, growth areas, hidden assets, personality dimensions, values, and goals. For your eyes only — reflection, interview prep, working with a coach.
- **Profile** — a polished, shareable professional page for recruiters, clients, and collaborators. Growth areas are deliberately excluded; in their place is a constructive *"How I Work Best"* section.

It runs as a **cross-platform desktop app** (Windows, macOS, Linux via Tauri) and as an **installable PWA** in the browser.

---

## Why it exists

Most "build your profile" tools send your career data to someone else's server and lock you into their model. Persona is built on three principles:

1. **Your data stays yours.** Everything lives locally — your answers, your generated persona, your API key. There is no Persona backend; nothing is uploaded to us, because there is no "us" in the loop.
2. **Bring your own AI.** You supply an API key for a provider you already trust (OpenAI, Anthropic, Mistral, or any OpenAI-compatible endpoint including a local model via Ollama). The app talks to that provider directly from your machine.
3. **Honesty over marketing.** The private Insight document is candid about growth areas. The public Profile translates that same self-awareness into something constructive, never exposing weaknesses.

## How it works

```
Your CV / LinkedIn / notes
          │
          ▼
   ┌─────────────┐   targeted interview      ┌──────────────┐
   │  Interview  │ ───────────────────────▶  │ persona.json │
   └─────────────┘   (streamed chat)         └──────┬───────┘
                                                     │
                        ┌────────────────────────────┴───────────────┐
                        ▼                                             ▼
                 ┌─────────────┐                              ┌──────────────┐
                 │   Insight   │  private HTML                │   Profile    │  public HTML
                 │  (full you) │                              │ (shareable)  │
                 └─────────────┘                              └──────────────┘
```

1. **Feed it context.** Drop in your CV, a LinkedIn export, or just type freely. PDFs, Markdown, HTML, text, and JSON are supported.
2. **Get interviewed.** The app runs a focused excavation interview using your chosen model, streaming the conversation in real time.
3. **Get your persona.** When the interview concludes, the model emits a structured `persona.json`, validated against a strict schema.
4. **Render outputs.** Insight and Profile are produced as **self-contained HTML files** — no remote fonts, scripts, or images — that you can open from disk, host anywhere, or hand to a recruiter.

The *"How I Work Best"* section is synthesised by the LLM exactly once at the end of the interview and cached. Every Insight/Profile render after that is pure, deterministic TypeScript — same input, same output, no further API calls.

## Privacy & security model

- **No backend.** The app has no server of its own. LLM requests go straight from your device to your chosen provider.
- **Local storage only.** Your persona, interview transcript, and settings live in your browser/app's IndexedDB.
- **API key at rest:**
  - **Desktop (Tauri):** stored in the OS credential store via the `keyring` crate — Windows Credential Manager, macOS Keychain, or Linux Secret Service. Never written to disk as plaintext.
  - **PWA:** stored in IndexedDB (the browser has no OS keychain access).
- **Strict CSP.** A `default-src 'none'` Content-Security-Policy is enforced in the app and baked into every exported document, so a rendered profile can't execute scripts even if opened from disk or hosted.
- **One persona per device.** Simple by design — there are no accounts.
- **Full control.** The Settings panel has tiered data-wipe controls: clear just your persona, clear just your AI provider settings, or factory-reset everything.

## Supported AI providers

| Provider | Configuration |
|----------|---------------|
| OpenAI | API key |
| Anthropic | API key |
| Mistral | API key |
| OpenAI-compatible | API key + endpoint URL (Groq, Together, OpenRouter, Ollama, LM Studio, …) |

Available models are fetched live from the provider's `/models` endpoint — no stale hardcoded lists. You can also type any model name directly. For maximum privacy, point the OpenAI-compatible option at a local model served by Ollama or LM Studio.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- For the desktop build: the [Tauri prerequisites](https://tauri.app/start/prerequisites/) (Rust toolchain + your platform's webview/build tools)

### Install

```bash
git clone <repo-url>
cd persona-app
npm install
```

### Run

```bash
npm run dev          # Browser / PWA dev server on http://localhost:1420
npm run tauri dev    # Full desktop app (Tauri)
```

Then open **Settings**, pick a provider, paste your API key, fetch the model list (or type a model name), and start an interview.

### Build

```bash
npm run build        # Type-check + production web build (dist/)
npm run tauri build  # Native desktop installers
```

## Tech stack

- **React 19 + TypeScript** — UI
- **Vite** — build & dev server
- **Tailwind CSS v4** — styling (no config file)
- **Tauri v2** — desktop shell + native key storage (Rust)
- **Zustand** — state management
- **idb** — IndexedDB access
- **Zod** — schema validation (single source of truth for the persona shape)
- **vite-plugin-pwa** — installable PWA

---

## Contributing

Contributions are welcome — bug fixes, provider support, renderer polish, accessibility, and docs all help.

### Project layout

```
src/
├── types/persona.ts   # Canonical persona schema (Zod) + inferred TS types
├── db/schema.ts       # IndexedDB connection, record types, wipe helper
├── stores/            # Zustand stores — read/write IndexedDB directly
├── llm/               # LLM client: two wire shapes + a provider config table
├── skills/            # One flat file per skill function (prompt, extractor, renderers, synthesizer)
└── components/        # UI: layout, settings, interview, insight, profile
```

A deeper tour of design decisions lives in [`CLAUDE.md`](./CLAUDE.md).

### Ground rules

This codebase deliberately favours **boring, conventional, low-abstraction** code. Before adding a layer, an interface, or a config option, ask whether a real current requirement needs it. A few specifics:

- **No data-access layer.** Stores talk to `getDB()` directly. Don't reintroduce a repository/`operations` wrapper.
- **LLM providers are data.** If a new provider speaks the OpenAI or Anthropic wire format, add a one-line entry to the `PROVIDERS` table in `src/llm/index.ts` — don't create a new class.
- **Renderers stay deterministic.** `insightRenderer.ts` / `profileRenderer.ts` are pure `PersonaJSON → string`. Keep LLM calls out of them. Always escape interpolated values with `esc()` from `skills/html.ts` — it's the XSS boundary.
- **Schema is the source of truth.** Change `PersonaJSONSchema` in `src/types/persona.ts`; the TS types are inferred from it via `z.infer`. Don't hand-write parallel types.
- **Keep exports self-contained.** Rendered HTML must not reference remote fonts, scripts, or images, and must carry the strict CSP meta tag.

### Workflow

1. Fork and create a branch off `master`.
2. Make your change. Keep commits focused; use clear, conventional messages (e.g. `fix: …`, `feat: …`, `refactor: …`).
3. **Type-check before pushing:**
   ```bash
   npx tsc --noEmit     # must pass clean
   npm run build        # full build sanity check
   ```
   If you touched the Rust side, also confirm `npm run tauri dev` links.
4. Verify your change in the running app (browser via `npm run dev`, and Tauri if your change touches native code or key storage).
5. Open a pull request describing **what** changed and **why**, with screenshots for UI changes.

### Good first contributions

- Additional OpenAI-compatible endpoint presets in Settings.
- Profile/Insight render themes or templates.
- Accessibility and keyboard-navigation improvements.
- Tightening the CSP `connect-src` to match the active endpoint (see the TODO in `index.html`).
- A small Vitest suite covering store round-trips (load → mutate → reload) and the persona Zod schema.
