<script setup lang="ts">
    defineProps<{
        title: string
    }>()
</script>

<template>
    <footer class="nc-chassis-footer">
        <span class="nc-lcd-sub">{{ title }}</span>
    </footer>
</template>
