<script setup lang="ts">
import { computed } from "vue";
import { Globe, Download } from "lucide-vue-next";
import { Band, Cell, Button } from "@nc-750/lab-vue";
import { useMirrorStore } from "../stores/mirror";
import { renderProfile } from "../skills/profileRenderer";
import { downloadFile } from "../lib/utils";
import { groupSkills } from "../skills/html";
import type { CareerEntry } from "../types/persona";

const mirrorStore = useMirrorStore();

const persona = computed(() => mirrorStore.persona?.data?.persona ?? null);
const howIWorkBest = computed<string[]>(
  () => mirrorStore.persona?.derived?.how_i_work_best ?? [],
);

const publicSkills = computed(() => {
  const skills = persona.value?.skills ?? [];
  return groupSkills(skills.filter((s) => s.source !== "inferred"));
});

function formatYearRange(entry: CareerEntry): string {
  const end = entry.year_end === "present" ? "Present" : String(entry.year_end);
  return `${entry.year_start} – ${end}`;
}

function handleDownload() {
  if (!mirrorStore.persona) return;
  const html = renderProfile(
    mirrorStore.persona.data,
    mirrorStore.persona.derived.how_i_work_best,
  );
  const name =
    mirrorStore.persona.data.persona.identity.name
      .replace(/\s+/g, "-")
      .toLowerCase() || "mirror";
  downloadFile(html, `${name}-profile.html`, "text/html");
}
</script>

