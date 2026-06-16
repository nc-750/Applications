<script setup lang="ts">
// Insight — the private, in-app reflection view over the synthesized persona.
//
// A read-only instrument view (CONVENTIONS 2.7): it binds the persona store and
// renders. It owns no persisted state, makes no LLM/HTTP call, and mutates no model.
// Presentation follows the Lab Chassis→Band→Cell contract; the Chassis header/footer
// are owned by App.vue, so this page contributes Bands only. Every content field on
// the Persona model is rendered: metadata nameplate, metrics, strengths/growth areas,
// values/hidden assets, skills map, personality dimensions, goals, career timeline,
// outside work, how I work best, ready-to-use text, and interview transcript.

import { computed, onMounted, ref } from "vue";
import { BookOpen } from "lucide-vue-next";
import { Band, Cell } from "@nc-750/lab-vue";
import { usePersonaStore } from "../../persona/stores";
import { PersonaGoalType } from "../../persona/models";
import MetricsMonitorCell from "../components/MetricsMonitorCell.vue";
import StringListCell from "../components/StringListCell.vue";
import ListCell from "../components/ListCell.vue";
import SkillsMapCell from "../components/SkillsMapCell.vue";
import DimensionsCell from "../components/DimensionsCell.vue";
import CareerTimelineCell from "../components/CareerTimelineCell.vue";
import DerivedTextCell from "../components/DerivedTextCell.vue";
import TranscriptCell from "../components/TranscriptCell.vue";
import { logger } from "../../logger/index.ts";
import { useInterviewStore } from "../../interview/stores/InterviewStore.ts";
import { useInterviewClient } from "../../interview/composables/useInterviewClient.ts";
import { runSynthesis } from "../../interview/services/SynthesisFlow.ts";

const personaStore = usePersonaStore();
const interviewStore = useInterviewStore();

// ── LLM client ──────────────────────────────────────────────────────────────
// The settings→client wiring lives in a reactive adapter composable (4.6); the
// view stays a thin consumer (2.7).

// REMARK: Maybe we should create a specific useInsightClient instead?
const { client: llmClient, clientError } = useInterviewClient();

// ── Local UI state ──────────────────────────────────────────────────────────
const isBusy = ref(false);

// The store seeds a total, never-null persona (createEmptyPersona), so "is there a
// mirror yet?" is a content question, not a null check: an insight exists once
// synthesis has filled any of the persona's content fields.
const persona = computed(() => personaStore.persona);

const hasInsight = computed(() => {
    const p = persona.value;
    return (
        p.strengths.length > 0 ||
        p.weaknesses.length > 0 ||
        p.skills.length > 0 ||
        p.career.length > 0 ||
        p.personal.length > 0 ||
        p.traits.length > 0 ||
        p.values.length > 0 ||
        p.hiddenAssets.length > 0 ||
        p.goals.length > 0 ||
        p.derived.howIWorkBest.length > 0 ||
        p.derived.cvSummary !== null ||
        p.derived.linkedinAbout !== null ||
        p.derived.interviewPitch !== null ||
        p.interview.messages.length > 0
    );
});

const formattedDate = computed(() => {
    const raw = persona.value.metadata.createdAt;
    if (!raw) return "";
    try {
        return new Date(raw).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return "";
    }
});

// Nameplate metadata line: language · date · sources.
const metaLine = computed(() => {
    const meta = persona.value.metadata;
    const parts: string[] = [meta.language.toUpperCase()];
    if (formattedDate.value) parts.push(formattedDate.value);
    if (meta.sourceUsed.length > 0) parts.push(meta.sourceUsed.join(", "));
    return parts.join("  ·  ");
});

const shortTermGoals = computed(() =>
    persona.value.goals
        .filter(g => g.type === PersonaGoalType.ShortTerm)
        .map(g => g.description)
);
const longTermGoals = computed(() =>
    persona.value.goals
        .filter(g => g.type === PersonaGoalType.LongTerm)
        .map(g => g.description)
);

const hasDerivedText = computed(() =>
    persona.value.derived.cvSummary !== null ||
    persona.value.derived.linkedinAbout !== null ||
    persona.value.derived.interviewPitch !== null
);

// Rehydrate the persisted persona on entry (mirrors InterviewPage's loadInterview).
// loadPersona surfaces any read failure into personaStore.error and never throws.
onMounted(() => {
    void personaStore.loadPersona();
});

async function onRegeneratePersona() {
    const client = llmClient.value;
    if (!client) return;

    isBusy.value = true;
    try {
        await runSynthesis(client, interviewStore, personaStore);
        // runSynthesis sets status to "completed" and commits the persona;
        // on failure it sets status to "error" and calls interviewStore.setError().
    } catch (e) {
        // Synthesis already surfaced the error into interviewStore.error.
        // Log only unexpected re-throws from infrastructure.
        logger.error("app", "Synthesis failed", { error: e instanceof Error ? e : undefined });
    } finally {
        isBusy.value = false;
    }
}
</script>

