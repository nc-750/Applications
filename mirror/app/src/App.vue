<script setup lang="ts">
import { onMounted } from "vue";

import { ChassisHeader, ChassisFooter } from "@nc-750/lab-vue";
import { useMirrorStore } from "./stores/mirror";

const mirrorStore = useMirrorStore();

onMounted(() => {
  mirrorStore.loadSettings();
});
</script>

<template>
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-[var(--nc-panel)] focus:p-3 focus:rounded focus:text-[var(--nc-accent-ink)] focus:outline-2 focus:outline-[var(--nc-accent)] focus:outline-offset-2">
      Skip to content
    </a>
    <ChassisHeader title="NC-750 // MIRROR // NODE-0M" subtitle="0x00"/>
      <div id="main-content" tabindex="-1">
        <RouterView />
      </div>
    <ChassisFooter title="NC-750 // MIRROR // NODE-0M"/>
</template>
