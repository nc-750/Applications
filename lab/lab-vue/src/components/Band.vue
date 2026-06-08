<script setup lang="ts">
    defineProps<{
        grow?: 0 | 1 | 2 | 3
    }>()
</script>

<template>
    <section :class="[
        'nc-band',
        grow && `nc-band--grow-${grow}`
    ]">
        <slot/>
    </section>
</template>