<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Lock, ExternalLink } from "lucide-vue-next";
import { getStoreUrl } from "../../lib/licenseKeyStore";
import { openExternal } from "../../lib/utils";
import LicenseModal from "./LicenseModal.vue";

defineProps<{
  title: string;
  description: string;
}>();

const modalOpen = ref(false);
const storeUrl = ref("");

onMounted(() => {
  getStoreUrl().then((url) => (storeUrl.value = url));
});
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center" style="padding: var(--nc-space-16) var(--nc-space-8);">
    <div
      style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--nc-radius-full); background: var(--nc-metal-key); border: var(--nc-border-width) solid var(--nc-line-strong); box-shadow: var(--nc-edge-raised); margin-bottom: var(--nc-space-4);"
    >
      <Lock :size="20" style="color: var(--nc-accent);" />
    </div>

    <h2 class="nc-heading-3" :style="{ marginBottom: 'var(--nc-space-2)' }">{{ title }}</h2>
    <p
      class="nc-text-sm nc-text-secondary"
      :style="{ lineHeight: 'var(--nc-leading-relaxed)', maxWidth: '20rem', marginBottom: 'var(--nc-space-6)' }"
    >
      {{ description }}
    </p>

    <div class="flex flex-col" style="gap: var(--nc-space-2); width: 100%; max-width: 200px;">
      <button
        class="nc-btn nc-btn--accent"
        :style="{ justifyContent: 'center', padding: '10px 0', fontWeight: 'var(--nc-font-semibold)' }"
        @click="modalOpen = true"
      >
        Activate License
      </button>

      <button
        v-if="storeUrl"
        style="display: flex; align-items: center; justify-content: center; gap: var(--nc-space-1); padding: var(--nc-space-2) 0; font-size: var(--nc-text-xs); color: var(--nc-accent-ink); background: none; border: none; cursor: pointer;"
        @click="openExternal(storeUrl)"
      >
        <ExternalLink :size="11" />
        Purchase a license
      </button>
    </div>

    <LicenseModal :open="modalOpen" @close="modalOpen = false" />
  </div>
</template>
