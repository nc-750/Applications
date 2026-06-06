<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper num="03" title="Buttons &amp; Keys" partno="CTL-BTN"
        desc="Default is a machined metal key; primary is solid ink; accent is the orange signal. All press down — the catch-light flips on click.">
        <!-- Variants -->
        <span class="nc-label block mb-3">Variants</span>
        <div class="flex items-center gap-4 flex-wrap">
            <button class="nc-btn nc-btn--accent">&#9210; Record</button>
            <button class="nc-btn nc-btn--primary">Primary</button>
            <button class="nc-btn">Default</button>
            <button class="nc-btn nc-btn--secondary">Secondary</button>
            <button class="nc-btn nc-btn--ghost">Ghost</button>
            <button class="nc-btn nc-btn--danger">Danger</button>
            <button class="nc-btn" disabled>Disabled</button>
        </div>

        <hr class="nc-divider" />

        <!-- Sizes · icon · group -->
        <span class="nc-label block mb-3">Sizes · icon · group</span>
        <div class="flex items-center gap-4 flex-wrap">
            <button class="nc-btn nc-btn--primary nc-btn--sm">Small</button>
            <button class="nc-btn nc-btn--primary">Medium</button>
            <button class="nc-btn nc-btn--primary nc-btn--lg">Large</button>
            <button class="nc-btn nc-btn--icon" aria-label="Settings">&#9881;</button>
            <button class="nc-btn nc-btn--icon nc-btn--accent" aria-label="Power">&#9211;</button>
            <div class="nc-btn-group">
                <button class="nc-btn">Mono</button>
                <button class="nc-btn nc-btn--primary">Stereo</button>
                <button class="nc-btn">Multi</button>
            </div>
        </div>

        <hr class="nc-divider" />

        <!-- Keycaps -->
        <span class="nc-label block mb-3">Keycaps</span>
        <div class="flex items-center gap-4 flex-wrap">
            <span class="nc-key">esc</span>
            <span class="nc-key">&#8984;</span>
            <span class="nc-key">Q</span>
            <span class="nc-key">W</span>
            <span class="nc-key">E</span>
            <span class="nc-key nc-key--accent">&#9166;</span>
        </div>
    </SectionWrapper>
</template>
