<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper
        num="05"
        title="Forms &amp; Inputs"
        partno="FRM-IN"
        desc="Recessed inset wells for entry; checkboxes and radios pick up the orange signal when active."
    >
        <div class="flex flex-col gap-6">
            <!-- Form fields -->
            <div class="w-full max-w-[340px] flex flex-col gap-4">
                <div class="nc-field">
                    <label class="nc-field__label" for="f-name"
                        >Device name</label
                    >
                    <input
                        class="nc-input"
                        id="f-name"
                        type="text"
                        value="TP-7 / UNIT-065"
                    />
                </div>
                <div class="nc-field">
                    <label class="nc-field__label" for="f-src"
                        >Input source</label
                    >
                    <input
                        class="nc-input"
                        id="f-src"
                        type="text"
                        placeholder="Enter channel…"
                    />
                    <span class="nc-field__help"
                        >Must be unique within the rack.</span
                    >
                </div>
                <div class="nc-field">
                    <label class="nc-field__label" for="f-region">Region</label>
                    <select class="nc-select" id="f-region">
                        <option>us-east-1</option>
                        <option>eu-west-2</option>
                        <option>ap-southeast-1</option>
                    </select>
                </div>
                <div class="nc-field">
                    <label class="nc-field__label" for="f-notes">Notes</label>
                    <textarea
                        class="nc-textarea"
                        id="f-notes"
                        placeholder="Write something…"
                    ></textarea>
                </div>
            </div>

            <!-- Checkbox & radio -->
            <div class="flex flex-col gap-3">
                <span class="nc-label">Checkbox</span>
                <label class="nc-checkbox"
                    ><input type="checkbox" checked /> Phantom power</label
                >
                <label class="nc-checkbox"
                    ><input type="checkbox" /> High-pass filter</label
                >
                <label class="nc-checkbox"
                    ><input type="checkbox" disabled /> Calibration</label
                >

                <hr class="nc-divider nc-divider--subtle" />

                <span class="nc-label">Radio</span>
                <label class="nc-radio"
                    ><input type="radio" name="sample-rate" checked /> 44.1
                    kHz</label
                >
                <label class="nc-radio"
                    ><input type="radio" name="sample-rate" /> 48 kHz</label
                >
                <label class="nc-radio"
                    ><input type="radio" name="sample-rate" /> 96 kHz</label
                >
            </div>
        </div>
    </SectionWrapper>
</template>
