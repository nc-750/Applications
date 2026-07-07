<script setup lang="ts">
import { onMounted, ref } from "vue";

import { 
  Band,
  Button,
  Cell,
  ChassisHeader, 
} from "@nc-750/lab-vue";

import { useSettingsStore } from "./settings/stores";
import FeedbackModalCell from "./feedback/components/FeedbackModalCell.vue";

const appVersion = __APP_VERSION__;
const settingsStore = useSettingsStore();

const isFeedbackModalOpen = ref(false);

onMounted(() => {
  settingsStore.loadSettings();
});

function openFeedbackModal() {
    isFeedbackModalOpen.value = true;
}

function closeFeedbackModal() {
    isFeedbackModalOpen.value = false;
}
</script>

<template>
    <ChassisHeader title="NC-750 // MIRROR // NODE-0M" subtitle="0x00"/>
    <Band>
        <Cell title="" spec="" surface="brushed" variant="thin">
        <div class="flex items-baseline justify-between">
            <router-link to="/">Home</router-link>
            <div class="flex gap-4 items-baseline">
                <router-link to="/settings">Settings</router-link>
                <Button size="sm" variant="secondary" @click="openFeedbackModal">Feedback</Button>
            </div>
        </div>
        </Cell>
    </Band>
    <RouterView />
    <footer class="nc-chassis-footer flex justify-between">
        <a href="mailto:support@nc-750.com" class="nc-lcd-sub">NC-750 // MIRROR // SUPPORT</a>
        <span class="nc-label">v{{ appVersion }}</span>
        <FeedbackModalCell :open="isFeedbackModalOpen" @close="closeFeedbackModal"/>
    </footer>
</template>
