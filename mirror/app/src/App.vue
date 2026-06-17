<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from 'vue-router'

import { 
  Band,
  Cell,
  ChassisHeader, 
  ChassisFooter
} from "@nc-750/lab-vue";

import { useSettingsStore } from "./settings/stores";

const settingsStore = useSettingsStore();

const route = useRoute()

const isWelcomePage = computed(() => route.name === "welcome");
const isSettingsPage = computed(() => route.name === "settings");

const cellLayout = computed(() => {
    let layout = "flex";

    if (isSettingsPage.value) {
        return layout + " justify-start";
    }

    if (isWelcomePage.value) {
        return layout + " justify-end";
    }

    return layout + " justify-between"
});

onMounted(() => {
  settingsStore.loadSettings();
});
</script>

<template>
    <ChassisHeader title="NC-750 // MIRROR // NODE-0M" subtitle="0x00"/>
    <Band>
        <Cell title="" spec="" surface="brushed" variant="thin">
        <div :class="cellLayout">
            <router-link v-if="!isWelcomePage" to="/">Home</router-link>
            <router-link v-if="!isSettingsPage" to="/settings">Settings</router-link>
        </div>
        </Cell>
    </Band>
    <RouterView />
    <footer class="nc-chassis-footer">
        <a href="mailto:support@nc-750.com" class="nc-lcd-sub">NC-750 // MIRROR // SUPPORT</a>
    </footer>
</template>
