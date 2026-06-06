<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper num="06" title="Displays &amp; Readouts" partno="DSP-LCD"
        desc="The black console surface: glowing LCD numerals, scanlines, dot-matrix waveforms, and bar meters.">
        <div class="flex items-stretch gap-4">
            <!-- LCD Clock -->
            <div class="nc-console nc-console--scan flex-1 min-w-[240px]">
                <span class="nc-lcd-sub">SESSION 32 · REC</span>
                <div class="nc-lcd nc-lcd--lg" id="clock">00:01:37</div>
                <div class="flex items-center justify-between mt-2">
                    <span class="nc-lcd-sub">BPM 124</span>
                    <span class="nc-lcd-sub">−12.4 dB</span>
                </div>
            </div>

            <!-- Dot Matrix -->
            <div class="nc-console flex-1 min-w-[240px]">
                <span class="nc-lcd-sub">SIGNAL · DOT MATRIX</span>
                <div class="nc-matrix mt-3" id="matrix" :style="{ '--nc-matrix-cols': 14 }"></div>
            </div>

            <!-- Bar Meters (ADSR) -->
            <div class="nc-console flex items-center justify-center gap-4">
                <span class="nc-readout--vertical">A D S R</span>
                <div class="nc-meters h-[64px]">
                    <i class="h-[70%]"></i>
                    <i class="h-[40%]"></i>
                    <i class="is-accent h-[90%]"></i>
                    <i class="h-[55%]"></i>
                    <i class="h-[30%]"></i>
                </div>
            </div>
        </div>
    </SectionWrapper>
</template>
