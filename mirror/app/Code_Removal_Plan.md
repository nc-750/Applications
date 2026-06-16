â ï¸ Convention violations found

V1. src/settings/services/wipe.ts â cross-feature lifecycle in wrong layer (Rules 5.7, 2.5, 7.13)

wipe.ts imports usePersonaStore() from ../../persona/stores â a lateral store import from a feature that isn't its own (5.6). It also calls useSettingsStore() and usePersonaStore() inside function bodies rather than receiving them as injected arguments (2.5).

Rule 5.7 says: "Cross-feature lifecycle / bootstrap operations (factory reset, boot wiring, app-wide teardown) live in src/core/." Currently src/core/ does not exist; wipe.ts lives in settings/services/.

Rule 7.13: wipeDatabase() is an empty stub with the comment // implement based on old wipeIndexedDBDatabase â should be // TODO:.

Decision: â Move wipe.ts to src/core/wipe.ts. The src/core/ directory doesn't exist yet â it will be created as part of this work. The barrel src/settings/services/index.ts should also be updated to remove the missing export (or left as-is since wipe.ts was never in the barrel anyway â it was imported directly by SettingsPage.vue).

V2. InterviewPage.vue â view builds LLM infrastructure (Rule 2.7)

Lines 71â99 of src/interview/pages/InterviewPage.vue:

const llmClient = ref<LLMClient | null>(null);
function buildClient(): void { ... llmClient.value = createClientFromConfig({...}); }
watch([settingsStore.provider, ...], buildClient, { immediate: true });

Rule 2.7: "Views contain no app logic, build no infrastructure, and never mutate a model." The view constructs the LLM client and watches settings for changes. However, it does inject the client into services (e.g., beginInterview(client, ...)) â the injection pattern itself is correct. The concern is that the construction lives in the view.

Mitigation option â useInterviewClient() composable (Rule 4.6):

Rule 4.6 says: "A composable (useX()) is allowed only as a reactive adapter: it exposes flow state (loading, abort, progress) and delegates to plain service functions. It holds no business logic."

This means we can extract the LLM client construction and lifecycle into a small composable that acts as a "reactive adapter" â it watches settings, builds/destroys the client, and exposes it as a readonly ref. The view then just reads const { client } = useInterviewClient() instead of owning the watch + buildClient logic inline. This is the Vue 3 equivalent of a "provider" or "factory hook" â the composable owns the reactive wiring (which is its job), while the view stays a thin consumer.

Concretely, it would look like:
// src/interview/composables/useInterviewClient.ts
export function useInterviewClient() {
    const settingsStore = useSettingsStore();
    const client = ref<LLMClient | null>(null);

    function build() { /* same construction logic */ }
    watch(() => [settingsStore.provider, settingsStore.model, ...], build, { immediate: true });

    return { client: readonly(client) };
}
And in the view:
const { client: llmClient } = useInterviewClient();
// ...pass llmClient to services exactly as before

The composable is not a service â it's a thin reactive adapter that owns the "settings change â rebuild client" wiring, which is a reactive concern, not business logic. The business logic (what to do with the client) stays in the plain service functions that receive the client as an argument.

Decision: Pending user review of this pattern. The current code works correctly; this is a structural improvement, not a bug fix.

V3. ProfilePage.vue â empty stub (Rules 7.12, 7.13)

src/profile/pages/ProfilePage.vue contains only:
<!-- The feature has to be fully reworked -->
<script setup lang="ts"></script>
<template></template>

Rule 7.12 requires dead code deletion; Rule 7.13 requires // TODO: for unfinished code. This is routed at /profile but renders a blank page.

Decision: The profile feature was simply forgotten during the refactoring â it needs the same layered treatment as Settings/Persona/Interview (model â db â mappers â store â services â view). The empty stub should stay as a placeholder with a proper // TODO: note until phased refactoring reaches it. The route stays so the app doesn't break on navigation.

V4. profile/services/ â broken imports from deleted module (Rule 1.11)

Both profileRenderer.ts and html.ts import from ../../types/persona:
import type { PersonaJSON, Skill, ... } from "../../types/persona";

src/types/persona.ts does not exist â it was removed when the canonical Persona types were moved to src/persona/models/Persona.ts. These files cannot compile.

Decision: These files will be fixed during the profile feature refactor (see V3). The PersonaJSON â Persona mapping, Skill type alignment, and renderer logic will be rebuilt against the new src/persona/models/ types. The renderers themselves (renderProfile, esc, groupSkills) are valuable â they are pure functions with good test coverage that just need their type imports fixed.

V5. Settings services barrel incomplete

src/settings/services/index.ts only re-exports testConnection. The wipe.ts file is in the same directory but imported directly by SettingsPage.vue:
import { factoryReset } from "../services/wipe";  // bypasses barrel

The barrel should either include wipe or wipe should relocate to src/core/ (see V1).

V6. Indentation inconsistency (Rule 7.15)

