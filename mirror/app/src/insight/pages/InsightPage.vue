<script setup lang="ts">
import { computed } from "vue";
import { BookOpen } from "lucide-vue-next";
import { Band, Cell } from "@nc-750/lab-vue";
import { useAppStore } from "../../AppStore";
import { SKILL_CATEGORIES } from "../../types/persona";

const personaStore = useAppStore().persona;

const persona = computed(() => personaStore.persona);

const skillsByCategory = computed(() => {
  const skills = persona.value?.skills ?? [];
  const map = new Map<string, typeof skills>();
  for (const cat of SKILL_CATEGORIES) {
    map.set(cat, []);
  }
  for (const s of skills) {
    const bucket = map.get(String(s.category));
    if (bucket) bucket.push(s);
  }
  // Return only categories that have skills
  return Array.from(map.entries()).filter(([, items]) => items.length > 0);
});

const timelineSorted = computed(() => {
  if (!persona.value) return [];
  return [...persona.value.career].sort(
    (a, b) => b.dateStart - a.dateStart,
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
    return raw;
  }
});
</script>

<template>
  <!-- Empty state -->
  <Band v-if="!persona" :grow="1">
    <Cell title="INSIGHT" spec="// 0x00">
      <div class="flex flex-col items-center justify-center text-center py-12 gap-3">
        <div class="mr-empty-icon">
          <BookOpen :size="22" />
        </div>
        <h2 class="nc-heading-4">No mirror yet</h2>
        <p class="nc-text-sm nc-text-muted max-w-xs">
          Complete an interview to generate your private insight document.
        </p>
      </div>
    </Cell>
  </Band>

  <!-- Loaded state -->
  <Band v-else :grow="1" class="overflow-y-auto">
    <!-- 0x01 Identity -->
    <Cell title="IDENTITY" spec="// 0x01">
      <!-- <div class="flex flex-col gap-3">
        <h2 class="nc-heading-3">{{ persona.identity.name }}</h2>
        <p class="nc-text-md nc-text-secondary">{{ persona.identity.tagline }}</p>
        <p class="nc-text-sm">{{ persona.identity.elevator_pitch }}</p>
        <p class="nc-text-xs nc-text-muted">
          {{ persona.metadata.language }} &middot; {{ formattedDate }}
        </p>
      </div> -->
    </Cell>

    <!-- 0x02 Strengths -->
    <Cell title="STRENGTHS" spec="// 0x02">
      <!-- <div class="flex flex-col gap-4">
        <div
          v-for="(s, i) in persona.strengths"
          :key="i"
          class="flex flex-col gap-1"
        >
          <span class="nc-label">{{ s.label }}</span>
          <p class="nc-text-sm">{{ s.description }}</p>
          <p v-if="s.evidence" class="nc-text-xs nc-text-muted italic">
            {{ s.evidence }}
          </p>
        </div>
      </div> -->
    </Cell>

    <!-- 0x03 Growth Areas -->
    <Cell title="GROWTH AREAS" spec="// 0x03">
      <!-- <div class="flex flex-col gap-4">
        <div
          v-for="(w, i) in persona.weaknesses"
          :key="i"
          class="flex flex-col gap-1"
        >
          <span class="nc-label">{{ w.label }}</span>
          <p class="nc-text-sm">{{ w.description }}</p>
          <p v-if="w.growth_note" class="nc-text-xs nc-text-muted italic">
            {{ w.growth_note }}
          </p>
        </div>
      </div> -->
    </Cell>

    <!-- 0x04 Skills Map -->
    <Cell title="SKILLS MAP" spec="// 0x04">
      <!-- <div class="flex flex-col gap-4">
        <div
          v-for="[category, skills] in skillsByCategory"
          :key="category"
          class="flex flex-col gap-2"
        >
          <span class="nc-label">{{ category }}</span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(sk, j) in skills"
              :key="j"
              class="skill-tag"
            >
              {{ sk.name }}
              <span v-if="sk.level" class="nc-text-muted ml-1">{{ sk.level }}</span>
            </span>
          </div>
        </div>
      </div> -->
    </Cell>

    <!-- 0x05 Career Timeline -->
    <Cell title="CAREER TIMELINE" spec="// 0x05">
      <!-- <div class="flex flex-col gap-4">
        <div
          v-for="(entry, i) in timelineSorted"
          :key="i"
          class="timeline-row"
        >
          <span class="timeline-year">
            {{ entry.year_start }} &ndash; {{ entry.year_end }}
          </span>
          <div class="flex flex-col gap-1">
            <span class="nc-label">
              {{ entry.role }}
              <span class="nc-text-muted">&#64; {{ entry.organization }}</span>
            </span>
            <p v-if="entry.highlight" class="nc-text-sm">{{ entry.highlight }}</p>
            <p
              v-if="entry.real_story"
              class="nc-text-xs nc-text-muted italic"
            >
              {{ entry.real_story }}
            </p>
          </div>
        </div>
      </div> -->
    </Cell>

    <!-- 0x06 Hidden Assets -->
    <Cell title="HIDDEN ASSETS" spec="// 0x06">
      <!-- <ul class="flex flex-col gap-2">
        <li
          v-for="(asset, i) in persona.hidden_assets"
          :key="i"
          class="nc-text-sm list-disc ml-4"
        >
          {{ asset }}
        </li>
      </ul> -->
    </Cell>

    <!-- 0x07 Personality Dimensions -->
    <Cell title="PERSONALITY DIMENSIONS" spec="// 0x07">
      <!-- <div class="flex flex-col gap-4">
        <div
          v-for="(trait, i) in persona.personality_traits"
          :key="i"
          class="flex flex-col gap-1"
        >
          <div class="flex justify-between items-baseline">
            <span class="nc-label">{{ trait.dimension }}</span>
            <span class="nc-text-xs nc-text-muted">{{ trait.position }} / 10</span>
          </div>
          <div class="personality-bar">
            <div
              class="personality-bar__fill"
              :style="{ width: `${trait.position * 10}%` }"
            />
          </div>
          <p v-if="trait.note" class="nc-text-xs nc-text-muted italic">
            {{ trait.note }}
          </p>
        </div>
      </div> -->
    </Cell>

    <!-- 0x08 Values & Goals -->
    <Cell title="VALUES &amp; GOALS" spec="// 0x08">
      <!-- <div class="flex flex-col gap-4"> -->
        <!-- Values -->
        <!-- <div class="flex flex-col gap-2">
          <span class="nc-label">Values</span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(v, i) in persona.values"
              :key="i"
              class="skill-tag"
            >
              {{ v }}
            </span>
          </div>
        </div> -->
        <!-- Goals -->
        <!-- <div class="flex flex-col gap-3">
          <div v-if="persona.goals.short_term" class="flex flex-col gap-1">
            <span class="nc-label">Short-term</span>
            <p class="nc-text-sm">{{ persona.goals.short_term }}</p>
          </div>
          <div v-if="persona.goals.long_term" class="flex flex-col gap-1">
            <span class="nc-label">Long-term</span>
            <p class="nc-text-sm">{{ persona.goals.long_term }}</p>
          </div>
        </div>
      </div> -->
    </Cell>

    <!-- 0x09 Ready-to-use Text -->
    <!-- <Cell v-if="hasUseCases" title="READY-TO-USE TEXT" spec="// 0x09">
      <button
        class="flex items-center gap-2 w-full text-left nc-text-sm nc-label py-1"
        @click="useCasesExpanded = !useCasesExpanded"
      >
        <ChevronDown v-if="useCasesExpanded" :size="14" />
        <ChevronRight v-else :size="14" />
        Ready-to-use copy
      </button>
      <div v-if="useCasesExpanded" class="flex flex-col gap-4 mt-3">
        <div v-if="persona.use_cases.cv_summary" class="flex flex-col gap-1">
          <span class="nc-label">CV Summary</span>
          <p class="nc-text-sm">{{ persona.use_cases.cv_summary }}</p>
        </div>
        <div v-if="persona.use_cases.interview_pitch" class="flex flex-col gap-1">
          <span class="nc-label">Interview Pitch</span>
          <p class="nc-text-sm">{{ persona.use_cases.interview_pitch }}</p>
        </div>
        <div v-if="persona.use_cases.linkedin_about" class="flex flex-col gap-1">
          <span class="nc-label">LinkedIn About</span>
          <p class="nc-text-sm">{{ persona.use_cases.linkedin_about }}</p>
        </div>
      </div>
    </Cell> -->
  </Band>
</template>

<style scoped>
.mr-empty-icon {
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

.personality-bar {
  height: 8px;
  border-radius: 4px;
  background: var(--nc-panel-2);
  overflow: hidden;
}

.personality-bar__fill {
  height: 100%;
  border-radius: 4px;
  background: var(--nc-accent);
}

.timeline-year {
  font-family: var(--nc-font-mono);
  font-size: var(--nc-text-xs);
  color: var(--nc-ink-3);
  white-space: nowrap;
}

.skill-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--nc-radius-sm);
  background: var(--nc-panel-2);
  font-size: var(--nc-text-xs);
  color: var(--nc-ink);
}

.timeline-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
}
</style>
