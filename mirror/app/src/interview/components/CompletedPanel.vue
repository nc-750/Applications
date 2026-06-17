<script setup lang="ts">
import { CheckCircle, User, Globe, RotateCcw } from "lucide-vue-next";

defineProps<{
    personaName?: string
}>();

const emit = defineEmits<{
    goInsight: [];
    goProfile: [];
    restart: [];
}>();

const insightTarget = "/insight";
const profileTarget = "/profile";
</script>

<template>
    <div class="flex flex-col items-center justify-center text-center gap-6 py-12 px-6">
        <CheckCircle :size="36" class="comp-icon" aria-hidden="true" />
    
        <div>
            <p class="nc-text-lg nc-font-semibold comp-title">
                {{ personaName ? `${personaName}'s mirror is ready` : "Mirror ready" }}
            </p>
            <p class="nc-text-sm nc-text-secondary max-w-sm comp-sub">
                Your interview is complete. View your private insight document or your public profile.
            </p>
        </div>

        <div class="flex flex-col gap-3">
            <router-link :to="insightTarget" class="nc-btn nc-btn--accent">
                <User :size="15" aria-hidden="true" />
                Insight
            </router-link>
            <router-link :to="profileTarget" class="nc-btn nc-btn--secondary">
                <Globe :size="15" aria-hidden="true" />
                Profile
            </router-link>
        </div>

        <button class="comp-restart" @click="emit('restart')">
            <RotateCcw :size="12" aria-hidden="true" />
            Start new interview
        </button>
  </div>
</template>

<style scoped>
/* kept: no .nc-* class for accent-ink text link button */
.comp-restart {
    display: flex;
    align-items: center;
    gap: var(--nc-space-1);
    font-size: var(--nc-text-xs);
    margin-top: var(--nc-space-1);
    color: var(--nc-accent-ink);
    background: none;
    border: none;
    cursor: pointer;
}
</style>