<template>
  <Band :grow="1" class="overflow-y-auto">
    <!-- Empty state: no persona loaded -->
    <Cell v-if="!persona" title="PROFILE" spec="// PUBLIC 0x00">
      <div class="flex flex-col items-center justify-center text-center py-12 gap-3">
        <div class="mr-empty-icon">
          <Globe :size="26" />
        </div>
        <h2 class="nc-heading-4">No mirror yet</h2>
        <p class="nc-text-sm nc-text-muted max-w-xs">
          Run an interview first to generate your public profile.
        </p>
      </div>
    </Cell>

    <!-- Loaded state: persona present -->
    <template v-else>
      <!-- Header area -->
      <div class="flex items-center justify-between gap-3 px-1 pb-3">
        <div class="flex items-center gap-2 min-w-0">
          <h1 class="nc-heading-3 truncate">{{ persona.identity.name }}</h1>
          <span
            class="mr-public-badge shrink-0 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border"
          >
            Public Profile
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          @click="handleDownload"
        >
          <Download :size="14" class="mr-1.5" />
          Download
        </Button>
      </div>

      <!-- Section 1: About -->
      <Cell title="ABOUT" spec="// PUBLIC 0x01">
        <div class="flex flex-col gap-3">
          <div>
            <h2 class="nc-heading-3">{{ persona.identity.name }}</h2>
            <p class="nc-text-sm nc-text-muted mt-1">
              {{ persona.identity.tagline }}
            </p>
          </div>
          <p class="nc-text-sm leading-relaxed max-w-prose">
            {{ persona.identity.elevator_pitch }}
          </p>
        </div>
      </Cell>

      <!-- Section 2: How I Work Best -->
      <Cell v-if="howIWorkBest.length > 0" title="HOW I WORK BEST" spec="// PUBLIC 0x02">
        <ul class="flex flex-col">
          <li
            v-for="(statement, i) in howIWorkBest"
            :key="`how-${i}`"
            class="py-2.5 border-b border-[var(--nc-line-soft)] last:border-b-0 last:pb-0 nc-text-sm"
          >
            {{ statement }}
          </li>
        </ul>
      </Cell>

      <!-- Section 3: Strengths -->
      <Cell title="STRENGTHS" spec="// PUBLIC 0x03">
        <div class="flex flex-col gap-3">
          <div
            v-for="(s, i) in persona.strengths"
            :key="`strength-${i}`"
            class="rounded-[var(--nc-radius-md)] border border-[var(--nc-line-soft)] bg-[var(--nc-panel-1)] p-4"
          >
            <h3 class="nc-text-sm font-semibold">{{ s.label }}</h3>
            <p class="nc-text-sm nc-text-muted mt-1">{{ s.description }}</p>
          </div>
          <p
            v-if="!persona.strengths.length"
            class="nc-text-sm nc-text-muted italic"
          >
            No strengths recorded.
          </p>
        </div>
      </Cell>

      <!-- Section 4: Skills -->
      <Cell title="SKILLS" spec="// PUBLIC 0x04">
        <div v-if="publicSkills.size > 0" class="flex flex-col gap-3">
          <div
            v-for="[category, skills] in publicSkills"
            :key="`cat-${category}`"
          >
            <h3 class="nc-text-xs font-semibold uppercase tracking-wider nc-text-muted mb-2">
              {{ category }}
            </h3>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="skill in skills"
                :key="`skill-${category}-${skill.name}`"
                class="skill-tag"
              >
                {{ skill.name }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="nc-text-sm nc-text-muted italic">
          No public skills recorded.
        </p>
      </Cell>

      <!-- Section 5: Experience -->
      <Cell title="EXPERIENCE" spec="// PUBLIC 0x05">
        <div v-if="persona.career_timeline.length > 0" class="flex flex-col gap-4">
          <div
            v-for="(entry, i) in persona.career_timeline"
            :key="`career-${i}`"
            class="flex gap-3"
          >
            <!-- Timeline dot column -->
            <div class="flex flex-col items-center pt-1 shrink-0">
              <div class="mr-timeline-dot w-2.5 h-2.5 rounded-full shrink-0" />
              <div
                v-if="i < persona.career_timeline.length - 1"
                class="mr-timeline-line w-px flex-1 min-h-[16px] mt-0.5"
              />
            </div>
            <!-- Content -->
            <div class="flex-1 pb-3 min-w-0">
              <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <div class="min-w-0">
                  <h3 class="nc-text-sm font-semibold truncate">{{ entry.role }}</h3>
                  <p class="nc-text-sm nc-text-muted">{{ entry.organization }}</p>
                </div>
                <span class="timeline-year">{{ formatYearRange(entry) }}</span>
              </div>
              <p
                v-if="entry.highlight"
                class="nc-text-sm nc-text-muted mt-1.5"
              >
                {{ entry.highlight }}
              </p>
            </div>
          </div>
        </div>
        <p v-else class="nc-text-sm nc-text-muted italic">
          No experience recorded.
        </p>
      </Cell>

      <!-- Section 6: Beyond Work -->
      <Cell title="BEYOND WORK" spec="// PUBLIC 0x06">
        <div v-if="persona.non_professional.length > 0" class="flex flex-col gap-3">
          <div
            v-for="(entry, i) in persona.non_professional"
            :key="`beyond-${i}`"
            class="rounded-[var(--nc-radius-md)] border border-[var(--nc-line-soft)] bg-[var(--nc-panel-1)] p-4"
          >
            <h3 class="nc-text-sm font-semibold">{{ entry.activity }}</h3>
            <div
              v-if="entry.skills_revealed.length > 0"
              class="flex flex-wrap gap-1 mt-2"
            >
              <span
                v-for="sk in entry.skills_revealed"
                :key="`beyond-skill-${i}-${sk}`"
                class="skill-tag"
              >
                {{ sk }}
              </span>
            </div>
            <p
              v-if="entry.note"
              class="nc-text-sm nc-text-muted mt-1.5"
            >
              {{ entry.note }}
            </p>
          </div>
        </div>
        <p v-else class="nc-text-sm nc-text-muted italic">
          No beyond-work activities recorded.
        </p>
      </Cell>
    </template>
  </Band>
</template>

<style scoped>
.mr-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--nc-radius-lg);
  background: var(--nc-metal-key);
  border: var(--nc-border-width) solid var(--nc-line-strong);
  box-shadow: var(--nc-edge-raised);
}

.skill-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--nc-radius-sm);
  background: var(--nc-panel-2);
  font-size: var(--nc-text-xs);
  color: var(--nc-ink);
}

.mr-public-badge {
  background: var(--nc-panel-2);
  border-color: var(--nc-line-strong);
  color: var(--nc-ink-3);
}

.mr-timeline-dot {
  background: var(--nc-ink-3);
}

.mr-timeline-line {
  background: var(--nc-line-soft);
}

.timeline-year {
  font-family: var(--nc-font-mono);
  font-size: var(--nc-text-xs);
  color: var(--nc-ink-3);
  white-space: nowrap;
}
</style>
