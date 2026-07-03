<script setup lang="ts">
    defineProps<{
        title?: string,
        spec?: string,
        variant?: "thin" | undefined,
        grow?: 0 | 1 | 2 | 3,
    }>()
</script>

<template>
    <div :class="[
        'nc-cell',
        'nc-monitor',
        grow && `nc-cell--grow-${grow}`,
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
