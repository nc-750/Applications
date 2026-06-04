# Architecture Overview

How Persona works under the hood. Written for contributors and curious users.

---

## High-level flow

```
User data (text + files)
        │
        ▼
  ┌─────────────┐
  │ Data Input   │  PDF, HTML, Markdown, JSON, plain text — all extracted to text
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Data Digest  │  If input > ~600k chars: map-reduce LLM condensation
  └──────┬──────┘  (chunk → extract per chunk → merge extracts)
         │
         ▼
  ┌─────────────┐
  │  Interview   │  Streaming chat. LLM acts as interviewer.
  └──────┬──────┘  Free tier: 2–3 questions. Pro tier: 5–8 questions.
         │
         ▼  (<<INTERVIEW_COMPLETE>> sentinel)
  ┌─────────────┐
  │  Synthesis   │  Non-streaming. LLM produces structured persona JSON.
  └──────┬──────┘  Two attempts: structured output → fallback completion.
         │
         ▼  (validated persona.json)
  ┌─────────────┐
  │ "How I Work  │  One-shot LLM call. Translates weaknesses + traits + values
  │    Best"     │  into constructive working-condition statements.
  └──────┬──────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Insight│ │Profile│  Pure TypeScript functions: PersonaJSON → HTML string.
└───────┘ └───────┘  Deterministic. No randomness. No further LLM calls.
```

---

## Two-phase interview design

The interview is deliberately split into two phases:

### Phase 1: Chat (streaming)

The LLM gets a system prompt that instructs it to be an interviewer — not a form-filler. It asks questions conversationally, follows up on interesting threads, and signals completion with a sentinel token (`<<INTERVIEW_COMPLETE>>`). The model never writes JSON during this phase.

### Phase 2: Synthesis (non-streaming)

A separate LLM call takes the full transcript and produces a structured `persona.json`. This call uses:

1. **Structured output** (OpenAI `json_schema` strict mode, or Anthropic forced tool use) — the API enforces the exact schema at generation time.
2. **Fallback** (plain completion + JSON extraction + lenient Zod parsing) — for providers that don't support structured output, like Ollama.

The synthesis prompt tells the model to keep all human-readable text in the user's language, while using the canonical English keys and enum values for the schema fields.

---

## Data model

Four IndexedDB stores, each holding one record keyed `"default"`:

### settings
| Field | Type | |
|-------|------|---|
| provider | `"openai" \| "anthropic" \| "mistral" \| "openai-compatible"` | |
| model | string | e.g. `"gpt-4o"` |
| apiKey | string | Empty on Tauri (key lives in OS keyring). Present on PWA. |
| endpoint | string? | Only for openai-compatible |

### persona
| Field | Type | |
|-------|------|---|
| data | PersonaJSON | The full validated persona |
| derived.how_i_work_best | string[] | Cached LLM output, synthesized once |

### interview
| Field | Type | |
|-------|------|---|
| status | `"idle" \| "active" \| "synthesizing" \| "completed" \| "error"` | State machine |
| initialData | string | The context brief sent to the LLM |
| messages | InterviewMessage[] | Full transcript |
| inputText | string? | Raw text the user typed |
| uploadedFileNames | string[]? | File names (contents not stored) |
| wasDigested | boolean | Whether initialData was LLM-condensed |

### license
| Field | Type | |
|-------|------|---|
| isActivated | boolean | |
| maskedKey | string | Last 8 chars, masked |
| instanceId | string | Per-device UUID |
| activatedAt / lastCheckedAt | ISO string | |

---

## LLM layer

The LLM client is data, not classes. Two wire-format implementations:

- **`openaiShape`** — `/chat/completions` + `/models` endpoint. Works for OpenAI, Mistral, Groq, Together, OpenRouter, Ollama, and any other OpenAI-compatible API.
- **`anthropicShape`** — `/messages` + `/models` endpoint. Works for Anthropic.

A provider is one row in the `PROVIDERS` table:

```
openai            → { shape: openaiShape, baseUrl: "https://api.openai.com/v1" }
mistral           → { shape: openaiShape, baseUrl: "https://api.mistral.ai/v1" }
openai-compatible → { shape: openaiShape, baseUrl: null }   // user supplies endpoint
anthropic         → { shape: anthropicShape, baseUrl: "https://api.anthropic.com/v1" }
```

Adding a new provider that speaks an existing format is a one-line table entry — no new class or file needed.

---

## Renderers (Insight & Profile)

`insightRenderer.ts` and `profileRenderer.ts` are pure functions:

```
renderInsight(persona: PersonaJSON) → HTML string
renderProfile(persona: PersonaJSON, howIWorkBest: string[]) → HTML string
```

