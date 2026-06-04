<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import SectionWrapper from "./SectionWrapper.vue";

// ── Switches ────────────────────────────────────────────────
const sw1 = ref(true);
const sw2 = ref(false);

// ── Rotary knobs ────────────────────────────────────────────
const gainAngle = ref(-120);
const mixAngle = ref(90);
const draggingKnob = ref<string | null>(null);

function startKnobDrag(knob: string, event: MouseEvent) {
    draggingKnob.value = knob;
    event.preventDefault();
    window.addEventListener("mousemove", onKnobDrag);
    window.addEventListener("mouseup", stopKnobDrag);
}

function onKnobDrag(event: MouseEvent) {
    if (!draggingKnob.value) return;
    const knobEl = document.querySelector(
        `[data-knob="${draggingKnob.value}"]`
    ) as HTMLElement | null;
    if (!knobEl) return;
    const rect = knobEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // atan2 gives 0° at 3-o'clock; CSS rotate 0° is 12-o'clock → add 90°
    let angle =
        Math.atan2(event.clientY - cy, event.clientX - cx) *
            (180 / Math.PI) +
        90;
    // Clamp to realistic 300° knob travel (±150°)
    angle = Math.max(-150, Math.min(150, Math.round(angle)));
    if (draggingKnob.value === "gain") gainAngle.value = angle;
    else if (draggingKnob.value === "mix") mixAngle.value = angle;
}

function stopKnobDrag() {
    draggingKnob.value = null;
    window.removeEventListener("mousemove", onKnobDrag);
    window.removeEventListener("mouseup", stopKnobDrag);
}

onUnmounted(() => {
    window.removeEventListener("mousemove", onKnobDrag);
    window.removeEventListener("mouseup", stopKnobDrag);
});

// ── Segmented control ───────────────────────────────────────
const activeSeg = ref(0);
const segOptions = ["Mono", "Stereo", "Multi"];
</script>

<template>
    <SectionWrapper
        num="04"
        title="Tactile Controls"
        partno="CTL-INPUT"
        desc="Hardware-feeling controls: toggles, lever switches, brushed-metal rotary knobs, and faders in slotted tracks."
    >
        <!-- Control groups row -->
        <div class="flex items-end gap-12 flex-wrap">
            <!-- Toggles -->
            <div class="flex flex-col gap-3">
                <span class="nc-label">Toggles</span>
                <label class="nc-toggle"
                    ><input type="checkbox" checked /> Power</label
                >
                <label class="nc-toggle"
                    ><input type="checkbox" /> Monitor</label
                >
                <label class="nc-toggle"
                    ><input type="checkbox" disabled /> Locked</label
                >
            </div>

            <!-- Switches -->
            <div class="flex flex-col gap-3">
                <span class="nc-label">Switches</span>
                <div class="flex items-center gap-3 flex-wrap">
                    <div
                        class="nc-switch"
                        :class="{ 'is-on': sw1 }"
                        @click="sw1 = !sw1"
                    >
                        <div class="nc-switch__lever"></div>
                    </div>
                    <div
                        class="nc-switch"
                        :class="{ 'is-on': sw2 }"
                        @click="sw2 = !sw2"
                    >
                        <div class="nc-switch__lever"></div>
                    </div>
                </div>
            </div>

            <!-- Rotary knobs -->
            <div class="flex flex-col gap-3">
                <span class="nc-label">Rotary</span>
                <div class="flex items-center gap-5 flex-wrap">
                    <div class="flex flex-col gap-2 items-center">
                        <div
                            class="nc-knob"
                            data-knob="gain"
                            :style="{ '--nc-knob-angle': gainAngle + 'deg' }"
                            @mousedown="startKnobDrag('gain', $event)"
                        ></div>
                        <span class="nc-partno">GAIN</span>
                    </div>
                    <div class="flex flex-col gap-2 items-center">
                        <div
                            class="nc-knob"
                            data-knob="mix"
                            :style="{ '--nc-knob-angle': mixAngle + 'deg' }"
                            @mousedown="startKnobDrag('mix', $event)"
                        ></div>
                        <span class="nc-partno">MIX</span>
                    </div>
                </div>
            </div>

            <!-- Faders -->
            <div class="flex flex-col gap-3">
                <span class="nc-label">Faders</span>
                <div class="flex items-center gap-4 flex-wrap">
                    <div class="nc-fader">
                        <input type="range" min="0" max="100" value="70" />
                        <span class="nc-partno">VOL</span>
                    </div>
                    <div class="nc-fader">
                        <input type="range" min="0" max="100" value="40" />
                        <span class="nc-partno">TONE</span>
                    </div>
                    <div class="nc-fader">
                        <input type="range" min="0" max="100" value="85" />
                        <span class="nc-partno">FX</span>
                    </div>
                </div>
            </div>
        </div>

        <hr class="nc-divider" />

        <!-- Segmented control -->
        <span class="nc-label block mb-3">Segmented control</span>
        <div class="nc-segment">
            <button
                v-for="(opt, i) in segOptions"
                :key="opt"
                :class="{ 'is-active': activeSeg === i }"
                @click="activeSeg = i"
            >
                {{ opt }}
            </button>
        </div>
    </SectionWrapper>
</template>
