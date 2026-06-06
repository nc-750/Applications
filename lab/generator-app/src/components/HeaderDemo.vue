<script setup lang="ts">
import { useTheme } from "../generator/useTheme";

const { complianceScore } = useTheme();
</script>

<template>
    <div class="grid grid-cols-3">
        <!-- WCAG-AA cell -->
        <div class="nc-cell">
            <div class="flex items-center gap-3 justify-between flex-wrap">
                <span class="nc-label">// MODULE</span>
                <span class="nc-partno">NC-750-B</span>
            </div>
            <h2 class="nc-heading-2 mb-6">
                WCAG-AA<b class="nc-text--accent">.</b>
            </h2>
            <div class="flex items-center gap-3 flex-wrap">
                <span
                    class="nc-led"
                    :class="complianceScore >= 90 ? 'nc-led--on' : 'nc-led--rec'"
                >
                    {{ complianceScore >= 90 ? 'PASSING' : 'REVIEW' }}
                </span>
            </div>
        </div>

        <!-- Knob Cell -->
        <div class="nc-cell nc-cell--brushed flex items-center justify-center">
            <div class="nc-knob" :style="{ '--nc-knob-angle': '38deg' }"></div>
        </div>

        <!-- Accent cell -->
        <div class="nc-cell nc-cell--accent flex flex-col">
            <div class="nc-hatch h-6"></div>
            <div class="flex items-baseline justify-between">
                <div class="nc-readout">{{ complianceScore }}</div>
                <div class="nc-mono">% COMPLIANT</div>
            </div>
        </div>
    </div>
</template>
