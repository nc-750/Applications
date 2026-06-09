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
    <ChassisHeader title="NC-750 // MIRROR // NODE-0M" subtitle="0x00"/>
    <RouterView />
    <ChassisFooter title="NC-750 // MIRROR // NODE-0M"/>
</template>
