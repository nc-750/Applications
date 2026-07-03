<script setup lang="ts">
    defineProps<{
        title?: string,
        spec?: string,
        variant?: "thin" | undefined,
        surface?: "2" | "accent" | "brushed",
        grow?: 0 | 1 | 2 | 3,
    }>()
</script>

<template>
    <div :class="[
        'nc-cell',
        grow && `nc-cell--grow-${grow}`,
        surface && `nc-cell--${surface}`,
        variant && `nc-cell--${variant}`
    ]">
        <header v-if="title != '' && spec != ''" class="nc-cell-head">
            <span class="nc-label">{{ title }}</span>
            <span class="nc-label">{{ spec }}</span>
        </header>
        <div class="nc-cell-content">
            <slot />
        </div>
    </div>
</template>
