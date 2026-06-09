<script setup lang="ts">
import { ref, computed } from "vue";
import { Settings } from "lucide-vue-next";
import SettingsPanel from "../settings/SettingsPanel.vue";
import { useMirrorStore } from "../../stores/mirror";
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
const mirrorStore = useMirrorStore();

function isLocked(id: NavSection): boolean {
  return (id === "insight" || id === "profile") && !mirrorStore.persona;
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
const statusLabel = computed(() => STATUS_LABELS[mirrorStore.record?.status ?? "idle"] ?? "Idle");
const personaLabel = computed(
  () => mirrorStore.persona?.data.persona.identity.name ?? "None",
);
</script>

<template>
  <!-- nc-lab: the textured field. nc-chassis: the one framed device. -->
  <div class="nc-lab mr-shell">
    <div class="nc-chassis mr-shell__chassis">
      <!-- Header band: brand · segment nav · settings -->
      <div class="nc-band">
        <header class="nc-cell mr-shell__head">
          <div class="mr-shell__brand">
            <span class="mr-shell__logo"><LogoMark :size="18" /></span>
            <span class="nc-font-semibold" style="color: var(--nc-ink); letter-spacing: var(--nc-track-tight);">Mirror</span>
          </div>

          <nav class="nc-segment mr-shell__nav" aria-label="Main navigation">
            <button
              v-for="item in NAV_ITEMS"
              :key="item.id"
              :class="{ 'is-active': section === item.id }"
              :disabled="isLocked(item.id)"
              :aria-current="section === item.id ? 'page' : undefined"
              @click="navTo(item.id)"
            >
              {{ item.label }}
            </button>
          </nav>

          <button class="nc-btn nc-btn--ghost nc-btn--icon" aria-label="Open settings" @click="settingsOpen = true">
            <Settings :size="18" aria-hidden="true" />
          </button>
        </header>
      </div>

      <!-- Content: the active view fills this area -->
      <div class="mr-shell__content">
        <slot />
      </div>

      <!-- Status band -->
      <div class="nc-band">
        <footer class="nc-cell mr-shell__status">
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
    </div>

    <SettingsPanel :open="settingsOpen" @close="settingsOpen = false" @open-privacy="handleOpenPrivacyFromSettings" />
  </div>
</template>