Rule 7.15 mandates 4 spaces repo-wide. Several files use 2-space indentation:
- src/fileManager/services/fileExtractor.ts â 2-space
- src/fileManager/services/utils.ts â 2-space
- src/settings/services/wipe.ts â 2-space
- src/logger/services/export.ts â 2-space
- src/logger/services/logger.ts â 2-space

Settings/Persona/Interview features correctly use 4-space.

---
Part 2: Dead Code Inventory

A. Source files that can be deleted entirely

âââââââ¬ââââââââââââââââââââââââââââââââââââââââââââââ¬âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
â  #  â                    File                     â                              Reason                              â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 1   â src/assets/react.svg                        â Vue project; zero references in codebase                         â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 2   â src/persona/personaSchemas.ts               â All code commented out; header says "to be reworked or scrapped" â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 3   â src/fileManager/components/FileUploader.vue â Never imported by any file (only has a template with no logic)   â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 4   â src/fileManager/services/fileExtractor.ts   â Check usage â may be unused after interview refactor             â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 5   â src/insight/components/.gitkeep             â Build artifact cruft, not code                                   â
âââââââ´ââââââââââââââââââââââââââââââââââââââââââââââ´âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

Note on item 4: The fileExtractor.ts exports AttachedFile, extractText, etc. Need to verify if interview still uses these via fileManager/services/. The utils.ts exports downloadFile, readFileAsText, openExternal â downloadFile IS used by logger/services/export.ts. So utils.ts is used, but fileExtractor.ts needs import verification.

B. Files kept for future refactoring (not dead â deferred)

âââââââ¬ââââââââââââââââââââââââââââââââââââââââââ¬ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
â  #  â                  File                   â                                              Plan                                               â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 1   â src/profile/pages/ProfilePage.vue       â Empty stub â add // TODO: Phase refactor with link to profile refactor plan. Keep route active. â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 2   â src/profile/services/profileRenderer.ts â Broken imports from deleted src/types/persona â fix during profile refactor phase               â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 3   â src/profile/services/html.ts            â Broken imports from deleted src/types/persona â fix during profile refactor phase               â
âââââââ´ââââââââââââââââââââââââââââââââââââââââââ´ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

These profile files were simply forgotten during the refactoring. They need the same layered treatment as the other features (model â db â mappers â store â services â view). The renderers themselves (renderProfile, esc, groupSkills) are valuable pure functions â they just need their type imports updated to reference src/persona/models/Persona.ts instead of the deleted src/types/persona.ts.

C. Test files that can be deleted (from thorough test suite analysis)

âââââââ¬ââââââââââââââââââââââââââââââââââââââââââââââââ¬âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
â  #  â                     File                      â                                      Reason                                      â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 1   â __tests__/components/CompletionBanner.test.ts â Component CompletionBanner.vue was removed during refactoring                    â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 2   â __tests__/integration/renderer-flow.test.ts   â renderInsight function removed; imports dead skills/insightRenderer              â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 3   â __tests__/lib/wipe.test.ts                    â useMirrorStore and lib/wipe removed; imports dead modules                        â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 4   â __tests__/skills/personaSchemas.test.ts       â Tests code that is fully commented out; coverage duplicated by Synthesis.test.ts â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 5   â __tests__/types/persona.test.ts               â src/types/persona does not exist; all value imports fail                         â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 6   â __tests__/mocks/lemon-squeezy-server.ts       â Orphaned â not imported by any test file                                         â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 7   â __tests__/mocks/llm-server.ts                 â Orphaned â not imported by any test file                                         â
âââââââ¼ââââââââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 8   â __tests__/factories/interview.ts              â Orphaned â not imported by any test file                                         â
âââââââ´ââââââââââââââââââââââââââââââââââââââââââââââââ´âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

D. Test files kept for future refactoring (not deleted â deferred with profile feature)

âââââââ¬âââââââââââââââââââââââââââââââââââââââââââ¬âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
â  #  â                   File                   â                                                                           Plan                                                                           â
âââââââ¼âââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 1   â __tests__/factories/persona.ts           â Has broken import type from deleted types/persona. Fix when profile feature is refactored â currently used by profileRenderer.test.ts.                   â
âââââââ¼âââââââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â 2   â __tests__/skills/profileRenderer.test.ts â Tests renderProfile which imports from deleted types/persona. Fix when profile feature is refactored â the test has good coverage of the renderer logic. â
âââââââ´âââââââââââââââââââââââââââââââââââââââââââ´âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

Test suite reduction: 35 files â ~25 files (~29% reduction). No test file tests the same thing as another â the *.errors.test.ts files intentionally test error paths separate from happy-path *.test.ts files, which is a valid pattern.

C. CLAUDE.md stale references

