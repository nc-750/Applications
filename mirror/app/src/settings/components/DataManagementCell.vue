<script setup lang="ts">
// The data-management operable Cell — import, export, or delete the persona on this
// device. It holds no persistence and no validation: it only surfaces the user's
// intent as events. The page wires these to the Phase-6 persona services/actions
// (importPersona / exportPersona / clearPersona); parsing an untrusted file is the
// service's job, not the view's.
import { ref } from "vue";
import { Cell, Button } from "@nc-750/lab-vue";

const emit = defineEmits<{
    import: [file: File];
    export: [];
    delete: [];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

function onPickFile() {
    fileInputRef.value?.click();
}

function onFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) emit("import", file);
    target.value = "";
}
</script>

<template>
    <Cell title="DATA" spec="CFG // 0x03" :grow="1">
        <div class="flex flex-col gap-4">
            <p class="nc-text-sm nc-text-secondary">
                Save the current Persona to a file, or delete it from this device.
            </p>
            <div class="flex flex-wrap gap-3">
                <Button @click="onPickFile">Import persona</Button>
                <Button @click="emit('export')">Export persona</Button>
                <Button variant="danger" @click="emit('delete')">Delete persona</Button>
            </div>
            <input
                ref="fileInputRef"
                type="file"
                accept=".json"
                class="hidden"
                @change="onFileChange"
            />
        </div>
    </Cell>
</template>
