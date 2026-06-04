<script setup lang="ts">
import { ref, onMounted } from "vue";
import AppShell from "./components/layout/AppShell.vue";
import InterviewView from "./components/interview/InterviewView.vue";
import InsightView from "./components/insight/InsightView.vue";
import ProfileView from "./components/profile/ProfileView.vue";
import PrivacyView from "./components/privacy/PrivacyView.vue";
import { useSettingsStore } from "./stores/settingsStore";
import { usePersonaStore } from "./stores/personaStore";
import { useInterviewStore } from "./stores/interviewStore";
import { useLicenseStore } from "./stores/licenseStore";
import { useLogStore } from "./stores/logStore";
import { setDebugEnabled } from "./logger";

type Section = "interview" | "insight" | "profile" | "privacy";

const section = ref<Section>("interview");

const settingsStore = useSettingsStore();
const personaStore = usePersonaStore();
const interviewStore = useInterviewStore();
const licenseStore = useLicenseStore();
const logStore = useLogStore();

// Load all persistent state on mount
onMounted(() => {
  Promise.all([settingsStore.load(), personaStore.load(), interviewStore.load(), licenseStore.load()]).then(() => {
    // Sync persisted debug toggle to the logger and log store
    const debugEnabled = settingsStore.debugEnabled;
    logStore.setDebugEnabled(debugEnabled);
    setDebugEnabled(debugEnabled);
  });
});

function handleInterviewComplete(target: "insight" | "profile") {
  section.value = target;
}

function openPrivacy() {
  section.value = "privacy";
}
</script>

<template>
  <AppShell :section="section" @section="section = $event" @open-privacy="openPrivacy">
    <InterviewView
      v-if="section === 'interview'"
      @complete="handleInterviewComplete"
      @open-privacy="openPrivacy"
    />
    <InsightView v-else-if="section === 'insight'" />
    <ProfileView v-else-if="section === 'profile'" />
    <PrivacyView v-else-if="section === 'privacy'" @back="section = 'interview'" />
  </AppShell>
</template>