ââââââââââââââââââââââââââââââââââââââ¬âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
â        CLAUDE.md reference         â                                                      Actual state                                                      â
ââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â src/skills/ directory              â Removed. Interview prompts now at src/interview/prompts/; profile renderer at src/profile/services/ (broken)           â
ââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â src/components/layout/AppShell     â Does not exist. App layout is inline in App.vue                                                                        â
ââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â src/types/persona.ts (canonical)   â File removed. Types now in src/persona/models/Persona.ts                                                               â
ââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â enclosure-vue package              â Now @nc-750/lab-vue                                                                                                    â
ââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â npm run dev / npx tsc              â Should use bun run dev / bunx tsc per project memory                                                                   â
ââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â Pinia stores call getDB() directly â Still true, but stores now go through their feature's db/ module, not getDB() directly                                 â
ââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â No data-access layer               â Still true; stores own their db module access                                                                          â
ââââââââââââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â Insight/Profile shown in iframes   â No longer true. Insight is now native Vue components (InsightPage.vue â *Cell.vue hierarchy). Profile is a broken stub â
ââââââââââââââââââââââââââââââââââââââ´âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

---
Part 3: Test Reduction â What's Safe to Remove

Definite deletes (8 files)

These test files can be safely deleted immediately â they either test removed code, import from nonexistent modules, or are completely orphaned:

1. src/__tests__/components/CompletionBanner.test.ts
2. src/__tests__/integration/renderer-flow.test.ts
3. src/__tests__/lib/wipe.test.ts
4. src/__tests__/skills/personaSchemas.test.ts
5. src/__tests__/types/persona.test.ts
6. src/__tests__/mocks/lemon-squeezy-server.ts
7. src/__tests__/mocks/llm-server.ts
8. src/__tests__/factories/interview.ts

Deferred with profile refactor (2 files)

These tests import from the broken profile/services/ which imports from deleted src/types/persona. They will be fixed when the profile feature is refactored:

9. src/__tests__/factories/persona.ts â fix import type from deleted types/persona
10. src/__tests__/skills/profileRenderer.test.ts â fix when profileRenderer.ts imports are corrected

Tests to keep (25 files)

All remaining tests import from valid source paths and test active code:
- Settings: 6 tests (Settings, SettingsStore, SettingsStore.errors, SettingsDb, SettingsPage, testConnection)
- Interview: 10 tests (Interview, InterviewStore, InterviewDb, InterviewStore.errors, 5 prompt tests, 4 service tests)
- Persona: 4 tests (PersonaDb, PersonaStore, PersonaStore.errors, PersonaTransfer)
- Core: 3 tests (Database, llm/factory, logger)
- Lib: 2 tests (utils, html)

What tests CANNOT be removed

- All per-feature store tests (they test the core reactive persistence contract)
- All per-feature db tests (they test the IndexedDB read/write paths)
- Prompt tests (they test the Zod schemas for LLM structured output)
- Service tests (they test business logic in isolation)
- No test file duplicates another's coverage â the *.errors.test.ts files test separate error paths

---
Part 4: Recommendations

Immediate (low risk, high impact)

1. Delete 8 orphaned test files â reduces test maintenance by ~23% with zero risk (see PartÂ 3)
2. Delete src/assets/react.svg â dead asset
3. Delete src/persona/personaSchemas.ts â all commented out since refactoring
4. Delete src/insight/components/.gitkeep â cruft
5. Delete src/fileManager/components/FileUploader.vue â dead component (verify fileExtractor.ts is unused first)
6. Move wipe.ts from src/settings/services/ to new src/core/wipe.ts â user approved. Update SettingsPage.vue import accordingly.
7. Create src/core/ directory â add wipe.ts, mark wipeDatabase() with // TODO:
8. Update CLAUDE.md â fix stale paths to reflect current architecture

Short-term (next refactor phase â profile feature)

9. Profile feature refactor â same layered treatment as other features (model â db â mappers â store â services â view):
  - Fix profileRenderer.ts + html.ts imports: map old PersonaJSON to new Persona model from src/persona/models/
  - Rebuild ProfilePage.vue from the empty stub
  - Fix __tests__/factories/persona.ts and __tests__/skills/profileRenderer.test.ts imports
  - Keep route active; add // TODO: to the stub until refactor completes

Deferred (structural improvement, not blocking)

10. useInterviewClient() composable â extract LLM client construction from InterviewPage.vue per 4.6 (see V2 explanation). Pending user review of composable pattern.
11. Normalize indentation â convert 2-space files to 4-space per 7.15
12. Verify fileManager/services/fileExtractor.ts â confirm it's still used by interview feature
13. Verify __tests__/settings/SettingsPage.test.ts â confirm it compiles after wipe.ts moves to src/core/

Verification

After deletions + wipe.ts relocation:
1. Run bun run build (which includes vue-tsc --noEmit) â per 8.2, this is the gate for .vue files
2. Run bun run test â verify remaining tests pass
3. Run bun run dev â smoke test the app: Welcome â Settings â Interview flow â Insight

Files NOT to touch

The following areas are well-refactored and should not be modified:
- src/settings/ â entire feature (except wipe.ts relocation)
- src/persona/ â entire feature
- src/interview/ â entire feature
- src/db/Database.ts â central DB connection
- src/llm/ â factory + types
- src/logger/ â logger module
- src/insight/ â components + page (except .gitkeep)