<script setup lang="ts">
import { ref } from "vue";
import SectionWrapper from "./SectionWrapper.vue";

// ── Segmented control ───────────────────────────────────────
const activeSeg = ref(0);
const segOptions = ["Mono", "Stereo", "Multi"];
</script>

<template>
    <SectionWrapper
        num="04"
        title="Tactile Controls"
        partno="CTL-INPUT"
        desc="Hardware-feeling controls: toggles and fused-key segmented controls."
    >
        <!-- Control groups row -->
        <div class="flex items-end gap-12 flex-wrap">
            <!-- Toggles -->
            <div class="flex flex-col gap-3">
                <span class="nc-label">Toggles</span>
                <label class="nc-toggle"
                    ><input type="checkbox" checked /> Power</label
                >
                <label class="nc-toggle"
                    ><input type="checkbox" /> Monitor</label
                >
                <label class="nc-toggle"
                    ><input type="checkbox" disabled /> Locked</label
                >
            </div>
        </div>

        <hr class="nc-divider" />

        <!-- Segmented control -->
        <span class="nc-label block mb-3">Segmented control</span>
        <div class="nc-segment">
            <button
                v-for="(opt, i) in segOptions"
                :key="opt"
                :class="{ 'is-active': activeSeg === i }"
                @click="activeSeg = i"
            >
                {{ opt }}
            </button>
        </div>
    </SectionWrapper>
</template>
