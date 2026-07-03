<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper num="08" title="Navigation &amp; Technical Marks" partno="NAV-MRK"
        desc="Tabs, breadcrumbs, and the blueprint vocabulary: schematic dividers, dimension lines, registration crosshairs, hatching, and barcodes.">
        <!-- Tabs -->
        <div class="nc-tabs" role="tablist" data-tabs>
            <button class="nc-tab is-active" role="tab">Overview</button>
            <button class="nc-tab" role="tab">Config</button>
            <button class="nc-tab" role="tab">Logs</button>
            <button class="nc-tab" role="tab">Metrics</button>
        </div>

        <!-- Breadcrumbs -->
        <nav aria-label="Breadcrumb" class="mt-4">
            <ol class="nc-breadcrumbs">
                <li><a href="#">Cluster</a></li>
                <li><a href="#">us-east-1</a></li>
                <li><a href="#">Services</a></li>
                <li>api-gateway</li>
            </ol>
        </nav>

        <hr class="nc-divider" />

        <!-- Technical marks -->
        <div class="flex flex-col gap-6">
            <div class="nc-schematic">Schematic Divider · Section Break</div>
            <div class="nc-dimension">
                <span>0</span><span class="nc-dimension__line"></span><span>120 mm</span>
            </div>
            <div class="flex items-center gap-6 flex-wrap">
                <div class="nc-reg"></div>
                <div class="nc-hatch w-[120px] h-[36px] rounded-sm"></div>
                <div class="nc-barcode w-[160px]"></div>
                <div class="nc-spec">
                    <span class="nc-spec__label">Voltage</span>
                    <span class="nc-spec__value">24.0 V</span>
                </div>
            </div>
        </div>
    </SectionWrapper>
</template>
