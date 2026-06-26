<script setup lang="ts">
// FeedbackModalCell — the feedback submission modal overlay.
//
// Lab contract (CONVENTIONS 7.6): input lives on a light Cell surface, never in a
// monitor cavity. This is the one operable dialog for the feedback feature.
//
// Design contract:
//   - One prop: `open: boolean` (parent owns open/close state — props-down/events-up,
//     CONVENTIONS 2.7). One emit: `close` (no payload).
//   - Local reactive draft seeded from createEmptyFeedbackSubmission() — no store,
//     no db (per Decision A: a single ephemeral form does not need shared state).
//   - Category selector bound to FeedbackCategory | undefined — never coerced to ""
//     (Decision B: undefined means "not chosen"; "" would defeat the !== undefined
//     validation rule).
//   - Submit is inert: TODO Phase 3 — mailto: composition and handoff.
//   - Backdrop + focus trap + Escape-to-dismiss + backdrop-click-to-dismiss.
//   - Reduced-motion-gated entrance (ETHOS C8.3).
//   - C8.3: role="dialog" + aria-modal + accessible name + focus-on-open.
//
// nc-750-web-frontend-architecture: CONVENTIONS 2.7 (props-down/events-up),
//   7.6 (monitor = read-only, input lives on a Cell), local draft pattern from
//   LLMConfigCell.vue.
// nc-750-frontend-presentation: overlay/dialog contract — backdrop, focus trap,
//   Escape dismiss, position:fixed, reduced-motion-gated entrance.
// ETHOS C8.3: keyboard-navigable, focus on open, reduced-motion, never colour-only.
// ETHOS C1.1: draft is local — never transmitted or persisted in this phase.
// ETHOS C2: no telemetry — nothing counts opens, submits, or category selections.

import { reactive, computed, watch, ref } from "vue";
import { Form, FormField, TextField, Textarea, Button } from "@nc-750/lab-vue";
import type { FeedbackCategory } from "../reference";
import { CATEGORY_OPTIONS } from "../reference";
import { createEmptyFeedbackSubmission } from "../models";
import type { FeedbackSubmission } from "../models";

// ── Props / emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
    /** Whether the modal is open. The parent owns this state. */
    open: boolean;
}>();

const emit = defineEmits<{
    /** Emitted on close: Escape key, backdrop click, or explicit Cancel button. */
    close: [];
}>();

// ── Local draft (Decision A: local component state, not a store) ─────────────

// The draft is seeded fresh from the factory. Because this modal is mounted once
// and shown/hidden via the `open` prop, the draft persists across open/close cycles
// within one mount — it does not silently destroy in-progress content on an
// incidental close. Per Decision A, reset on the next open is the intended
// behaviour when Phase 5 mounts this in the App shell.
const draft = reactive<FeedbackSubmission>(createEmptyFeedbackSubmission());

// ── Category binding bridge (Decision B) ─────────────────────────────────────

// The category field is FeedbackCategory | undefined. A raw <select> v-model
// cannot bind undefined directly without help. We use a small computed bridge:
// the draft field stays FeedbackCategory | undefined; the DOM select sees "" for
// undefined and a real value otherwise. The placeholder <option value=""> is
// rendered disabled so it shows at rest when the computed bridge value is "".
const categoryBridge = computed<FeedbackCategory | "">({
    get() {
        return draft.category ?? "";
    },
    set(v: FeedbackCategory | "") {
        draft.category = v === "" ? undefined : v;
    },
});

// ── Validation + canSubmit ────────────────────────────────────────────────────

// Honest emptiness checks mirror the LLMConfigCell precedent (explicit !== "", !== undefined —
// never a bare falsy test, because the category enum includes no falsy member).
const canSubmit = computed(() => {
    const categoryChosen = draft.category !== undefined;
    // Minimal local@domain shape: an @ with text either side (Decision B)
    const emailValid =
        draft.email !== "" &&
        /^[^@]+@[^@]+$/.test(draft.email);
    const subjectValid = draft.subject.trim() !== "";
    const contentValid = draft.content.trim() !== "";
    return categoryChosen && emailValid && subjectValid && contentValid;
});

// ── Focus management ──────────────────────────────────────────────────────────

const panelRef = ref<HTMLElement | null>(null);

watch(
    () => props.open,
    (open) => {
        if (open) {
            // Move focus into the panel on open so keyboard/AT users land inside the
            // dialog (C8.3). setTimeout(0) matches the ActionStatusModal precedent:
            // the DOM must be updated before focus can be moved.
            setTimeout(() => {
                const firstFocusable = panelRef.value?.querySelector<HTMLElement>(
                    "select, input, textarea, button",
                );
                (firstFocusable ?? panelRef.value)?.focus();
            }, 0);
        }
    },
);

// ── Focus trap ───────────────────────────────────────────────────────────────

function onPanelKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
        emit("close");
        return;
    }

    if (e.key !== "Tab" || !panelRef.value) return;

    // Trap Tab/Shift-Tab cycling within the panel while open (C8.3 focus trap).
    const focusable = Array.from(
        panelRef.value.querySelectorAll<HTMLElement>(
            "select, input, textarea, button, [tabindex]:not([tabindex='-1'])",
        ),
    ).filter((el) => !el.hasAttribute("disabled"));

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    } else {
        if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

// ── Backdrop click ───────────────────────────────────────────────────────────

function onBackdropClick(e: MouseEvent): void {
    // Emit close only when the click target is the backdrop itself, not the panel.
    // stopPropagation on the panel prevents panel clicks from reaching the backdrop.
    if (e.target === e.currentTarget) {
        emit("close");
    }
}

function onPanelClick(e: MouseEvent): void {
    // Stop the click from bubbling up to the backdrop handler.
    e.stopPropagation();
}

// ── Inert submit (TODO Phase 3) ───────────────────────────────────────────────

function onSubmit(): void {
    // TODO Phase 3 — mailto: composition and handoff.
    // This handler is intentionally a no-op placeholder. It does not compose a
    // mailto: URI, does not call window.location or window.open, does not emit a
    // send/submit event, and does not mutate anything beyond the local draft.
    // Phase 3 will replace this body with the MailtoService call.
    if (!canSubmit.value) return;
    // no-op by design — inert until Phase 3
}
</script>

<template>
    <!-- Viewport-fixed backdrop: covers the full viewport beneath the panel.
         Clicking the backdrop emits close (backdrop-click-to-dismiss).
         v-if keeps the backdrop + panel absent from the DOM when closed (Test 8). -->
    <div
        v-if="open"
        class="fmc-backdrop"
        aria-hidden="true"
        @click="onBackdropClick"
    >
        <!-- Panel: the input-hosting operable surface. A Lab Cell (light, raised),
             NOT a MonitorCell (dark, read-only — CONVENTIONS 7.6).
             role="dialog" + aria-modal + accessible name satisfy C8.3.
             tabindex="-1" makes the panel itself focusable as the focus-on-open
             fallback if no child field is found. -->
        <div
            ref="panelRef"
            class="nc-cell fmc-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Send feedback"
            tabindex="-1"
            @keydown="onPanelKeydown"
            @click="onPanelClick"
        >
            <!-- Panel header -->
            <header class="nc-cell-head">
                <span class="nc-label">FEEDBACK</span>
                <span class="nc-label">FBK // 0x02</span>
            </header>

            <div class="nc-cell-content">
                <!-- Placeholder region for Phase 4 disclosure copy.
                     Phase 4 will author the "what gets processed / this opens your
                     mail client" wording. This slot must not assert anything about
                     transport — it is intentionally empty until Phase 4. -->
                <slot name="disclosure" />

                <Form class="flex flex-col gap-4" @submit.prevent="onSubmit">
                    <!-- Category selector — raw <select class="nc-select"> per the
                         LLMConfigCell precedent (lines 109-114). The Lab Select
                         component exposes only a default slot, making the
                         disabled-placeholder + v-for idiom harder. The category set
                         is never re-declared here — it is read from CATEGORY_OPTIONS.
                         The bridge computed keeps draft.category as FeedbackCategory |
                         undefined (Decision B). -->
                    <FormField label="Category" class="flex flex-col gap-2">
                        <select class="nc-select" v-model="categoryBridge">
                            <option value="" disabled>Choose a category…</option>
                            <option
                                v-for="opt in CATEGORY_OPTIONS"
                                :key="opt.value"
                                :value="opt.value"
                            >
                                {{ opt.label }}
                            </option>
                        </select>
                    </FormField>

                    <!-- Email — raw <input type="email"> because TextField's type union
                         is "text"|"url"|"tel"|"password" (lab/vue/src/components/TextField.vue
                         line 7); <TextField type="email"> would fail vue-tsc. Precedent:
                         LLMConfigCell lines 122-127 uses a raw <input type="url"> for the
                         same reason. -->
                    <FormField label="Email" class="flex flex-col gap-2">
                        <input
                            class="nc-input"
                            type="email"
                            placeholder="you@example.com"
                            v-model="draft.email"
                        />
                    </FormField>

                    <!-- Subject — in-union type="text", so the Lab TextField is correct here. -->
                    <FormField label="Subject" class="flex flex-col gap-2">
                        <TextField
                            type="text"
                            placeholder="Brief description"
                            v-model="draft.subject"
                        />
                    </FormField>

                    <!-- Content — multi-line, Lab Textarea. -->
                    <FormField label="Details" class="flex flex-col gap-2">
                        <Textarea v-model="draft.content" />
                    </FormField>

                    <div class="flex gap-4 justify-end">
                        <!-- Cancel / close control: keyboard-operable <button> (C8.3).
                             Emits close without destroying the draft content. -->
                        <Button variant="ghost" type="button" @click="emit('close')">
                            Cancel
                        </Button>

                        <!-- Submit: inert until Phase 3. Disabled when canSubmit is false.
                             TODO Phase 3: replace onSubmit body with MailtoService call. -->
                        <Button
                            variant="accent"
                            submit
                            :disabled="!canSubmit"
                        >
                            Send feedback
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Full-viewport fixed backdrop: beneath the panel, above all page content.
   Clicking the backdrop region (outside the panel) dismisses the modal.
   Intentionally NOT position:absolute — must survive scroll and single-column
   collapse (same reasoning as ActionStatusModal's .asm-panel). */
.fmc-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
}

/* Centered modal panel: the input-hosting, raised Cell surface.
   Width is capped so it reads as a discrete dialog, not a full-page form. */
.fmc-panel {
    position: relative;
    z-index: 1001;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    /* Focus outline so keyboard users can see focus (C8.3) */
    outline: none;
}

.fmc-panel:focus-visible {
    outline: 2px solid var(--nc-accent);
    outline-offset: 2px;
}

/* Reduced-motion-gated entrance — gated by prefers-reduced-motion per ETHOS C8.3.
   Mirrors the .asm-panel precedent in ActionStatusModal.vue. */
@media (prefers-reduced-motion: no-preference) {
    .fmc-panel {
        animation: fmc-fade-in 150ms ease-out;
    }

    @keyframes fmc-fade-in {
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
</style>
