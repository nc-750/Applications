<script setup lang="ts">
import { MessageSquare, Import, BrainCircuit } from "lucide-vue-next";
import { Band, Cell } from "@nc-750/lab-vue";

import { useMirrorStore } from "../stores/mirror";
import { computed } from "vue";

let mirrorStore = useMirrorStore();

const primaryButton = computed(() => { 
    return {
        target: mirrorStore.isLLMConfigured ? "/interview" : "/settings",
        label: mirrorStore.isLLMConfigured ? "Probe" : "Configure AI",
    }
});

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
                    <router-link :to="primaryButton.target" class="nc-btn nc-btn--accent nc-btn--lg mb-2">
                        <MessageSquare :size="15" aria-hidden="true" v-if="mirrorStore.isLLMConfigured"/>
                        <BrainCircuit :size="15" aria-hidden="true" v-else />
                        {{ primaryButton.label }} 
                    </router-link>
                    <button class="nc-btn nc-btn--secondary nc-btn--lg">
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
