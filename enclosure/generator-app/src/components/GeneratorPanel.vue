<script setup lang="ts">
import { useTheme } from "../generator/useTheme";
import { flattenRethemable, flattenStatic, exportFile } from "../generator/flatten";
import ExpandButton from "./ExpandButton.vue";
import type { ExpandAction } from "./ExpandButton.vue";

const {
    seedHex,
    accentHex,
    isDark,
    useWCAG,
    seed,
    accent,
    successHex,
    warningHex,
    errorHex,
    infoHex,
    setSeed,
    setAccent,
    setSemantic,
    toggleTheme,
    toggleWCAG,
    reset,
} = useTheme();

async function exportRethemable() {
    await exportFile(flattenRethemable(seed.value, accent.value), "enclosure.css");
}
async function exportStatic() {
    await exportFile(
        flattenStatic(seed.value, accent.value, useWCAG.value),
        "enclosure.static.css",
    );
}

const exportActions: ExpandAction[] = [
    { label: "Export rethemable CSS", action: exportRethemable },
    { label: "Export static CSS", action: exportStatic },
];
</script>

<template>
    <section class="nc-generator">
        <div class="nc-generator__row">
            <span class="nc-label">Theme Generator</span>

            <label class="nc-generator__picker">
                <span class="nc-partno">Base</span>
                <input
                    type="color"
                    :value="seedHex"
                    @input="setSeed(($event.target as HTMLInputElement).value)"
                />
            </label>

            <label class="nc-generator__picker">
                <span class="nc-partno">Accent</span>
                <input
                    type="color"
                    :value="accentHex"
                    @input="setAccent(($event.target as HTMLInputElement).value)"
                />
            </label>

            <label class="nc-generator__picker">
                <span class="nc-partno">Success</span>
                <input
                    type="color"
                    :value="successHex"
                    @input="setSemantic('success', ($event.target as HTMLInputElement).value)"
                />
            </label>

            <label class="nc-generator__picker">
                <span class="nc-partno">Warning</span>
                <input
                    type="color"
                    :value="warningHex"
                    @input="setSemantic('warning', ($event.target as HTMLInputElement).value)"
                />
            </label>

            <label class="nc-generator__picker">
                <span class="nc-partno">Error</span>
                <input
                    type="color"
                    :value="errorHex"
                    @input="setSemantic('error', ($event.target as HTMLInputElement).value)"
                />
            </label>

            <label class="nc-generator__picker">
                <span class="nc-partno">Info</span>
                <input
                    type="color"
                    :value="infoHex"
                    @input="setSemantic('info', ($event.target as HTMLInputElement).value)"
                />
            </label>

            <button
                class="nc-btn nc-btn--sm"
                :class="{ 'nc-btn--accent': useWCAG }"
                @click="toggleWCAG"
            >
                WCAG-AA
            </button>

            <span class="nc-generator__spacer"></span>

            <button class="nc-btn nc-btn--sm" @click="toggleTheme">
                {{ isDark ? "☽ Dark" : "☀ Light" }}
            </button>

            <button class="nc-btn nc-btn--sm" @click="reset">Reset</button>

            <ExpandButton
                label="Export CSS"
                :actions="exportActions"
            />
        </div>
    </section>
</template>

<style scoped>
.nc-generator {
    position: sticky;
    top: 0;
    z-index: 90;
    grid-column: 1 / -1;
    padding: var(--nc-space-3) var(--nc-space-4);
    background: var(--nc-bg);
    border-bottom: var(--nc-border-width) solid var(--nc-line-strong);
}
.nc-generator__row {
    display: flex;
    align-items: center;
    gap: var(--nc-space-3);
    flex-wrap: wrap;
}
.nc-generator__picker {
    display: inline-flex;
    align-items: center;
    gap: var(--nc-space-2);
}
.nc-generator__picker input[type="color"] {
    inline-size: var(--nc-control-md);
    block-size: var(--nc-control-sm);
    padding: 2px;
    border: var(--nc-border-width) solid var(--nc-line-strong);
    border-radius: var(--nc-radius-sm);
    background: var(--nc-inset);
    cursor: pointer;
}
.nc-generator__spacer {
    flex: 1 1 auto;
}
</style>
