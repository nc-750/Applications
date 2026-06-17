<script setup lang="ts">
import { MessageSquare, Import, BrainCircuit, User, Globe } from "lucide-vue-next";
import { Band, Cell } from "@nc-750/lab-vue";

import { computed } from "vue";
import { useSettingsStore } from "../settings/stores";
import { useInterviewStore } from "../interview/stores";

const settingsStore = useSettingsStore();
const primaryButton = computed(() => ({
    target: settingsStore.isLLMConfigured ? "/interview" : "/settings",
    label: settingsStore.isLLMConfigured ? "Interview" : "Configure AI",
}));
const insightTarget = "/insight";
const profileTarget = "/profile";

const interviewStore = useInterviewStore();
const isActive = computed(() => interviewStore.status === "active");
const isCompleted = computed(() => interviewStore.status === "completed");
</script>

<template>
    <Band :grow="1">
        <Cell title="WELCOME" spec="WLC // 0x01">
            <div class="h-full flex flex-col items-center justify-center text-center">
                <h1 class="nc-heading-3 mb-4">
                    Personal<b class="nc-text nc-text--accent">·</b>Private
                </h1>

                <p class="nc-text-secondary nc-text-sm max-w-lg mb-4">
                    Your AI-powered personal profile analyzer.<br/>
                    Uncover insights about yourself and get a career-ready public profile.
                </p>

                <!-- Actions -->
                <div class="flex flex-col">
                    <router-link v-if="isActive || isCompleted" :to="primaryButton.target" class="nc-btn nc-btn--accent nc-btn--lg mb-2">
                        <MessageSquare :size="15" aria-hidden="true" v-if="settingsStore.isLLMConfigured"/>
                        <BrainCircuit :size="15" aria-hidden="true" v-else />
                        {{ primaryButton.label }} 
                    </router-link>
                    <div class="flex gap-4">
                        <router-link v-if="isCompleted" :to="insightTarget" class="nc-btn nc-btn--lg mb-2">
                            <User :size="15" aria-hidden="true" />
                            Insight
                        </router-link>
                        <router-link v-if="isCompleted" :to="profileTarget" class="nc-btn nc-btn--lg mb-2">
                            <Globe :size="15" aria-hidden="true" />
                            Profile
                        </router-link>
                    </div>
                    
                    <button class="nc-btn nc-btn--ghost nc-btn--lg">
                        <Import :size="15" aria-hidden="true" />
                        Import your persona
                    </button>
                </div>
            </div>
        </Cell>
    </Band>
    <Band>
        <Cell title="PRIVACY" spec="WLC // 0x02" surface="2">
            <div class="flex flex-col text-center justify-center items-center">
                <p class="nc-text-xs nc-text-muted">
                    All data stays on your device.
                </p>
                <p class="nc-text-xs nc-text-muted">
                    Bring your own API key.
                </p>
                <p class="nc-text-xs nc-text-muted mb-2">
                    Your messages are sent to your AI provider.
                </p>
                <router-link to="/privacy" class="nc-btn nc-btn--ghost w-fit">
                    Read the privacy details →
                </router-link>
            </div>
        </Cell>
    </Band>
</template>
