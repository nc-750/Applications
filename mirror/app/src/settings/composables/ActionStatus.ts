/**
 * Action-status primitive for the Settings page.
 *
 * Defines the four-case discriminated status a per-action holder exposes
 * (idle / running / success / error), plus a factory for the initial idle
 * state and a thin reactive holder the page can instantiate once per action.
 *
 * Doctrine:
 *   - nc-750-web-frontend-architecture: CONVENTIONS 4.6 (composable as reactive
 *     adapter — flow state only, no business logic); 1.3 (total construction via
 *     factory); §2 one-way graph (pure view-layer state, nothing here reaches into
 *     a store or service); 7.17–7.18 (caught failure → reactive view state).
 *   - nc-750-frontend-presentation: honest instrument state — running is a real
 *     in-flight signal, success/error are real terminal outcomes, never decorative.
 *   - ETHOS C7: error requires a real message (structural impossibility of an empty
 *     or invented claim); success reachable only by explicit toSuccess() transition.
 *
 * This type is transient view-layer flow state, NOT a persisted domain model —
 * that is why it lives here in composables/ rather than in settings/models/
 * (CONVENTIONS 1.1–1.2: models/ holds only the persisted domain aggregate).
 */

import { ref } from "vue";

// ── Type ─────────────────────────────────────────────────────────────────────

/** The four honest states an in-page action can be in. */
export type ActionStatus =
    | { kind: "idle" }
    | { kind: "running" }
    | { kind: "success"; detail?: string }
    | { kind: "error"; message: string };

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Returns the initial idle state.
 * Co-located with the type (CONVENTIONS 1.3-style total construction) so every
 * call site starts at the one honest default rather than hand-constructing it.
 */
export function idleActionStatus(): ActionStatus {
    return { kind: "idle" };
}

// ── Reactive holder ───────────────────────────────────────────────────────────

/** The shape returned by useActionStatus(). */
export interface ActionStatusHolder {
    /** The current reactive status reading (read-only for consumers). */
    readonly status: Readonly<ActionStatus>;
    /** Transition to running (the action is in-flight). */
    toRunning(): void;
    /** Transition to success. Pass detail only when there is a literally-true string to show. */
    toSuccess(detail?: string): void;
    /** Transition to error. Requires the real surfaced message — never a placeholder. */
    toError(message: string): void;
    /** Return to idle, clearing any prior outcome. */
    reset(): void;
}

/**
 * Returns a per-action reactive holder.
 *
 * Each call mints a fresh ref so multiple holders are fully independent —
 * the page can hold one per action without any shared state between them.
 *
 * The holder exposes only pure synchronous state transitions (CONVENTIONS 4.6):
 * no async, no service call, no store reach-down. It is a reactive adapter
 * over the ActionStatus type, nothing more.
 */
export function useActionStatus(): ActionStatusHolder {
    const _status = ref<ActionStatus>(idleActionStatus());

    return {
        get status(): ActionStatus {
            return _status.value;
        },
        toRunning(): void {
            _status.value = { kind: "running" };
        },
        toSuccess(detail?: string): void {
            _status.value = detail !== undefined
                ? { kind: "success", detail }
                : { kind: "success" };
        },
        toError(message: string): void {
            _status.value = { kind: "error", message };
        },
        reset(): void {
            _status.value = idleActionStatus();
        },
    };
}
