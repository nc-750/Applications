<script setup lang="ts">
import { provide, useId } from 'vue';

defineProps<{
    label?: string
    error?: string
}>();

const id = useId();

provide("form-field-id", id)
</script>

<template>
    <div>
        <label class="nc-field" :for="id">{{ label }}</label>
        <slot/>
    </div>
</template>