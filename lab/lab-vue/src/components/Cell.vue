<script setup lang="ts">
    defineProps<{
        surface?: string,
        grow?: 0 | 1 | 2 | 3,
        title: string,
        spec: string
    }>()
</script>

<template>
    <div :class="[
        'nc-cell',
        grow && `nc-cell--grow-${grow}`,
        surface && `nc-cell--${surface}`
    ]">
        <header class="nc-cell-head">
            <span class="nc-label">{{ title }}</span>
            <span class="nc-label">{{ spec }}</span>
        </header>
        <slot />
    </div>
</template>
