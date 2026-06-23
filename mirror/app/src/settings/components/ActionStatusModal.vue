<script setup lang="ts">
// ActionStatusModal — a scroll-proof, viewport-fixed status panel that surfaces
// the active data-operation reading for save / import / delete.
//
// Design contract (Phase 2 brief):
//   - Read-only status surface (CONVENTIONS 7.6 — monitor reads, hosts no input).
//   - Props-in + one `dismiss` emit only (props-down / events-up).
//   - `position: fixed`, viewport-anchored (NOT absolute/in-cell) so it survives
//     single-column mobile collapse and never scrolls off screen.
//   - Reading vocabulary mirrors ConnectionMonitorCell: Acquire while running,
//     nc-led + nc-lcd-sub for terminal states, .asm-error real-message line.
//   - Honest dismissal: running → non-dismissible; error → stays until acknowledged;
//     success → auto-dismisses after a brief view-only delay (ETHOS C7 — the timer
//     governs visibility duration only, not whether the op succeeded).
//   - C8.3: keyboard-operable <button> dismiss; Escape dismisses a dismissible state;
//     role="alert" + focus-on-appearance; never colour-only (text label always present).
//   - Reduced-motion: reuses Acquire (already gated in lab.css:683 + lab.css:2032);
//     the slide-in transition is gated by the same @media rule.
//
// nc-750-web-frontend-architecture: CONVENTIONS 7.6 (monitor = read-only readout),
//   props-down/events-up contract. nc-750-frontend-presentation: honest-reading rule,
//   one-signal-one-surface, instrument vocabulary (Acquire/nc-led/nc-lcd-sub).

import { computed, watch, onUnmounted, ref } from "vue";
import { Acquire } from "@nc-750/lab-vue";
import type { ActionStatus } from "../composables";

// ── Props / emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
    /** The active status to display. Pass `null` / `undefined` to hide. */
    status: ActionStatus | null | undefined;
    /** Human-readable label for the operation in flight (used while running). */
    operationLabel: string;
}>();

const emit = defineEmits<{
    dismiss: [];
}>();

// ── Computed state ────────────────────────────────────────────────────────────

const kind = computed(() => props.status?.kind ?? "idle");

const isVisible = computed(
    () => kind.value === "running" || kind.value === "success" || kind.value === "error",
);

const isDismissible = computed(
    () => kind.value === "success" || kind.value === "error",
);

const ledClass = computed(() => {
    if (kind.value === "success") return "nc-led--on";
    if (kind.value === "error") return "nc-led--err";
    return "";
});

const terminalLabel = computed(() => {
    if (kind.value === "success") return `${props.operationLabel} DONE`;
    if (kind.value === "error") return `${props.operationLabel} FAILED`;
    return "";
});

const errorMessage = computed(() => {
    if (props.status?.kind === "error") return props.status.message;
    return null;
});

const successDetail = computed(() => {
    if (props.status?.kind === "success") return props.status.detail;
    return undefined;
});

const acquireLabel = computed(() => `${props.operationLabel} …`);

// ── Focus management ──────────────────────────────────────────────────────────

const panelRef = ref<HTMLElement | null>(null);

watch(isVisible, (visible) => {
    if (visible) {
        // Focus the panel when it appears so keyboard/AT users are not left
        // with an unreachable alert (C8.3). nextTick via watch flush lets Vue
        // update the DOM first.
        setTimeout(() => panelRef.value?.focus(), 0);
    }
});

// ── Auto-dismiss for success ──────────────────────────────────────────────────

// The view-only delay after which a success reading clears automatically.
// Governs visibility duration only — it does not change whether the op succeeded.
const SUCCESS_DISMISS_MS = 2500;

let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

function clearAutoDismiss(): void {
    if (autoDismissTimer !== null) {
        clearTimeout(autoDismissTimer);
        autoDismissTimer = null;
    }
}

