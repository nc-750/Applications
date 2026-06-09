# Mirror/app v1 Refactoring Plan

## Current State Summary

The app is **non-functional**. The migration from the old SPA architecture to vue-router was started but abandoned mid-way, leaving:

- **3 of 5 pages are stubs** (Interview, Insight, Profile render nothing)
- **Settings page is a dead form** — save is `console.log()`, all buttons are no-ops
- **Broken imports** — `interviewStore.ts`, `InterviewInstrument.vue`, `SettingsPanel.vue`, and `wipe.ts` all import from `settingsStore.ts.old` (a renamed file with no matching import)
- **Two parallel LLM implementations** — `src/llm/` in mirror/app and the new `@nc-750/llm-ts` library
- **5 Pinia stores** for a small app, with the license store adding complexity for a feature (pro tier) that won't ship in v1
- **~1000 lines of inline CSS** in `SettingsPanel.vue` alone
- **iframe-based rendering** for Insight and Profile pages, bypassing the Lab design system

The skills layer (prompts, synthesis, renderers) and the type system are sound and can carry forward largely intact.

---

## Design Decisions Review

### Where I agree

**✅ Remove license/tier system entirely.** v1 is free with BYOK. Full interview unlocked. This eliminates `licenseStore`, `licenseKeyStore`, `licenseValidator`, `LicenseModal`, `UpgradePrompt`, all license types, and the `InterviewTier` branching — roughly 400+ lines removed. The "pro" parameters become the only parameters (unlocked: 8 probes, 75% coverage target, full synthesis depth).

**✅ Merge stores.** 5 Pinia stores for a 5-page app is excessive. Total store code is ~550 lines. A single `useMirrorStore()` is the right call.

**✅ iframe → instrument for Insight/Profile.** The iframe approach bypasses the Lab design system entirely. HTML renderers should be download-only. In-app views should use `Cell`, `Band`, and Lab typography natively.

**✅ Follow WelcomePage conventions as the template.** No inline CSS rules. Tailwind for layout. Lab components for structure. `<Cell>` wrapping all content sections.

### Where I push back

**⚠️ Single file for the store.** I recommend a single *store* exposed as `useMirrorStore()`, but composed from focused modules split across files:

```
stores/mirror/
  index.ts        — useMirrorStore() composing the modules below
  settings.ts     — LLM config, persistence, keyring (~80 lines)
  interview.ts    — Interview state machine (~300 lines)
  persona.ts      — Persona CRUD (~70 lines)
  log.ts          — Log buffer (~40 lines)
```

This gives you `const mirror = useMirrorStore()` everywhere while keeping files digestible. The alternative — a single 500+ line file — adds friction for zero benefit. Each module is a plain composable function; Pinia's setup-store pattern composes them naturally.

**⚠️ Stripping ALL context from probe questions.** The current instrument already asks one question per turn. But the prompt still says "Acknowledge the last answer in one short line, then ask your single new question." I suggest changing this to: "If a bridge is helpful, use ≤10 words. Never repeat their answer back. The question itself is the output." This removes rote acknowledgments ("Thanks for sharing that") while keeping a minimal connective thread so the interview doesn't feel like an interrogatory form. ETHOS §5.1 prohibits dark patterns; a cold, mechanical interview flow that feels like a CAPTCHA is its own kind of dark pattern. This is a prompt-tuning refinement (maybe 3 lines changed), not a rewrite.

---

## Phase Plan

Each phase ends with a **compiling, runnable app**. If a phase fails, roll back to the previous phase's commit and restart. Phases are strictly sequential — each depends on the previous.

### Phase 1 — Restore Settings & Data Management ✅ Checkpoint: Settings page saves, loads, tests, and deletes data

**Goal:** Make the app boot correctly with a functional Settings page. All persistence works.

**Tasks:**

1. **Install `@nc-750/llm-ts`** as a dependency of mirror/app
2. **Create `stores/mirror/settings.ts`** — LLM config composable:
   - State: `llmConfig: LLMConfig | null`, `loaded: boolean`
   - Getter: `isLLMConfigured` (derived from `llmConfig !== null`)
   - Actions:
     - `loadSettings()` — reads from IndexedDB `settings` record + Tauri keyring for `apiKey`
     - `saveLLMConfig(config)` — persists to IndexedDB + Tauri keyring
     - `clearLLMConfig()` — deletes from IndexedDB + keyring, resets state
     - `testConnection()` — uses `@nc-750/llm-ts` to ping the configured provider, returns latency or error
   - PWA path: key stored in IndexedDB (no keyring available)
