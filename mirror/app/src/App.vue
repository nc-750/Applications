<script setup lang="ts">
import { onMounted } from "vue";

import { ChassisHeader, ChassisFooter } from "@nc-750/lab-vue";
import NavigationBand from "./components/NavigationBand.vue";
import { useAppStore } from "./AppStore.ts";

const appStore = useAppStore();

onMounted(() => {
  appStore.settings.loadSettings();
});
</script>

<template>
    <ChassisHeader title="NC-750 // MIRROR // NODE-0M" subtitle="0x00"/>
    <NavigationBand />
    <RouterView />
    <ChassisFooter title="NC-750 // MIRROR // NODE-0M"/>
</template>
