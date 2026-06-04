<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Download, Globe, Menu, X } from "lucide-vue-next";
import { usePersonaStore } from "../../stores/personaStore";
import { renderProfile } from "../../skills/profileRenderer";
import { downloadFile } from "../../lib/utils";
import ProfilePlaceholderPanel from "./ProfilePlaceholderPanel.vue";

const personaStore = usePersonaStore();

const html = computed(() =>
  personaStore.persona ? renderProfile(personaStore.persona.data, personaStore.persona.derived.how_i_work_best) : null,
);

function handleDownload() {
  if (!html.value) return;
  const name =
    personaStore.persona?.data.persona.identity.name.replace(/\s+/g, "-").toLowerCase() ?? "persona";
  downloadFile(html.value, `${name}-profile.html`, "text/html");
}

// Mobile responsive
const iframeRef = ref<HTMLIFrameElement | null>(null);
const isMobile = ref(false);
const showRightPanel = ref(false);

const navButtons = [
  { id: "brief", label: "Brief", sectionId: "section-brief" },
  { id: "strengths", label: "Strengths", sectionId: "section-strengths" },
  { id: "skills", label: "Skills", sectionId: "section-skills" },
  { id: "how-i-work", label: "How I Work Best", sectionId: "section-how-i-work-best" },
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
  <div v-if="!personaStore.persona || !html" class="flex flex-col items-center justify-center text-center" style="gap: var(--nc-space-4); padding: var(--nc-space-12) var(--nc-space-6);">
    <div style="display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: var(--nc-radius-lg); background: var(--nc-metal-key); border: var(--nc-border-width) solid var(--nc-line-strong); box-shadow: var(--nc-edge-raised); margin-bottom: var(--nc-space-2);">
      <Globe :size="26" />
    </div>
    <h2 class="nc-heading-3">No persona yet</h2>
    <p class="nc-text-sm nc-text-muted" :style="{ maxWidth: '20rem' }">
      Run an interview first to generate your public profile.
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
          <span class="nc-text-sm nc-font-semibold" style="color: var(--nc-ink);">Profile</span>
          <span class="nc-badge nc-badge--success">Public</span>
        </div>
        <div class="flex items-center" style="gap: var(--nc-space-2);">
          <button class="nc-btn nc-btn--secondary nc-btn--sm" @click="handleDownload">
            <Download :size="13" />
            Download HTML
          </button>
          <button
            v-if="isMobile"
            class="nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm"
            aria-label="Show details"
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
        style="border: 0; background-color: white;"
        sandbox="allow-same-origin allow-popups"
        title="Public Profile"
      />
    </div>

    <!-- Right cell: section nav + theme + placeholder (desktop) -->
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
        <select class="nc-select nc-select--sm" disabled style="max-width: 160px; margin-top: var(--nc-space-2);">
          <option>Default Theme</option>
        </select>
      </div>
      <ProfilePlaceholderPanel />
    </div>

    <!-- Mobile overlay: section nav + theme + placeholder -->
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
        <div class="flex flex-wrap" style="gap: var(--nc-space-2); margin-bottom: var(--nc-space-3);">
          <button
            v-for="btn in navButtons"
            :key="btn.id"
            class="nc-btn nc-btn--secondary nc-btn--sm"
            @click="scrollToSection(btn.sectionId); showRightPanel = false"
          >
            {{ btn.label }}
          </button>
        </div>
        <select class="nc-select nc-select--sm" disabled style="max-width: 160px; margin-bottom: var(--nc-space-5);">
          <option>Default Theme</option>
        </select>
        <ProfilePlaceholderPanel />
      </div>
    </template>
  </div>
</template>
