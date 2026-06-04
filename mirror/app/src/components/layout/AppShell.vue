<script setup lang="ts">
import { ref, computed } from "vue";
import { Settings } from "lucide-vue-next";
import SettingsPanel from "../settings/SettingsPanel.vue";
import { usePersonaStore } from "../../stores/personaStore";
import { useInterviewStore } from "../../stores/interviewStore";
import LogoMark from "../ui/LogoMark.vue";

type Section = "interview" | "insight" | "profile" | "privacy";
type NavSection = "interview" | "insight" | "profile";

const props = defineProps<{ section: Section }>();
const emit = defineEmits<{
  section: [s: NavSection];
  openPrivacy: [];
}>();

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: "interview", label: "Interview" },
  { id: "insight", label: "Insight" },
  { id: "profile", label: "Profile" },
];

const settingsOpen = ref(false);
const personaStore = usePersonaStore();
const interviewStore = useInterviewStore();

function isLocked(id: NavSection): boolean {
  return (id === "insight" || id === "profile") && !personaStore.persona;
}

function navTo(id: NavSection) {
  if (!isLocked(id)) emit("section", id);
}

function handleOpenPrivacyFromSettings() {
  settingsOpen.value = false;
  emit("openPrivacy");
}

// ── Status strip (replaces the old footer button rows) ────────
const SECTION_LABELS: Record<Section, string> = {
  interview: "Interview",
  insight: "Insight",
  profile: "Profile",
  privacy: "Privacy",
};

const STATUS_LABELS: Record<string, string> = {
  idle: "Idle",
  active: "Interviewing",
  synthesizing: "Building profile",
  completed: "Complete",
  error: "Error",
};

const sectionLabel = computed(() => SECTION_LABELS[props.section]);
const statusLabel = computed(() => STATUS_LABELS[interviewStore.record?.status ?? "idle"] ?? "Idle");
const personaLabel = computed(
  () => personaStore.persona?.data.persona.identity.name ?? "None",
);
</script>

<template>
  <div class="relative h-screen overflow-hidden" style="background: var(--nc-bg); padding: var(--nc-space-3);">
    <!-- One screwed-down faceplate: header / content / status strip -->
    <div
      class="nc-faceplate grid h-full overflow-hidden"
      style="grid-template-rows: auto minmax(0, 1fr) auto; border-radius: var(--nc-radius-md);"
    >
      <!-- Header: brand · segment nav · settings -->
      <header class="nc-cell flex flex-wrap items-center" style="gap: var(--nc-space-3) var(--nc-space-4);">
        <div class="flex items-center" style="gap: var(--nc-space-3);">
          <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--nc-radius-md); background: var(--nc-metal-key); border: var(--nc-border-width) solid var(--nc-line-strong); box-shadow: var(--nc-edge-raised);">
            <LogoMark :size="18" />
          </div>
          <span class="nc-font-semibold" style="color: var(--nc-ink); letter-spacing: var(--nc-track-tight);">Mirror</span>
        </div>

        <nav class="nc-segment" aria-label="Main navigation" style="margin: 0 auto;">
          <button
            v-for="item in NAV_ITEMS"
            :key="item.id"
            :class="{ 'is-active': section === item.id }"
            :disabled="isLocked(item.id)"
            :aria-current="section === item.id ? 'page' : undefined"
            :style="{
              opacity: isLocked(item.id) ? 0.45 : 1,
              cursor: isLocked(item.id) ? 'default' : 'pointer',
            }"
            @click="navTo(item.id)"
          >
            {{ item.label }}
          </button>
        </nav>

        <button class="nc-btn nc-btn--ghost nc-btn--icon" aria-label="Open settings" @click="settingsOpen = true">
          <Settings :size="18" aria-hidden="true" />
        </button>
      </header>

      <!-- Content: the active view fills this cell -->
      <div
        class="min-h-0 overflow-hidden"
        style="background: var(--nc-panel); box-shadow: inset 1px 1px 0 var(--nc-seam-highlight), inset -1px -1px 0 var(--nc-seam-shadow);"
      >
        <slot />
      </div>

      <!-- Status strip -->
      <footer class="nc-cell" style="padding: 0;">
        <div class="nc-spec-strip" style="border-top: none;">
          <div class="nc-spec">
            <span class="nc-spec__label">Section</span>
            <span class="nc-spec__value">{{ sectionLabel }}</span>
          </div>
          <div class="nc-spec">
            <span class="nc-spec__label">Status</span>
            <span class="nc-spec__value">{{ statusLabel }}</span>
          </div>
          <div class="nc-spec">
            <span class="nc-spec__label">Mirror</span>
            <span class="nc-spec__value">{{ personaLabel }}</span>
          </div>
        </div>
      </footer>
    </div>

    <SettingsPanel :open="settingsOpen" @close="settingsOpen = false" @open-privacy="handleOpenPrivacyFromSettings" />
  </div>
</template>
