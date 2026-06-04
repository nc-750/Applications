<script setup lang="ts">
import { ref, watch } from "vue";
import { X, Check, Loader2, AlertCircle, ExternalLink, KeyRound, Trash2 } from "lucide-vue-next";
import { useLicenseStore } from "../../stores/licenseStore";
import { getStoreUrl } from "../../lib/licenseKeyStore";
import { openExternal } from "../../lib/utils";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const license = useLicenseStore();

const key = ref("");
const state = ref<"idle" | "loading" | "success" | "error">("idle");
const errorMsg = ref("");
const storeUrl = ref("");
const showDeactivateConfirm = ref(false);
const deactivating = ref(false);

watch(
  () => props.open,
  (open) => {
    if (open) {
      key.value = "";
      state.value = "idle";
      errorMsg.value = "";
      showDeactivateConfirm.value = false;
      getStoreUrl().then((url) => (storeUrl.value = url));
    }
  },
);

function resetState() {
  state.value = "idle";
  errorMsg.value = "";
}

async function handleActivate() {
  const trimmed = key.value.trim();
  if (!trimmed) return;
  state.value = "loading";
  errorMsg.value = "";
  try {
    await license.activate(trimmed);
    state.value = "success";
    setTimeout(() => emit("close"), 1200);
  } catch (e) {
    state.value = "error";
    errorMsg.value = e instanceof Error ? e.message : "Activation failed. Please try again.";
  }
}

async function handleDeactivate() {
  deactivating.value = true;
  try {
    await license.deactivate();
    emit("close");
  } finally {
    deactivating.value = false;
    showDeactivateConfirm.value = false;
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.35);" @click="emit('close')">
    <div class="flex flex-col overflow-hidden" style="width: 400px; max-width: 90vw; max-height: 90vh; background: var(--nc-bg); border: var(--nc-border-width) solid var(--nc-line-subtle); border-radius: var(--nc-radius-lg); box-shadow: 0 8px 32px rgba(0,0,0,0.2);" @click.stop>
      <!-- Header -->
      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--nc-space-4) var(--nc-space-5)',
          borderBottom: 'var(--nc-border-width) solid var(--nc-line)',
        }"
      >
        <div class="flex items-center" :style="{ gap: 'var(--nc-space-2)' }">
          <KeyRound :size="16" :style="{ color: 'var(--nc-accent)' }" />
          <h3 class="nc-text-md nc-font-semibold" :style="{ color: 'var(--nc-ink)' }">License</h3>
        </div>
        <button class="nc-btn nc-btn--ghost nc-btn--icon nc-btn--sm" @click="emit('close')">
          <X :size="16" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto" style="padding: var(--nc-space-5);">
        <!-- Activated state -->
        <div v-if="license.isPro" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--nc-space-4)' }">
          <div
            class="flex items-start"
            :style="{ gap: 'var(--nc-space-2)', padding: 'var(--nc-space-2) var(--nc-space-3)', borderRadius: 'var(--nc-radius-md)', backgroundColor: 'var(--nc-accent-subtle)' }"
          >
            <Check :size="14" class="shrink-0" :style="{ color: 'var(--nc-accent)' }" />
            <div>
              <p class="nc-text-sm nc-font-medium" :style="{ color: 'var(--nc-ink)' }">Pro license active</p>
              <p class="nc-text-mono nc-text-xs nc-text-muted" style="margin-top: 2px;">{{ license.maskedKey }}</p>
              <p v-if="license.activatedAt" class="nc-text-xs nc-text-muted" :style="{ marginTop: '2px' }">
                Activated {{ new Date(license.activatedAt).toLocaleDateString() }}
              </p>
            </div>
          </div>

          <div v-if="showDeactivateConfirm" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--nc-space-3)' }">
            <p class="nc-text-xs nc-text-secondary" :style="{ lineHeight: 'var(--nc-leading-relaxed)' }">
              This removes the license from this device. You can re-activate it later using the same key.
            </p>
            <div class="flex" :style="{ gap: 'var(--nc-space-2)' }">
              <button
                :disabled="deactivating"
                class="nc-btn nc-btn--secondary nc-btn--sm"
                :style="{ flex: 1 }"
                @click="showDeactivateConfirm = false"
              >
                Cancel
              </button>
              <button
                :disabled="deactivating"
                class="nc-btn nc-btn--danger nc-btn--sm"
                :style="{ flex: 1, justifyContent: 'center', gap: 'var(--nc-space-1)' }"
                @click="handleDeactivate"
              >
                <Loader2 v-if="deactivating" :size="12" class="animate-spin" />
                Deactivate
              </button>
            </div>
          </div>
          <button
            v-else
            class="nc-text-xs"
            style="display: flex; align-items: center; gap: var(--nc-space-1); color: var(--nc-accent-ink); background: none; border: none; cursor: pointer;"
            @click="showDeactivateConfirm = true"
          >
            <Trash2 :size="12" />
            Remove license from this device
          </button>
        </div>

        <!-- Not activated state -->
        <div v-else :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--nc-space-4)' }">
          <p class="nc-text-sm nc-text-secondary" :style="{ lineHeight: 'var(--nc-leading-relaxed)' }">
            Enter your license key to unlock Pro features on this device.
          </p>

          <div style="display: flex; flex-direction: column; gap: var(--nc-space-2);">
            <input
              v-model="key"
              type="text"
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              :disabled="state === 'loading' || state === 'success'"
              autofocus
              class="nc-input"
              :style="{ fontFamily: 'var(--nc-font-mono)', letterSpacing: 'var(--nc-track-label)' }"
              @input="resetState"
              @keydown.enter="handleActivate"
            />
            <div
              v-if="state === 'error' && errorMsg"
              class="flex items-start"
              :style="{ gap: 'var(--nc-space-1)', fontSize: 'var(--nc-text-xs)', color: 'var(--nc-error)' }"
            >
              <AlertCircle :size="12" class="shrink-0" :style="{ marginTop: '2px' }" />
              {{ errorMsg }}
            </div>
          </div>

          <button
            :disabled="!key.trim() || state === 'loading' || state === 'success'"
            class="nc-btn nc-btn--accent w-full"
            :style="{ justifyContent: 'center', fontWeight: 'var(--nc-font-semibold)' }"
            @click="handleActivate"
          >
            <Loader2 v-if="state === 'loading'" :size="14" class="animate-spin" />
            <Check v-if="state === 'success'" :size="14" />
            {{ state === "loading" ? "Activating…" : state === "success" ? "Activated!" : "Activate" }}
          </button>

          <button
            v-if="storeUrl"
            class="nc-text-xs"
            style="display: flex; align-items: center; justify-content: center; gap: var(--nc-space-1); padding: var(--nc-space-2) 0; color: var(--nc-accent-ink); background: none; border: none; cursor: pointer;"
            @click="openExternal(storeUrl)"
          >
            <ExternalLink :size="11" />
            Purchase a license
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