<template>
    <!-- No synthesized persona yet -->
    <Band v-if="!hasInsight" :grow="1">
        <Cell title="INSIGHT" spec="INS // 0x00" :grow="1">
            <div class="flex flex-col items-center justify-center text-center py-12 gap-3">
                <div class="ins-empty-icon">
                    <BookOpen :size="22" />
                </div>
                <h2 class="nc-heading-4">No mirror yet</h2>
                <p class="nc-text-sm nc-text-muted max-w-xs">
                    Complete an interview to generate your private insight document.
                </p>
            </div>
        </Cell>
    </Band>

    <!-- Synthesized persona — the instrument readout -->
    <template v-else>
        <!-- Nameplate: private-document metadata -->
        <Band>
            <Cell title="INSIGHT" spec="INS // 0x00">
                <!-- Page-level error banner -->
                <div
                    v-if="clientError"
                    class="flex items-center gap-2 p-3 mb-4 ivw-error"
                    role="alert"
                >
                    <p class="nc-text-sm ivw-error-text">{{ clientError }}</p>
                    <button
                        class="nc-btn nc-btn--ghost nc-btn--sm"
                        @click="clientError = null"
                    >
                        Dismiss
                    </button>
                </div>
                <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span class="nc-text-sm">Private reflection document</span>
                    <span class="nc-text-xs nc-text-muted">{{ metaLine }}</span>
                    <button class="nc-btn nc-btn--ghost" @click="onRegeneratePersona">Regenerate Persona</button>
                </div>
            </Cell>
        </Band>

        <!-- METRICS Band -->
        <Band>
            <MetricsMonitorCell :metrics="persona.metrics" />
        </Band>

        <!-- GOALS Band -->
        <Band>
            <StringListCell title="SHORT-TERM GOALS" spec="INS // 0x08" :items="shortTermGoals" />
            <StringListCell title="LONG-TERM GOALS"  spec="INS // 0x09" :items="longTermGoals" />
        </Band>

        <!-- STRENGTHS + GROWTH AREAS Band -->
        <Band>
            <Cell title="STRENGTHS" spec="INS // 0x02" :items="persona.strengths">
                <div class="flex flex-col gap-1">
                    <span v-if="persona.strengths.length === 0" class="nc-text-sm nc-text-muted">—</span>
                    <span v-for="(item, i) in persona.strengths" :key="i" class="slc-entry">▸ {{ item.title }}</span>
                    <span v-for="(item, i) in persona.strengths" :key="i" class="slc-entry">{{ item.description }}</span>
                </div>
            </Cell>
            <Cell title="GROWTH AREAS" spec="INS // 0x03" :items="persona.weaknesses">
                <div class="flex flex-col gap-1">
                    <span v-if="persona.weaknesses.length === 0" class="nc-text-sm nc-text-muted">—</span>
                    <span v-for="(item, i) in persona.weaknesses" :key="i" class="slc-entry">▸ {{ item.title }}</span>
                    <span v-for="(item, i) in persona.weaknesses" :key="i" class="slc-entry">{{ item.description }}</span>
                </div>
            </Cell>            
        </Band>

        <!-- VALUES + HIDDEN ASSETS Band -->
        <Band>
            <StringListCell title="VALUES"        spec="INS // 0x04" :items="persona.values" />
            <StringListCell title="HIDDEN ASSETS" spec="INS // 0x05" :items="persona.hiddenAssets" />
        </Band>

        <!-- SKILLS MAP Band -->
        <Band>
            <SkillsMapCell :skills="persona.skills" />
        </Band>

        <!-- PERSONALITY DIMENSIONS Band -->
        <Band>
            <DimensionsCell :traits="persona.traits" />
        </Band>

        <!-- CAREER TIMELINE Band — shown only when there are career entries -->
        <Band v-if="persona.career.length > 0">
            <CareerTimelineCell
                title="CAREER TIMELINE"
                spec="INS // 0x0A"
                :entries="persona.career"
            />
        </Band>

        <!-- OUTSIDE WORK Band — shown only when there are personal entries -->
        <Band v-if="persona.personal.length > 0">
            <CareerTimelineCell
                title="OUTSIDE WORK"
                spec="INS // 0x0B"
                :entries="persona.personal"
                tone="personal"
            />
        </Band>

        <!-- HOW I WORK BEST Band — shown only when there are statements -->
        <Band v-if="persona.derived.howIWorkBest.length > 0">
            <StringListCell
                title="HOW I WORK BEST"
                spec="INS // 0x0C"
                :items="persona.derived.howIWorkBest"
            />
        </Band>

        <!-- READY-TO-USE TEXT Band — shown when any derived text field is present -->
        <Band v-if="hasDerivedText">
            <DerivedTextCell
                :cv-summary="persona.derived.cvSummary"
                :linkedin-about="persona.derived.linkedinAbout"
                :interview-pitch="persona.derived.interviewPitch"
            />
        </Band>

        <!-- TRANSCRIPT Band — shown when interview messages exist -->
        <Band v-if="persona.interview.messages.length > 0">
            <TranscriptCell :messages="persona.interview.messages" />
        </Band>
    </template>
    <div v-if="isBusy" class="ivw-overlay">
                <div class="nc-acquire flex justify-center h-full">
                    <div class="nc-acquire__wave">
                        <div class="nc-acquire__bar" />
                        <div class="nc-acquire__bar" />
                        <div class="nc-acquire__bar" />
                        <div class="nc-acquire__bar" />
                        <div class="nc-acquire__bar" />
                    </div>
                    <div class="nc-acquire__label">Generating Persona</div>
                </div>
            </div>
</template>

<style scoped>
/* Empty-state glyph plate: a sized key-metal chip. No .nc-* class expresses a fixed
   icon chip, so this uses design tokens directly (rule 7.5); --nc-edge-raised is the
   system's machined-edge bevel token, not an ad-hoc elevation shadow. */
.ins-empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--nc-radius-md);
    background: var(--nc-metal-key);
    border: var(--nc-border-width) solid var(--nc-line-strong);
    box-shadow: var(--nc-edge-raised);
    color: var(--nc-ink-3);
}
</style>