3. **Create `stores/mirror/index.ts`** — `useMirrorStore()` composing the settings module
4. **Rewire `SettingsPage.vue`:**
   - Wire form `v-model` to `mirrorStore.llmConfig`
   - Wire Save to `mirrorStore.saveLLMConfig()`
   - Wire Test Connection to `mirrorStore.testConnection()` with real latency/error feedback
   - Wire Import/Export persona buttons (import/export from IndexedDB)
   - Wire Danger Zone: Delete persona, Clear LLM Config, Factory reset
   - Match WelcomePage conventions: **zero inline CSS**, Tailwind utilities + Lab components only
   - `<Form>`, `<FormField>`, `<Button>`, `<TextField>` from Lab — already partially there
5. **Delete `SettingsPanel.vue`** (the 1000-line slide-out panel)
6. **Delete `stores/settingsStore.ts`** (the skeleton) and `stores/settingsStore.ts.old`
7. **Fix `App.vue`** — call `mirrorStore.loadSettings()` on mount
8. **Fix `wipe.ts`** — use `mirrorStore` instead of old store
9. **Fix `WelcomePage.vue`** — import from `useMirrorStore` instead of `useSettingsStore`

**Files created:** `stores/mirror/index.ts`, `stores/mirror/settings.ts`
**Files modified:** `pages/SettingsPage.vue`, `App.vue`, `lib/wipe.ts`, `pages/WelcomePage.vue`, `package.json`
**Files deleted:** `stores/settingsStore.ts`, `components/settings/SettingsPanel.vue`, `stores/settingsStore.ts.old` (if present)

**Verification:** Navigate to `/settings`, fill in provider/model/key, click Save, reload page → config persists. Click Test Connection → see latency or error message. Export persona → downloads JSON file. Factory reset → IndexedDB cleared, page reloads.

---

### Phase 2 — Merge Stores + Remove Licensing ✅ Checkpoint: Single `useMirrorStore()`, zero license code, app compiles

**Goal:** One store to rule them all. No license/tier code anywhere.

**Tasks:**

1. **Create `stores/mirror/persona.ts`:**
   - State: `persona: StoredPersona | null`, `personaLoaded: boolean`
   - Actions: `loadPersona()`, `savePersona(data, howIWorkBest)`, `clearPersona()`, `importPersonaFromJSON(json)`
2. **Create `stores/mirror/interview.ts`:**
   - State: `record`, `interviewLoaded`, `streamingContent`, `isThinking`, `acquiring`, `synthesisPhase`
   - Getters: `coverage`, `probeSignal`, `currentFacet`, `probeCount`, `concluded`
   - Actions: `loadInterview()`, `beginInterview()`, `submitAnswer()`, `runSynthesis()`, `probeMore()`, `abort()`, `clearInterview()`
   - Internal helpers: `makeLLM()`, `streamProbe()`, `runAnalysis()`, `persist()`, `patchRecord()`
3. **Create `stores/mirror/log.ts`:**
   - State: `logEntries`, `debugEnabled`, `logMaxEntries`
   - Actions: `appendLog()`, `clearLogs()`, `setDebugEnabled()`
4. **Compose all modules** in `stores/mirror/index.ts` → `useMirrorStore()`
5. **Hard-code former "pro" tier parameters** everywhere:
   - Remove `InterviewTier` type
   - `MAX_PROBES = 8`, `CONCLUDE_THRESHOLD = 0.75`
   - Remove `tier()` calls, use constants directly
6. **Delete all license code:**
   - `stores/licenseStore.ts`
   - `lib/licenseKeyStore.ts`
   - `lib/licenseValidator.ts`
   - `types/license.ts`
   - `components/license/LicenseModal.vue`
   - `components/license/UpgradePrompt.vue`
   - Remove `license` store from IndexedDB schema (it becomes unused)
7. **Delete old store files:** `stores/personaStore.ts`, `stores/interviewStore.ts`, `stores/logStore.ts`
8. **Update all imports** across every component and skill file to use `useMirrorStore()`
9. **Fix broken `.ts.old` imports** in `InterviewInstrument.vue` → use `mirrorStore`

