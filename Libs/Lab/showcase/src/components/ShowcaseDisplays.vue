<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper num="06" title="Displays &amp; Readouts" partno="DSP-LCD"
        desc="The dark monitor surface: glowing LCD numerals and mono sub-labels.">
        <div class="flex items-stretch gap-4">
            <!-- LCD Clock -->
            <div class="nc-monitor flex-1 min-w-[240px] p-4 rounded-[var(--nc-radius-md)]">
                <span class="nc-lcd-sub">SESSION 32 · REC</span>
                <div class="nc-lcd nc-lcd--lg" id="clock">00:01:37</div>
                <div class="flex items-center justify-between mt-2">
                    <span class="nc-lcd-sub">BPM 124</span>
                    <span class="nc-lcd-sub">−12.4 dB</span>
                </div>
            </div>
        </div>
    </SectionWrapper>
</template>
