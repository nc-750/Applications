<script setup lang="ts">
// Consolidated ready-to-use text block — the three prose fields from PersonaDerived
// (cvSummary, linkedinAbout, interviewPitch) stacked in one Cell with sub-headings.
// Each null field skips its section; the parent Band guards the all-null case.
import { Cell } from "@nc-750/lab-vue";

defineProps<{
    cvSummary: string | null;
    linkedinAbout: string | null;
    interviewPitch: string | null;
}>();
</script>

<template>
    <Cell title="READY-TO-USE TEXT" spec="INS // 0x0D" :grow="1">
        <div class="flex flex-col gap-4">
            <div v-if="cvSummary">
                <h4 class="nc-label">CV SUMMARY</h4>
                <p class="nc-lcd dtc-text">{{ cvSummary }}</p>
            </div>
            <div v-if="linkedinAbout">
                <h4 class="nc-label">LINKEDIN ABOUT</h4>
                <p class="nc-lcd dtc-text">{{ linkedinAbout }}</p>
            </div>
            <div v-if="interviewPitch">
                <h4 class="nc-label">INTERVIEW PITCH</h4>
                <p class="nc-lcd dtc-text">{{ interviewPitch }}</p>
            </div>
        </div>
    </Cell>
</template>

<style scoped>
/* kept: no .nc-* class for prose line-height on monospace display text */
.dtc-text {
    line-height: 1.6;
    white-space: normal;
}
</style>
