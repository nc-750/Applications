<script setup lang="ts">
    defineProps<{
        title: string,
        subtitle: string
    }>()
</script>

<template>
    <header class="nc-chassis-header">
        <span class="nc-lcd-sub">{{ title }}</span>
        <span class="nc-lcd">{{ subtitle }}</span>
    </header>
</template>
