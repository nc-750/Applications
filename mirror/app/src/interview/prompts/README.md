# Interview prompts — flow map

Every LLM interaction the interview makes is one of four flows. Each flow is one
file holding its **pure prompt builders** and, where the call returns structured
data, its **boundary schema** (Zod + JSON Schema, type via `z.infer`). To change
how the instrument talks to the model for a given step, edit that one file.

| # | Flow | File | Builders | Boundary contract |
|---|------|------|----------|-------------------|
| 1 | **Initial-data analysis** — the streaming chat system prompt that opens the interview, seeded with the user's pasted text / CV / files. | `InitialAnalysis.ts` | `buildInterviewSystemPrompt(initialData)` | — (free-form chat) |
| 2 | **Per-turn analysis (Call B)** — after each answer, an honest coverage/saturation measurement that drives the readout. | `TurnAnalysis.ts` | `buildPersonaMetricsSystemPrompt(coverage, questionsAsked, maxQuestions, pastBudget)`, `buildPersonaMetricsUserPrompt(question, answer, transcript)` | `TurnAnalysisSchema` → `TurnAnalysis`; `TURN_ANALYSIS_JSON_SCHEMA` / `TURN_ANALYSIS_SCHEMA_NAME` |
| 3 | **Probe (Call A)** — the single next facet-scoped question, in probe voice. | `Probe.ts` | `buildNextQuestionSystemPrompt(turnAnalysis)` | `ProbeSchema` → `Probe`; `PROBE_JSON_SCHEMA` / `PROBE_SCHEMA_NAME` |
| 4 | **Synthesis (Call C)** — extract → analyze → polish → merge into one persona, then a one-shot "How I Work Best". | `Synthesis.ts` | `buildExtract*`, `buildAnalyze*`, `buildPolish*`, `mergeSynthesisFragments`, `buildHowIWorkBestPrompt` | `ExtractSchema`/`AnalyzeSchema`/`PolishSchema` (+ JSON schemas) → `SynthesisResult`; `HowIWorkBestSchema` |

Shared, flow-agnostic pieces:

- `Fragments.ts` — the philosophy / language / tone copy used by more than one flow,
  plus `textMessage(role, text)`, the helper every builder uses to emit the wire
  `Message` shape.
- `Json.ts` — `extractFencedJSON` / `stripNulls`: pure coercion that normalises raw
  LLM text before a boundary schema parses it.

## Boundaries

- **Pure builders only.** These files take data and return `Message` objects (or
  schemas). No `llm.message(...)`, no store access, no side effects. The
  orchestration that *runs* these calls — and the transform from `SynthesisResult`
  into the persona domain model — lives in the service layer (`../services`).
- **Digest of oversized input** (the map/reduce pre-pass) is a service concern and
  is intentionally **not** a prompt flow here; it is owned by the services phase.
