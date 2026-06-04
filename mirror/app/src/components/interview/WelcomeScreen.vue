<script setup lang="ts">
import { ref } from "vue";
import { MessageSquare, Upload, Sparkles } from "lucide-vue-next";
import { usePersonaStore } from "../../stores/personaStore";
import { useLicenseStore } from "../../stores/licenseStore";
import LogoMark from "../ui/LogoMark.vue";
import LicenseModal from "../license/LicenseModal.vue";

defineEmits<{
  start: [];
  import: [];
  openPrivacy: [];
}>();

const personaStore = usePersonaStore();
const licenseStore = useLicenseStore();
const licenseOpen = ref(false);
</script>

<template>
  <div class="flex flex-col items-center text-center" style="padding: var(--nc-space-12) var(--nc-space-6); max-width: 36rem; margin: 0 auto;">
    <!-- Mark -->
    <div style="display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: var(--nc-radius-lg); background: var(--nc-metal-key); border: var(--nc-border-width) solid var(--nc-line-strong); box-shadow: var(--nc-edge-raised); margin-bottom: var(--nc-space-7);">
      <LogoMark :size="30" />
    </div>

    <h1 class="nc-heading-3" style="margin-bottom: var(--nc-space-3);">
      {{ personaStore.persona ? "Run a new interview" : "Welcome to Persona" }}
    </h1>

    <p
      class="nc-text-secondary nc-text-sm"
      style="max-width: 24rem; margin-bottom: var(--nc-space-8); line-height: var(--nc-leading-relaxed);"
    >
      {{
        personaStore.persona
          ? `You have a persona for ${personaStore.persona.data.persona.identity.name}. Start a new interview to update it, or import an existing persona.json.`
          : "Your AI-powered personal profile. Run a short interview and get a private insight document and a public-ready profile — all on your device."
      }}
    </p>

    <!-- Actions -->
    <div class="flex flex-col" style="gap: var(--nc-space-3); width: 100%; max-width: 20rem;">
      <button class="nc-btn nc-btn--accent nc-btn--lg" :style="{ justifyContent: 'center' }" @click="$emit('start')">
        <MessageSquare :size="15" aria-hidden="true" />
        {{ personaStore.persona ? "New interview" : "Start interview" }}
      </button>
      <button class="nc-btn nc-btn--secondary nc-btn--lg" :style="{ justifyContent: 'center' }" @click="$emit('import')">
        <Upload :size="15" aria-hidden="true" />
        Import persona.json
      </button>
    </div>

    <!-- Tier note -->
    <div
      v-if="!licenseStore.isPro"
      class="flex items-start"
      style="gap: var(--nc-space-2); margin-top: var(--nc-space-7); font-size: var(--nc-text-xs); color: var(--nc-ink-3); max-width: 24rem; text-align: left;"
    >
      <Sparkles :size="13" :style="{ color: 'var(--nc-accent)', flexShrink: 0 }" aria-hidden="true" />
      <span>
        Free interview — a surface profile. Upgrade for a deep excavation interview and richer insights.
        <button style="font-size: var(--nc-text-xs); color: var(--nc-accent-ink); background: none; border: none; cursor: pointer; text-decoration: underline;" @click="licenseOpen = true">
          Activate license →
        </button>
      </span>
    </div>

    <LicenseModal :open="licenseOpen" @close="licenseOpen = false" />

    <!-- Privacy note -->
    <div v-if="!personaStore.persona" :style="{ marginTop: 'var(--nc-space-10)', maxWidth: '20rem' }">
      <p class="nc-text-xs nc-text-muted" :style="{ marginBottom: 'var(--nc-space-1)' }">
        All data stays on your device. No account required. Bring your own API key.
      </p>
      <p class="nc-text-xs nc-text-muted">
        Your messages are sent to your AI provider.
        <button style="font-size: var(--nc-text-xs); color: var(--nc-accent-ink); background: none; border: none; cursor: pointer; text-decoration: underline;" @click="$emit('openPrivacy')">
          Read the privacy details →
        </button>
      </p>
    </div>
  </div>
</template>