Key properties:
- **Deterministic** — same input always produces the same output. No LLM calls, no randomness.
- **Self-contained** — CSS is inlined in a `<style>` block. No remote fonts, scripts, or images.
- **Strict CSP** — every document includes `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;">`.
- **All user content escaped** — every interpolated value goes through `esc()` in `skills/html.ts` (`& < > "` → entities). This is the XSS boundary.

---

## Key design decisions

- **One persona per device.** No accounts, no multi-user support. Simple by design.
- **No data-access layer.** Zustand stores call `getDB()` and read/write IndexedDB directly. There is no repository/operations indirection.
- **Zod is the source of truth.** The PersonaJSON schema in `types/persona.ts` defines both the runtime validator and the TypeScript types (via `z.infer`). Never hand-write parallel types.
- **API key lives in the OS keyring on desktop.** On Windows: Credential Manager. On macOS: Keychain. On Linux: Secret Service. The key is never written to disk as plaintext. On PWA, it falls back to IndexedDB.
- **Rendered HTML is isolated in iframes.** The Insight and Profile views use `<iframe srcDoc={html}>` so their CSS doesn't leak into the app shell.
- **Models are fetched live.** No hardcoded model lists to maintain. Users can also type any model name.
- **CSP enforced everywhere.** Both `tauri.conf.json` and `index.html` have Content-Security-Policy headers. Rendered documents carry their own CSP.

---

## Project layout

```
src/
├── types/
│   ├── persona.ts            # Zod schemas + inferred TS types (canonical)
│   ├── personaJsonSchema.ts  # JSON Schema for structured output (OpenAI strict mode)
│   └── license.ts            # License record type
├── db/
│   └── schema.ts             # IndexedDB connection, record types, wipe helper
├── stores/
│   ├── settingsStore.ts      # Provider, model, API key
│   ├── personaStore.ts       # PersonaJSON + derived data
│   ├── interviewStore.ts     # Interview state machine + transcript
│   └── licenseStore.ts       # License activation state
├── llm/
│   ├── types.ts              # LLMProvider, LLMConfig, Message, Provider
│   ├── index.ts              # PROVIDERS table, createLLMProvider, testConnection
│   ├── openai.ts             # openaiShape() — /chat/completions + /models
│   └── anthropic.ts          # anthropicShape() — /messages + /models
├── skills/
│   ├── dataDigest.ts         # Map-reduce condensation for large inputs
│   ├── interviewPrompt.ts    # System prompts for chat + synthesis phases
│   ├── interviewExtractor.ts # Defensive JSON extraction from plain-text responses
│   ├── insightRenderer.ts    # PersonaJSON → Insight HTML (deterministic)
│   ├── profileRenderer.ts    # PersonaJSON → Profile HTML (deterministic)
│   ├── profileSynthesizer.ts # "How I Work Best" one-shot LLM synthesis
│   └── html.ts               # Shared: esc(), groupSkills()
├── lib/
│   ├── keyStore.ts           # Tauri OS keyring bridge (API key)
│   ├── licenseKeyStore.ts    # Tauri OS keyring bridge (license key)
│   ├── licenseValidator.ts   # Lemon Squeezy API (Tauri via Rust, PWA via fetch)
│   ├── utils.ts              # downloadFile, readFileAsText, openExternal
│   ├── wipe.ts               # Three-tier data wipe + factory reset
│   └── fileExtractor.ts      # PDF, HTML, Markdown, JSON → text extraction
└── components/
    ├── layout/AppShell.tsx   # Sidebar (desktop) + bottom nav (mobile)
    ├── interview/            # InterviewView + WelcomeScreen + DataInputStep +
    │                         # ChatThread + ChatBubble + MessageInput + CompletionBanner
    ├── insight/InsightView.tsx
    ├── profile/ProfileView.tsx
    ├── settings/SettingsPanel.tsx
    ├── privacy/PrivacyView.tsx
    ├── license/              # LicenseModal + UpgradePrompt
    └── ui/LogoMark.tsx
```

---

## Tauri (Rust) backend

The Rust side (`src-tauri/src/lib.rs`) exposes 8 commands:

| Command | Purpose |
|---------|---------|
| `save_api_key` / `load_api_key` / `delete_api_key` | OS keyring for API key |
| `save_license_key` / `load_license_key` / `delete_license_key` | OS keyring for license key |
| `activate_license` | Calls Lemon Squeezy `/activate` |
| `validate_license` | Calls Lemon Squeezy `/validate` |
| `deactivate_license` | Calls Lemon Squeezy `/deactivate` |

License API calls go through Rust on Tauri to avoid browser CORS/CSP issues. The PWA path calls Lemon Squeezy directly from the browser.