watch(
    () => props.status,
    (status) => {
        clearAutoDismiss();
        if (status?.kind === "success") {
            autoDismissTimer = setTimeout(() => {
                emit("dismiss");
                autoDismissTimer = null;
            }, SUCCESS_DISMISS_MS);
        }
    },
);

onUnmounted(() => {
    clearAutoDismiss();
});

// ── Keyboard handler ──────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape" && isDismissible.value) {
        emit("dismiss");
    }
}

function onDismissClick(): void {
    emit("dismiss");
}
</script>

<template>
    <!-- Viewport-fixed status panel: not in-cell, not absolute; position:fixed so
         it survives single-column collapse and scroll (Phase 2 brief requirement).
         role="alert" announces to AT on appearance; tabindex="-1" makes it
         focusable so focus management lands here (C8.3). -->
    <div
        v-if="isVisible"
        ref="panelRef"
        class="nc-monitor asm-panel"
        role="alert"
        aria-live="assertive"
        tabindex="-1"
        @keydown="onKeydown"
    >
        <!-- Running: Acquire readout (reduced-motion gated by lab.css:683 + 2032) -->
        <template v-if="kind === 'running'">
            <Acquire :label="acquireLabel" />
            <!-- Not dismissible while in-flight: the user cannot truthfully
                 acknowledge an unfinished operation. No dismiss button rendered. -->
        </template>

        <!-- Terminal: success / error -->
        <template v-else>
            <div class="asm-reading">
                <span class="nc-led" :class="ledClass" />
                <span class="nc-lcd-sub">{{ terminalLabel }}</span>
            </div>

            <!-- Error message (real, surfaced, never invented — ETHOS C7) -->
            <p v-if="errorMessage" class="nc-text-sm asm-error">{{ errorMessage }}</p>

            <!-- Success detail (optional, only when genuinely present) -->
            <p v-if="successDetail" class="nc-text-sm asm-detail">{{ successDetail }}</p>

            <!-- Dismiss control: keyboard-operable <button> (C8.3).
                 Present for both success and error — on error it is the
                 acknowledgement gate; on success it provides manual early dismiss
                 alongside the auto-dismiss timer. -->
            <button
                v-if="isDismissible"
                class="nc-btn nc-btn--accent nc-btn--sm asm-dismiss"
                @click="onDismissClick"
            >
                Dismiss
            </button>
        </template>
    </div>
</template>

<style scoped>
/* Viewport-fixed positioning: survives scroll, survives single-column collapse.
   Intentionally NOT position:absolute (would scroll with its container and be
   clipped — which is the entire reason this phase chose a modal over a cavity).
   Bottom-right corner: unobtrusive but always reachable. */
.asm-panel {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 900;
    min-width: 280px;
    max-width: 420px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    /* Panel background kept self-contained (the modal lives in the settings
       feature, not the Lab): reuse the existing --nc-console-line token rather
       than adding a new .nc-monitor--line class to lab.css (Out-of-scope wall). */
    background-color: var(--nc-console-line);
    /* Focus outline so keyboard users can see the panel is focused (C8.3) */
    outline: none;
}

.asm-panel:focus-visible {
    outline: 2px solid var(--nc-accent);
    outline-offset: 2px;
}

/* Slide-in entrance — gated by prefers-reduced-motion per brand/ETHOS C8.3
   and the blanket lab.css:683 rule intent. No animation when motion is reduced. */
@media (prefers-reduced-motion: no-preference) {
    .asm-panel {
        animation: asm-slide-in 150ms ease-out;
    }

    @keyframes asm-slide-in {
        from {
            opacity: 0;
            transform: translateY(0.5rem);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
}

.asm-reading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* kept: no .nc-* class for error-coloured text inside the panel */
.asm-error {
    color: var(--nc-error);
}

.asm-detail {
    opacity: 0.75;
}

.asm-dismiss {
    align-self: flex-end;
    color: var(--nc-btn-label);
}
</style>
