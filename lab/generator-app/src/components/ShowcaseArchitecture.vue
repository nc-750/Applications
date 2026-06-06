<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper num="09" title="Architecture" partno="SYS-CSS"
        desc="The design system is defined across modular CSS files. Use the export toolbar to generate a single enclosure.css for your project, complete DESIGN.md documentation, or a standalone showcase HTML page.">
        <div class="nc-terminal nc-terminal--green">
            <div class="nc-terminal__bar">
                <span class="nc-terminal__dots">
                    <span class="nc-terminal__dot nc-terminal__dot--red"></span>
                    <span class="nc-terminal__dot nc-terminal__dot--amber"></span>
                    <span class="nc-terminal__dot nc-terminal__dot--green"></span>
                </span>
                <span class="nc-terminal__title">enclosure ~ export</span>
            </div>
            <div class="nc-terminal__body">
                <pre>
$ tree export/
enclosure.css       # tokens + reset + components
DESIGN.md           # design system spec
showcase.html       # standalone preview
[ OK ] ready for production</pre>
            </div>
        </div>
    </SectionWrapper>
</template>
