<script setup lang="ts">
defineProps<{
    num: string;
    title: string;
    partno: string;
    desc: string;
}>();
</script>

<template>
    <div
        class="flex items-baseline gap-3 mb-5 pb-3 border-b-[1.5px] border-solid border-[var(--nc-line-ink)]"
    >
        <span class="nc-label nc-label--accent">{{ num }}</span>
        <h2 class="nc-heading-4 flex-auto">{{ title }}</h2>
        <span class="nc-partno ml-auto">{{ partno }}</span>
    </div>
    <p class="nc-caption mb-6">
        {{ desc }}
    </p>
    <div class="nc-plate">
        <slot />
    </div>
</template>
