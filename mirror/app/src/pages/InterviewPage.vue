<script setup lang="ts">
import { ref } from 'vue';
import InterviewInstrument from '../components/interview/InterviewInstrument.vue';
import InterviewPreparation from '../interview/components/InterviewPreparation.vue';
import { AttachedFile } from '../lib/fileExtractor.ts';

const isInterviewStarted = ref(false);

function startInterview(attachedFiles: AttachedFile[], userInput: string) {

}
</script>

<template>
    <InterviewPreparation
        v-if="!isInterviewStarted"
        @start-interview="startInterview"
    />
    <!-- <InterviewInstrument/> -->
</template>
