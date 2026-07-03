<script setup lang="ts">
// The system-control operable Cell — the danger zone (clear LLM config, factory
// reset) plus the debug toggle. It only emits intent; the page owns the lifecycle
// calls (the settings store's clearSettings, the factoryReset composer) and routes
// the debug toggle through the logger foundational module (Rule 5.3) — never a
// settings store field.
import { Cell, Button } from "@nc-750/lab-vue";

defineProps<{ debugEnabled: boolean }>();

const emit = defineEmits<{
    clearConfig: [];
    factoryReset: [];
    toggleDebug: [];
}>();
</script>

<template>
    <Cell title="SYSTEM" spec="SYS // 0x04" :grow="1">
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <h3 class="nc-label nc-label--danger">Danger Zone</h3>
                <div class="flex flex-wrap gap-2">
                    <Button variant="danger" @click="emit('clearConfig')">Clear LLM config</Button>
                    <Button variant="danger" @click="emit('factoryReset')">Factory reset</Button>
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <h3 class="nc-label">Debug</h3>
                <Button variant="secondary" @click="emit('toggleDebug')">
                    Debug {{ debugEnabled ? "On" : "Off" }}
                </Button>
            </div>
        </div>
    </Cell>
</template>
