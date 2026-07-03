<script setup lang="ts">
// The connection-test readout — a live, read-only reading shown in the dark monitor
// cavity (Rule 7.6: a monitor reads, it never hosts input). The latency it displays
// is genuinely measured by the testConnection service (honest-reading rule), so this
// is a real instrument reading, not a decorative meter. While the probe runs it shows
// acquisition (the signal being read), not a generic spinner.
import { computed } from "vue";
import { MonitorCell, Acquire } from "@nc-750/lab-vue";

const props = defineProps<{
    status: "idle" | "testing" | "ok" | "error";
    /** Round-trip latency in ms — present only on a successful test. */
    latencyMs?: number;
    /** Failure detail — present only on `error`. */
    message?: string;
}>();

const ledClass = computed(() => {
    if (props.status === "ok") return "nc-led--on";
    if (props.status === "error") return "nc-led--err";
    return "";
});

const stateLabel = computed(() => {
    switch (props.status) {
        case "ok":
            return "LINK ESTABLISHED";
        case "error":
            return "LINK FAILED";
        default:
            return "AWAITING TEST";
    }
});
</script>

<template>
    <MonitorCell title="LINK STATUS" spec="NET // 0x02" :grow="1">
        <div class="flex flex-col gap-3">
            <Acquire v-if="status === 'testing'" label="TESTING LINK · READING LATENCY" />

            <template v-else>
                <div class="flex items-center gap-2">
                    <span class="nc-led" :class="ledClass" />
                    <span class="nc-lcd-sub">{{ stateLabel }}</span>
                </div>
                <span v-if="status === 'ok'" class="nc-lcd">{{ latencyMs }}ms</span>
                <span v-else-if="status === 'idle'" class="nc-lcd">0x00</span>
                <p v-else-if="status === 'error' && message" class="nc-text-sm cmc-error">{{ message }}</p>
            </template>
        </div>
    </MonitorCell>
</template>

<style scoped>
/* kept: no .nc-* class for error-coloured readout text inside the monitor */
.cmc-error {
    color: var(--nc-error);
}
</style>
