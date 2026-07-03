<script setup lang="ts">
defineProps<{
    title: string,
    subtitle: string
}>();
</script>

<template>
    <header class="nc-chassis-header">
        <a href="/" class="nc-lcd-sub">{{ title }}</a>
        <span class="nc-lcd">{{ subtitle }}</span>
    </header>
</template>
