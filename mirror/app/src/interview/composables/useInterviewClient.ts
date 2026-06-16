import { ref, readonly, watch } from "vue";
import type { LLMClient } from "@nc-750/llm-ts";
import { createClientFromConfig } from "../../llm/factory";
import { useSettingsStore } from "../../settings/stores";

/**
 * Reactive adapter (CONVENTIONS 4.6) that owns the "settings change → rebuild
 * LLM client" wiring, so the view holds no infrastructure construction (2.7).
 * Exposes a readonly client (null when settings are incomplete or construction
 * fails) and a readonly error string. Holds no business logic — what to do with
 * the client lives in the plain service functions that receive it as an argument.
 */
export function useInterviewClient() {
    const settingsStore = useSettingsStore();
    const client = ref<LLMClient | null>(null);
    const error = ref<string | null>(null);

    function build(): void {
        if (!settingsStore.isLLMConfigured) {
            client.value = null;
            return;
        }
        try {
            // The settings store exposes a flat surface; assemble the LLMConfig the
            // factory expects from those refs. `isLLMConfigured` guarantees provider
            // is set, so the non-null assertion is safe.
            client.value = createClientFromConfig({
                provider: settingsStore.provider!,
                model: settingsStore.model,
                apiKey: settingsStore.apiKey,
                endpoint: settingsStore.endpoint,
            });
            error.value = null;
        } catch (e) {
            client.value = null;
            error.value = e instanceof Error ? e.message : "Failed to create LLM client";
        }
    }

    watch(
        () => [settingsStore.provider, settingsStore.model, settingsStore.apiKey, settingsStore.endpoint],
        build,
        { immediate: true },
    );

    return { client: readonly(client), clientError: readonly(error) };
}
