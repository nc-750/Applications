<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Download, BookOpen, Menu, X } from "lucide-vue-next";
import { usePersonaStore } from "../../stores/personaStore";
import { renderInsight } from "../../skills/insightRenderer";
import { downloadFile } from "../../lib/utils";
import InsightHistoryPanel from "./InsightHistoryPanel.vue";

const personaStore = usePersonaStore();

const html = computed(() => (personaStore.persona ? renderInsight(personaStore.persona.data) : null));

function handleDownload() {
  if (!html.value) return;
  const name =
    personaStore.persona?.data.persona.identity.name.replace(/\s+/g, "-").toLowerCase() ?? "persona";
  downloadFile(html.value, `${name}-insight.html`, "text/html");
}

// Mobile responsive
const iframeRef = ref<HTMLIFrameElement | null>(null);
const isMobile = ref(false);
const showRightPanel = ref(false);

const interviewHistory = computed(() =>
  personaStore.persona?.data.source?.interview ?? [],
);

const navButtons = [
  { id: "brief", label: "Brief", sectionId: "section-brief" },
  { id: "strengths", label: "Strengths", sectionId: "section-strengths" },
  { id: "weaknesses", label: "Weaknesses", sectionId: "section-weaknesses" },
  { id: "skills", label: "Skills", sectionId: "section-skills" },
  { id: "career", label: "Career", sectionId: "section-career" },
  { id: "values", label: "Values", sectionId: "section-values" },
  { id: "use-cases", label: "Use Cases", sectionId: "section-use-cases" },
];

function scrollToSection(sectionId: string) {
  const doc = iframeRef.value?.contentDocument;
  if (!doc) return;
  doc.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
}

function onResize() {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) showRightPanel.value = false;
}
onMounted(() => {
  onResize();
  window.addEventListener("resize", onResize);
});
onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});
</script>

<template>
  <div
    v-if="!personaStore.persona || !html"
    class="flex flex-col items-center justify-center text-center"
    style="gap: var(--nc-space-3); padding: var(--nc-space-12) var(--nc-space-6);"
  >
    <div
      style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--nc-radius-md); background: var(--nc-metal-key); border: var(--nc-border-width) solid var(--nc-line-strong); box-shadow: var(--nc-edge-raised); color: var(--nc-ink-3); margin-bottom: var(--nc-space-1);"
    >
      <BookOpen :size="22" />
    </div>
    <h2 class="nc-heading-4">No persona yet</h2>
    <p class="nc-text-sm nc-text-muted" :style="{ maxWidth: '20rem', lineHeight: 'var(--nc-leading-relaxed)' }">
      Complete an interview to generate your private insight document.
    </p>
  </div>

  <!-- Loaded state: two-cell layout -->
  <div
    v-else
    class="grid h-full overflow-hidden"
    :style="{
      gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 2fr) minmax(0, 1fr)',
      gap: 'var(--nc-seam-width)',
      background: 'var(--nc-seam-fill)',
    }"
  >
    <!-- Left cell: iframe -->
    <div
      class="flex flex-col overflow-hidden min-h-0"
      style="
        background: var(--nc-panel);
        box-shadow: inset 1px 1px 0 var(--nc-seam-highlight), inset -1px -1px 0 var(--nc-seam-shadow);
      "
    >
      <div class="flex items-center justify-between shrink-0" style="padding: var(--nc-space-3) var(--nc-space-5); border-bottom: var(--nc-border-width) solid var(--nc-line-subtle);">
        <div class="flex items-center" style="gap: var(--nc-space-2);">
          <span class="nc-text-sm nc-font-semibold" style="color: var(--nc-ink);">Insight</span>
          <span class="nc-badge nc-badge--accent">Private</span>
        </div>
        <div class="flex items-center" style="gap: var(--nc-space-2);">
          <button class="nc-btn nc-btn--secondary nc-btn--sm" @click="handleDownload">
            <Download :size="12" />
            Download HTML
          </button>
          <button
            v-if="isMobile"
            class="nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm"
            aria-label="Show history"
            @click="showRightPanel = true"
          >
            <Menu :size="16" />
          </button>
        </div>
      </div>
      <iframe
        ref="iframeRef"
        :srcdoc="html ?? ''"
        class="flex-1 min-h-0"
        style="border: 0;"
        sandbox="allow-same-origin allow-popups"
        title="Persona Insight"
      />
    </div>

    <!-- Right cell: section nav + interview history (desktop) -->
    <div
      v-if="!isMobile"
      class="flex flex-col overflow-y-auto"
      style="
        background: var(--nc-panel);
        padding: var(--nc-space-5);
        gap: var(--nc-space-5);
        box-shadow: inset 1px 1px 0 var(--nc-seam-highlight), inset -1px -1px 0 var(--nc-seam-shadow);
      "
    >
      <div class="flex flex-col" style="gap: var(--nc-space-2);">
        <span class="nc-label">Jump to</span>
        <div class="flex flex-wrap" style="gap: var(--nc-space-2);">
          <button
            v-for="btn in navButtons"
            :key="btn.id"
            class="nc-btn nc-btn--secondary nc-btn--sm"
            @click="scrollToSection(btn.sectionId)"
          >
            {{ btn.label }}
          </button>
        </div>
      </div>
      <InsightHistoryPanel :history="interviewHistory" />
    </div>

    <!-- Mobile overlay: section nav + interview history -->
    <template v-if="isMobile && showRightPanel">
      <div
        class="fixed inset-0 z-30"
        style="background: rgba(0,0,0,0.35);"
        @click="showRightPanel = false"
      />
      <div
        class="fixed top-0 right-0 bottom-0 z-40 w-72 overflow-y-auto"
        style="
          background: var(--nc-panel);
          padding: var(--nc-space-5);
          box-shadow: -4px 0 24px rgba(0,0,0,0.3);
        "
      >
        <button
          class="nc-btn nc-btn--ghost nc-btn--sm"
          style="margin-bottom: var(--nc-space-4);"
          @click="showRightPanel = false"
        >
          <X :size="14" />
          Close
        </button>
        <div class="flex flex-wrap" style="gap: var(--nc-space-2); margin-bottom: var(--nc-space-5);">
          <button
            v-for="btn in navButtons"
            :key="btn.id"
            class="nc-btn nc-btn--secondary nc-btn--sm"
            @click="scrollToSection(btn.sectionId); showRightPanel = false"
          >
            {{ btn.label }}
          </button>
        </div>
        <InsightHistoryPanel :history="interviewHistory" />
      </div>
    </template>
  </div>
</template>