**Files created:** `stores/mirror/persona.ts`, `stores/mirror/interview.ts`, `stores/mirror/log.ts`
**Files modified:** `stores/mirror/index.ts`, `stores/mirror/settings.ts`, all `.vue` components, `skills/synthesize.ts`, `skills/interviewPrompt.ts`, `skills/analysisPrompt.ts`, `skills/profileSynthesizer.ts`, `db/schema.ts`
**Files deleted:** `stores/personaStore.ts`, `stores/interviewStore.ts`, `stores/logStore.ts`, `stores/licenseStore.ts`, `lib/licenseKeyStore.ts`, `lib/licenseValidator.ts`, `types/license.ts`, `components/license/LicenseModal.vue`, `components/license/UpgradePrompt.vue`

**Verification:** App compiles with zero errors. `grep -r "useSettingsStore\|usePersonaStore\|useInterviewStore\|useLicenseStore\|useLogStore" src/` returns nothing. `grep -r "InterviewTier" src/` returns nothing. App boots, Settings page still works.

---

### Phase 3 — Migrate to `@nc-750/llm-ts` ✅ Checkpoint: All LLM calls go through the new library

**Goal:** Delete `src/llm/`. All LLM operations use `@nc-750/llm-ts`. Handle the `Result` pattern.

**Tasks:**

1. **Adapt `makeLLM()`** in the interview module:
   ```typescript
   // Before (old mirror LLM):
   createLLMProvider({ provider, model, apiKey, endpoint })

   // After (@nc-750/llm-ts):
   createLLMClient({ provider, model, keyProvider: async () => apiKey, baseUrl: endpoint })
   // Returns Result<LLMClient, LLMError> — check .ok
   ```
2. **Adapt `streamProbe()`:**
   - Old: `for await (const chunk of llm.streamChat(messages, signal))`
   - New: `const stream = await llm.stream(messages, { signal }); if (!stream.ok) ...; for await (const chunk of stream.value)`
