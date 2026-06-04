<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper
        num="01"
        title="Foundations · Color"
        partno="FND-COLOR"
        desc='Machined-aluminium surface ramp, near-black ink, crisp seams, and a single saturated safety-orange used as a full color-field. Swap data-theme="dark" on &lt;html&gt; for the gunmetal console theme.'
    >
        <!-- Surface ramp -->
        <span class="nc-label block mb-3">Surface ramp</span>
        <div class="flex items-start gap-4 flex-wrap">
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-bg)]"
                ></div>
                <span class="nc-partno">--nc-bg</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-panel)]"
                ></div>
                <span class="nc-partno">--nc-panel</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-panel-2)]"
                ></div>
                <span class="nc-partno">--nc-panel-2</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-inset)]"
                ></div>
                <span class="nc-partno">--nc-inset</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-console)]"
                ></div>
                <span class="nc-partno">--nc-console</span>
            </div>
        </div>

        <hr class="nc-divider" />

        <!-- Ink & seams -->
        <span class="nc-label block mb-3">Ink &amp; seams</span>
        <div class="flex items-start gap-4 flex-wrap">
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-ink)]"
                ></div>
                <span class="nc-partno">--nc-ink</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-ink-2)]"
                ></div>
                <span class="nc-partno">--nc-ink-2</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-ink-3)]"
                ></div>
                <span class="nc-partno">--nc-ink-3</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-line)]"
                ></div>
                <span class="nc-partno">--nc-line</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-line-ink)]"
                ></div>
                <span class="nc-partno">--nc-line-ink</span>
            </div>
        </div>

        <hr class="nc-divider" />

        <!-- Signal & semantic -->
        <span class="nc-label block mb-3">Signal &amp; semantic</span>
        <div class="flex items-start gap-4 flex-wrap">
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-accent)]"
                ></div>
                <span class="nc-partno">--nc-accent</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-success)]"
                ></div>
                <span class="nc-partno">--nc-success</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-warning)]"
                ></div>
                <span class="nc-partno">--nc-warning</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-error)]"
                ></div>
                <span class="nc-partno">--nc-error</span>
            </div>
            <div class="flex flex-col gap-2">
                <div
                    class="w-[84px] h-[52px] rounded-sm border border-solid border-[var(--nc-line-strong)] bg-[var(--nc-info)]"
                ></div>
                <span class="nc-partno">--nc-info</span>
            </div>
        </div>
    </SectionWrapper>
</template>
