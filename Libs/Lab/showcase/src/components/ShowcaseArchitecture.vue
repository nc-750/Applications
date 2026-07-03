<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper num="09" title="Architecture" partno="SYS-CSS"
        desc="The design system is defined across modular CSS files. Use the export toolbar to generate a single lab.css for your project, complete DESIGN.md documentation, or a standalone showcase HTML page.">
        <div class="nc-monitor p-4 rounded-[var(--nc-radius-md)]">
            <span class="nc-lcd-sub block mb-2">lab ~ export</span>
            <pre class="font-mono text-[var(--nc-text-sm)] leading-relaxed text-[var(--nc-ink-invert)] whitespace-pre-wrap m-0">
$ tree export/
lab.css             # tokens + reset + components
DESIGN.md           # design system spec
showcase.html       # standalone preview
[ OK ] ready for production</pre>
        </div>
    </SectionWrapper>
</template>
