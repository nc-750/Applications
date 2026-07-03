# Development Guide

Setting up Mirror (NODE-0M) for local development and contributing changes.

---

## Prerequisites

- **Node.js** 18 or later
- **Rust toolchain** — only needed for the Tauri desktop build. Install via [rustup](https://rustup.rs).
- **Platform-specific Tauri dependencies** — see the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

---

## First-time setup

```bash
git clone <repo-url>
cd app
npm install
```

---

## Running the app

```bash
npm run dev          # Vite dev server — browser/PWA on http://localhost:1420
npm run tauri dev    # Full Tauri desktop app
```

The Vite dev server is the fastest way to iterate on UI changes. Use the Tauri dev command when working on the Rust backend, OS keyring, or native features.

---

## Building

```bash
npm run build        # Type-check + production web build → dist/
npm run tauri build  # Native desktop installers
```

---

## Type checking

```bash
npx tsc --noEmit     # Type check only, no emit
```

This must pass clean before pushing. The `npm run build` command also runs it as part of the pipeline.

---

## Project conventions

These are enforced by review, not tooling. Read them before contributing.

### 1. No data-access layer

Zustand stores call `getDB()` directly. Each store action that mutates data writes to IndexedDB and updates in-memory state in the same call. Don't reintroduce a repository or operations wrapper — the indirection adds complexity without benefit in this codebase.

```typescript
// ✅ Do this — store writes to DB directly
addMessage: async (msg) => {
  const db = await getDB();
  await db.put("interview", { ...cur, messages: [...cur.messages, msg] });
  set({ record: next });
}

// ❌ Don't do this — unnecessary abstraction
const messageRepo = new MessageRepository();
await messageRepo.add(msg);
```

### 2. LLM providers are data, not classes

Providers are rows in the `PROVIDERS` table in `src/llm/index.ts`. Each row maps a provider name to a wire shape and a base URL. If a new provider speaks the OpenAI or Anthropic format, add a one-line entry — don't create a new class or file.

```typescript
// ✅ Adding a new OpenAI-compatible provider
"groq": { shape: openaiShape, baseUrl: "https://api.groq.com/openai/v1" },

// ❌ Don't create a new GroqProvider class
```

### 3. Zod is the source of truth for the persona shape

The canonical schema lives in `src/types/persona.ts`. TypeScript types are inferred via `z.infer`. Change the Zod schema, and the types update automatically. Never hand-write parallel types or interfaces for persona data.

### 4. Renderers stay deterministic

`insightRenderer.ts` and `profileRenderer.ts` are pure functions: `PersonaJSON → HTML string`. Keep LLM calls out of them. Always escape interpolated user values with `esc()` from `skills/html.ts` — it's the XSS boundary.

### 5. Rendered HTML must be self-contained

Exported Insight and Profile documents must not reference remote fonts, scripts, or images. They must carry the strict CSP meta tag. Test by opening a downloaded file from disk with your network disconnected.

### 6. Keep the codebase boring

This project deliberately favours conventional, low-abstraction code. Before adding a layer, an interface, or a config option, ask: *does a real current requirement need this?*

---

## How to add a new LLM provider

### Case 1: The provider speaks the OpenAI format

Add one line to the `PROVIDERS` table in `src/llm/index.ts`:

```typescript
"your-provider": { shape: openaiShape, baseUrl: "https://api.your-provider.com/v1" },
```

Also add it to the `Provider` type union in `src/llm/types.ts`, and add its base URL to the CSP in `index.html` and `tauri.conf.json` (or document that the `https:` wildcard already covers it).

### Case 2: The provider uses a different wire format

1. Create a new shape function (like `openaiShape` or `anthropicShape`) that implements the `LLMProvider` interface.
2. Add it to the `PROVIDERS` table.
3. Update the `Provider` type.
4. Add any needed CSP entries.

---

## How the synthesis flow works

When the interview completes, the synthesis flow tries two approaches:

1. **Structured output** — calls `llm.structuredComplete()` with the JSON Schema. If the provider supports it (OpenAI `json_schema`, Anthropic forced tool use), this guarantees schema-valid output at the API level.
2. **Fallback** — calls `llm.complete()` with instructions to output a fenced JSON block. Parses the result, then validates with Zod's `coercePersonaJSON()` which handles wrapper/double-wrapper shapes and enum normalization.

If both fail, the interview enters `"error"` status. The user can retry — the transcript is preserved.

### Debugging synthesis issues

The browser console logs each synthesis attempt:
- `[synthesis] structured output returned a non-conforming persona (...)` — the API returned JSON that didn't match the schema.
- `[synthesis] structured output call failed:` — the provider rejected the structured output call entirely (common with Ollama and some compatible endpoints).
- `[synthesis] fallback completion call failed:` — both approaches failed.

---

## Running without Tauri

You can develop entirely in the browser using `npm run dev`. The PWA path handles:
- API key stored in IndexedDB (instead of OS keyring)
- License validation via direct browser fetch (instead of Rust proxy)
- No native window or file system access

Everything else works identically.

---

## Testing

The test suite uses **Vitest** (native Vite integration), **Testing Library** (React
components), **fake-indexeddb** (IndexedDB in memory), and **MSW** (LLM API mocking).

### Running tests

```bash
npm test              # Run all tests once
npm run test:ui       # Interactive UI
npm run test:coverage # With coverage report
```

### Rust backend

```bash
cd src-tauri
cargo test --lib
```

### Test structure

```
src/__tests__/
├── setup.ts                   # Global setup (fake-indexeddb, Testing Library, Tauri mocks)
├── mocks/
│   ├── llm-server.ts          # MSW handlers for OpenAI/Anthropic/Mistral endpoints
│   └── lemon-squeezy-server.ts# MSW handlers for LS license API
├── factories/
│   ├── persona.ts             # minimalPersona(), richPersona(), sparsePersona(), storedPersona()
│   └── interview.ts           # activeInterview(), synthesizingInterview(), errorInterview(), longInterview()
├── types/persona.test.ts      # Zod schema validation, stripNulls, enum normalization, locatePersonaData
├── skills/
│   ├── html.test.ts           # esc(), groupSkills()
│   ├── insightRenderer.test.ts # Full render, empty sections, XSS safety, trait bars
│   ├── profileRenderer.test.ts # Full render, caps, skill source filtering, dark mode
│   ├── interviewExtractor.test.ts # extractPersonaJSON(), extractFencedJSON()
│   ├── personaSchemas.test.ts # mergeSynthesisFragments(), subset schemas
│   ├── synthesisPrompts.test.ts # Tier-aware prompt builders, hard rules
│   ├── interviewPrompt.test.ts  # buildSystemPrompt() free vs pro
│   ├── profileSynthesizer.test.ts # synthesizeHowIWorkBest() with LLM mock
│   └── dataDigest.test.ts     # prepareInputBrief() threshold, estimateTokens()
├── stores/
│   ├── settingsStore.test.ts  # load/update/clear, isConfigured(), Tauri keyring merge
│   ├── personaStore.test.ts   # load/save/clear/importFromJSON
│   ├── interviewStore.test.ts # State machine (idle→active→synthesizing→completed→error)
│   ├── licenseStore.test.ts   # activate/deactivate/check with grace period
│   └── logStore.test.ts       # Ring buffer, debug filter
├── llm/                       # (MSW handlers ready — LLM wire shape tests planned)
├── lib/
│   ├── utils.test.ts          # downloadFile, readFileAsText, openExternal
│   └── wipe.test.ts           # wipePersonaData, wipeAiProvider, factoryReset
├── logger/logger.test.ts      # Key redaction, debug filter, ring buffer
├── components/
│   ├── CompletionBanner.test.tsx # Synthesizing/completed/error states
│   └── WelcomeScreen.test.tsx   # Free/pro, existing persona, privacy note
└── integration/
    └── renderer-flow.test.ts  # Low/high content, sparse, empty arrays scenarios
```

### Key scenarios covered

| Scenario | How Tested |
|---|---|
| Low content persona | `minimalPersona()` → renderers verify empty sections omitted |
| High content persona | `richPersona()` → renderers verify all sections present |
| Missing data | `sparsePersona()` → optional fields absent, graceful omission |
| Invalid data | Zod schema edge cases: missing fields, wrong types, bad enums |
| XSS safety | `<script>`, `<img onerror>` injected into persona fields — verified escaped |
| Interview states | Store tests: idle→active→synthesizing→completed→error transitions |
| License grace period | Network failure during check() → license stays active |
| Factory reset | All stores cleared, service workers unregistered, IndexedDB deleted |

### Current coverage

- **Frontend**: 369 tests across 21 test files (~80% of planned scope)
- **Rust backend**: 4 tests (constants, entry constructors, deactivate best-effort, validate)
- **CI**: GitHub Actions workflow (`.github/workflows/test.yml`) runs both frontend and Rust tests on push/PR to main