3. **Adapt `runAnalysis()`:**
   - Old: `llm.structuredComplete(messages, schema, name)` → throws
   - New: `llm.message(messages, { structured: { name, schema } })` → returns `Result<unknown>`
   - On `Err` (provider doesn't support structured output), fall back to `llm.message()` + `extractFencedJSON`
4. **Adapt `synthesize.ts`:**
   - Replace `llm.structuredComplete()` → `llm.message({ structured: {...} })`
   - Replace `llm.complete()` → `llm.message()`
   - `unwrapCallOutput()` logic stays
5. **Adapt `dataDigest.ts`:**
   - Replace `llm.complete()` → `llm.message()`
6. **Adapt `profileSynthesizer.ts`:**
   - Same pattern — `llm.complete()` → `llm.message()`
7. **Reimplement `testConnection()`** using `@nc-750/llm-ts`:
   - Create client, send a minimal message, measure latency
8. **Remove `src/llm/`** directory entirely (6 files)
9. **Remove `listModels`** from mirror/app — was used by old SettingsPanel which is being deleted. Can be re-added later as a thin wrapper if needed.

**Files created:** none
**Files modified:** `stores/mirror/interview.ts`, `stores/mirror/settings.ts`, `skills/synthesize.ts`, `skills/dataDigest.ts`, `skills/profileSynthesizer.ts`
**Files deleted:** `src/llm/index.ts`, `src/llm/types.ts`, `src/llm/openai.ts`, `src/llm/anthropic.ts`, `src/llm/LLMProvider.ts`

**Verification:** App compiles. `grep -r "from.*\.\.\/llm" src/` returns nothing (or only references to `@nc-750/llm-ts`). Unit tests for synthesis and data digest pass (they mock the LLM interface — adapt mocks to new shape).

---

### Phase 4 — Restore & Refactor Interview ✅ Checkpoint: Full interview flow works end-to-end

**Goal:** Un-stub `InterviewPage.vue`. The interview instrument works with the single store and new LLM library. All components follow WelcomePage conventions.

**Tasks:**

1. **Uncomment and wire `InterviewPage.vue`** → renders `<InterviewInstrument />`
2. **Refactor `InterviewInstrument.vue`:**
   - Replace all inline CSS with Tailwind + Lab components
   - Remove all `.mr-*` custom CSS classes — use Tailwind utilities
   - Use `<Cell>`, `<Band>`, `<CellHead>` from Lab consistently
   - Remove `AppShell`-era navigation logic (section emits, etc.)
   - Use router navigation: `router.push('/insight')` instead of `emit('complete', 'insight')`
   - Adapt to `mirrorStore` instead of 4 separate stores
3. **Refactor sub-components** (same treatment — strip inline CSS):
   - `ProbeCell.vue` — keep `<Facet>`, `<Acquire>` from Lab
   - `ReadoutPanel.vue` — keep `<Coverage>` from Lab
   - `ConcludeCell.vue`
   - `SessionLogCell.vue` — keep `<SessionLog>` from Lab
   - `DataInputStep.vue` — largest cleanup needed (~40 inline style blocks)
   - `CompletionBanner.vue`
4. **Simplify the probe prompt** (`skills/interviewPrompt.ts`):
   - Replace: "Acknowledge the last answer in one short line, then ask your single new question."
   - With: "If a bridge is helpful, use ≤10 words. Never repeat their answer back. The question is the primary output."
   - Remove: the `isFirst` warm summary — jump straight to the first question
5. **Fix the "hanging on LLM processing" issue:**
   - The analysis overlay (`Acquire`) already shows during Call B
   - Ensure the probe streaming (Call A) properly updates `streamingContent` and `isThinking`
   - Add a timeout guard: if no chunk arrives within 30s, show a "waiting for response" indicator
6. **Test the full flow:**
   - Data input → optional file upload → digest (if large) → interview probes → readout updates → conclusion → synthesis → completion
   - Edge cases: abort mid-stream, LLM error on analysis, skip data input entirely, empty input, very large file input

**Files modified:** `pages/InterviewPage.vue`, `components/interview/*.vue` (7 files), `skills/interviewPrompt.ts`, `app.css` (remove `.mr-interview` etc. if moved to Tailwind)

**Verification:** Navigate to `/interview` with LLM configured → see the interview instrument. Enter data → start interview → question streams in → answer → analysis overlay → next question. Coverage meters update. After sufficient probes, "Generate profile" appears. Synthesis runs. Completion screen offers Insight and Profile.

---

### Phase 5 — Insight & Profile as Instruments ✅ Checkpoint: No iframes in the app UI

**Goal:** Native Lab component rendering for Insight and Profile pages. HTML renderers become download-only exports.

**Tasks:**

1. **Refactor `InsightPage.vue`:**
   - Build a scrollable instrument document using `<Band>`, `<Cell>`, `<CellHead>`
   - Each section is a `<Cell>` with a `spec` header:
     - `WLC // 0x02` → Identity header (name, tagline, date, sources)
     - `WLC // 0x03` → Elevator Pitch (quoted block)
     - `WLC // 0x04` → Strengths (list of cards)
     - `WLC // 0x05` → Growth Areas (list of cards)
     - `WLC // 0x06` → Skills Map (grouped badges with legend)
     - `WLC // 0x07` → Career Timeline (chronological entries)
     - `WLC // 0x08` → Hidden Assets (list)
     - `WLC // 0x09` → Personality Dimensions (bar charts)
     - `WLC // 0x0A` → Values & Goals
     - `WLC // 0x0B` → Ready-to-use Text (collapsible sections)
   - Download button at top → exports `renderInsight()` HTML
2. **Refactor `ProfilePage.vue`:**
   - Same instrument approach with public profile sections:
     - About, How I Work Best, Strengths, Skills, Experience, Beyond Work
   - Download button → exports `renderProfile()` HTML
3. **Remove old iframe-based components:**
   - `components/insight/InsightView.vue`
   - `components/profile/ProfileView.vue`
   - `components/insight/InsightHistoryPanel.vue`
   - `components/profile/ProfilePlaceholderPanel.vue`
4. **Keep HTML renderers as-is** — they become download-only functions called from the download buttons
5. **Empty state**: when no persona exists, show the same "No mirror yet" message but styled as a Cell

**Files modified:** `pages/InsightPage.vue`, `pages/ProfilePage.vue`
**Files created:** possibly new small sub-components if a section gets complex (e.g., `PersonalityBarChart.vue`)
**Files deleted:** `InsightView.vue`, `ProfileView.vue`, `InsightHistoryPanel.vue`, `ProfilePlaceholderPanel.vue`

**Verification:** After completing an interview, navigate to Insight → see native Lab-styled document. Click Download → get standalone HTML file. Same for Profile. Empty state shows when no persona exists.

---

### Phase 6 — Code Cleanup & ETHOS Compliance ✅ Checkpoint: Zero inline CSS violations, compliance checklist green

**Goal:** Enforce conventions uniformly. Pass ETHOS compliance. Remove dead code.

**Tasks:**

1. **Inline CSS audit** — scan every `.vue` file:
   - **Acceptable:** `:style="{ color: 'var(--nc-error)' }"` — single CSS custom property references
   - **Forbidden:** raw pixel values, hex colors, `padding:`, `margin:`, `display: flex`, etc.
   - Move forbidden styles to Tailwind classes or `<style scoped>` blocks
2. **Remove unused components:**
   - `components/layout/AppShell.vue` — the old SPA shell, replaced by vue-router + `ChassisHeader/Footer`
   - `components/ui/LogoMark.vue` — if unused after AppShell removal
   - `components/privacy/PrivacyView.vue` — if privacy content is integrated into Settings page
3. **Remove `components.d.ts`** if generated types are stale; rely on `vite-env.d.ts`
4. **ETHOS compliance checklist audit:**
   - [ ] C1.3: Local-only offered ✓ (all data in IndexedDB, nothing sent to NC-750 servers)
   - [ ] C1.4: Plain-words disclosure ✓ (Settings page shows provider policy links)
   - [ ] C1.5: Export + hard-delete ✓ (Settings page data deletion)
   - [ ] C3.1: BYOK always available ✓ (LLM config form)
   - [ ] C3.2: Local model option ✓ (`openai-compatible` → Ollama/LM Studio)
   - [ ] C3.5: CSP `connect-src` pinned to known endpoints (check + fix if needed)
   - [ ] C4.1: Usable without account ✓
   - [ ] C4.3: Secrets in OS keystore ✓ (Tauri keyring on desktop)
   - [ ] C8.1: Lab design system ✓
   - [ ] C8.3: WCAG 2.1 AA — keyboard navigation audit, focus indicators, `prefers-reduced-motion`
5. **VISUAL_IDENTITY audit:**
   - P3 (Seams, not shadows): verify no box-shadows used for elevation
   - P8 (One loud signal): verify accent color used on ≤10% of any screen
6. **Final file sweep:** verify no dead imports, no stale `// TODO` comments from the old architecture

**Files modified:** most `.vue` files (minor style fixes), `app.css`
**Files deleted:** `AppShell.vue`, `LogoMark.vue` (if unused), `PrivacyView.vue` (if unused), potentially `components.d.ts`

**Verification:** `grep -rn 'style="' src/ --include="*.vue"` returns only custom-property references. `grep -rn "\.mr-" src/ --include="*.vue" --include="*.css"` returns nothing (all custom classes cleaned). Keyboard-tab through the entire app — every interactive element is reachable and has a visible focus ring.

---

## Dependency Graph

```
Phase 1 (Settings + Data)
  └─→ Phase 2 (Merge Stores + Remove Licensing)
        └─→ Phase 3 (LLM Migration)
              └─→ Phase 4 (Interview Restoration)
                    ├─→ Phase 5 (Insight & Profile)
                    └─→ Phase 6 (Cleanup)
```

Phases 5 and 6 are independent of each other and could be parallelized.

## File Impact Summary

| Phase | Created | Modified | Deleted |
|-------|---------|----------|---------|
| 1 | 2 | 4 | 3 |
| 2 | 3 | ~15 | 11 |
| 3 | 0 | 5 | 5 |
| 4 | 0 | ~10 | 0 |
| 5 | 0-2 | 2 | 4 |
| 6 | 0 | ~8 | 3-5 |
| **Total** | **5-7** | **~44** | **~26-28** |

Net reduction: ~20 files. Net code reduction: ~2000+ lines (license code + old LLM module + old stores + SettingsPanel + AppShell + iframe views).

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|------------|
| 1 | Low | Self-contained; only touches settings |
| 2 | Medium | Touches many files but changes are mechanical (import path updates) |
| 3 | Medium | LLM interface change — keep old `src/llm/` as fallback until tests pass |
| 4 | Medium | Complex UI state — test each flow state independently before integration |
| 5 | Low | Read-only rendering from existing data; no new state |
| 6 | Low | Style-only changes; reversible per-file |
