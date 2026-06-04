<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper
        num="02"
        title="Foundations · Type"
        partno="FND-TYPE"
        desc="Display in ClashDisplay set big and tight; body in Chillax; technical labels in monospace, wide-tracked and uppercase. The contrast is the voice."
    >
        <div class="flex flex-col gap-6">
            <div>
                <span class="nc-label block mb-2">Display / Numeral</span>
                <div class="nc-readout">128</div>
            </div>
            <div>
                <span class="nc-label block mb-2">Heading 1</span>
                <h1
                    class="nc-heading-1 overflow-ellipsis overflow-y-hidden overflow-x-hidden"
                >
                    Surgical precision
                </h1>
            </div>
            <div>
                <span class="nc-label block mb-2">Heading 3</span>
                <h3 class="nc-heading-3">
                    Panels joined by seams, not shadows
                </h3>
            </div>
            <div>
                <span class="nc-label block mb-2">Body</span>
                <p class="nc-text-md max-w-[60ch]">
                    Design is not just what it looks like and feels like. Design
                    is how it works — rendered with the calm density of an
                    industrial interface.
                </p>
            </div>
            <div>
                <span class="nc-label block mb-2">Mono label</span>
                <p class="nc-label">
                    SYS-INTERFACE / REV 2.0.0 / 48 kHz / USB-C
                </p>
            </div>
        </div>
    </SectionWrapper>
</template>
