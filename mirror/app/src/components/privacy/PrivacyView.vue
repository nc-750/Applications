<script setup lang="ts">
import { ArrowLeft, Shield, ExternalLink } from "lucide-vue-next";
import { openExternal } from "../../lib/utils";

defineEmits<{ back: [] }>();

interface ProviderPolicy {
  name: string;
  summary: string;
  url: string;
}

const PROVIDER_POLICIES: ProviderPolicy[] = [
  {
    name: "OpenAI",
    summary: "Requests are not used for training by default. Retention up to 30 days.",
    url: "https://openai.com/policies/api-data-usage-policies",
  },
  {
    name: "Anthropic",
    summary: "Requests are not used for training by default.",
    url: "https://www.anthropic.com/legal/privacy",
  },
  {
    name: "Mistral",
    summary: "Mistral may retain prompts. Review their data policy before sending sensitive content.",
    url: "https://mistral.ai/terms",
  },
  {
    name: "OpenAI-compatible",
    summary:
      "Behavior depends on your endpoint. For maximum privacy, run a local model with Ollama or LM Studio.",
    url: "https://ollama.com",
  },
];

interface LocalItem {
  term: string;
  description: string;
}

const LOCAL_ITEMS: LocalItem[] = [
  { term: "Settings", description: "Your selected provider, model, endpoint, and (in the PWA) your API key." },
  { term: "Mirror data", description: "Your finished mirror output." },
  {
    term: "Interview",
    description:
      "The current interview's status, message history, and the background data you provided up front.",
  },
  {
    term: "Keys",
    description:
      "Desktop only. Stored in your operating system's credential store (Windows Credential Manager on Windows, macOS Keychain on macOS). Encrypted by the OS; not accessible to other user accounts.",
  },
];

const SENT_ITEMS = [
  "Every message you type in the interview.",
  "Every assistant reply (sent back on the next turn for context).",
  "The system prompt that defines the interviewer's behavior.",
  "The initial background data you paste or upload at the start of the interview.",
  "The full text of any file you upload (CV, LinkedIn export, PDF, JSON, etc.). The file is parsed locally to text before sending.",
];
</script>

<template>
  <div class="h-full overflow-auto" style="background-color: var(--nc-bg);">
    <div :style="{ maxWidth: '42rem', margin: '0 auto', padding: 'var(--nc-space-10) var(--nc-space-8)' }">
      <!-- Back -->
      <button
        class="nc-text-sm"
        style="display: flex; align-items: center; gap: var(--nc-space-1); margin-bottom: var(--nc-space-10); color: var(--nc-accent-ink); background: none; border: none; cursor: pointer;"
        @click="$emit('back')"
      >
        <ArrowLeft :size="14" />
        Back
      </button>

      <!-- Header -->
      <div class="flex items-start" :style="{ gap: 'var(--nc-space-4)', marginBottom: 'var(--nc-space-12)' }">
        <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--nc-radius-md); background: var(--nc-metal-key); border: var(--nc-border-width) solid var(--nc-line-strong); box-shadow: var(--nc-edge-raised); margin-top: 2px;">
          <Shield :size="18" />
        </div>
        <div>
          <h1 class="nc-heading-3" :style="{ lineHeight: 'var(--nc-leading-snug)', letterSpacing: 'var(--nc-track-tight)' }">
            Privacy details
          </h1>
          <p
            class="nc-text-sm nc-text-muted"
            :style="{ marginTop: 'var(--nc-space-1)', lineHeight: 'var(--nc-leading-relaxed)' }"
          >
            A plain-words breakdown of what stays on your device and what leaves it.
          </p>
        </div>
      </div>

      <!-- Sections -->
      <div>
        <!-- 1. What stays on your device -->
        <section :style="{ paddingBottom: 'var(--nc-space-10)' }">
          <h2 class="nc-heading-4" :style="{ marginBottom: 'var(--nc-space-1)' }">What stays on your device</h2>
          <p
            class="nc-text-sm nc-text-muted"
            :style="{ lineHeight: 'var(--nc-leading-relaxed)', marginBottom: 'var(--nc-space-6)' }"
          >
            Mirror keeps your data local. None of the items below are uploaded to a Mirror-owned server. Mirror has
            no server.
          </p>
          <dl :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--nc-space-5)' }">
            <div v-for="item in LOCAL_ITEMS" :key="item.term">
              <dt :style="{ marginBottom: 'var(--nc-space-1)' }">
                <code class="nc-code">{{ item.term }}</code>
              </dt>
              <dd
                class="nc-text-sm nc-text-secondary"
                :style="{ lineHeight: 'var(--nc-leading-relaxed)', paddingLeft: '2px' }"
              >
                {{ item.description }}
              </dd>
            </div>
          </dl>
        </section>

        <hr class="nc-divider" />

        <!-- 2. What is sent -->
        <section :style="{ paddingTop: 'var(--nc-space-10)', paddingBottom: 'var(--nc-space-10)' }">
          <h2 class="nc-heading-4" :style="{ marginBottom: 'var(--nc-space-1)' }">What is sent to your AI provider</h2>
          <p
            class="nc-text-sm nc-text-secondary"
            :style="{ lineHeight: 'var(--nc-leading-relaxed)', marginBottom: 'var(--nc-space-5)' }"
          >
            When you run an interview, the app calls your AI provider's API directly from this device. Every one of the
            following is POSTed over HTTPS to the provider you chose:
          </p>
          <ul
            :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--nc-space-2)', fontSize: 'var(--nc-text-sm)', color: 'var(--nc-ink-2)', lineHeight: 'var(--nc-leading-relaxed)' }"
          >
            <li v-for="item in SENT_ITEMS" :key="item" class="flex" style="gap: var(--nc-space-3);">
              <span class="shrink-0" :style="{ color: 'var(--nc-ink-3)' }">–</span>
              <span>{{ item }}</span>
            </li>
          </ul>
          <p
            class="nc-text-sm nc-text-muted"
            :style="{ lineHeight: 'var(--nc-leading-relaxed)', marginTop: 'var(--nc-space-5)' }"
          >
            The provider sees everything required to generate a response. Treat this as if you were pasting the content
            into their official web app.
          </p>
        </section>

        <hr class="nc-divider" />

        <!-- 3. Provider data policies -->
        <section :style="{ paddingTop: 'var(--nc-space-10)', paddingBottom: 'var(--nc-space-10)' }">
          <h2 class="nc-heading-4" :style="{ marginBottom: 'var(--nc-space-1)' }">Provider data policies</h2>
          <p
            class="nc-text-sm nc-text-muted"
            :style="{ lineHeight: 'var(--nc-leading-relaxed)', marginBottom: 'var(--nc-space-6)' }"
          >
            Each provider has its own retention and training policy. Mirror does not control or alter these.
          </p>
          <ul :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--nc-space-6)' }">
            <li v-for="p in PROVIDER_POLICIES" :key="p.name">
              <p class="nc-text-sm nc-font-semibold" :style="{ color: 'var(--nc-ink)', marginBottom: 'var(--nc-space-1)' }">
                {{ p.name }}
              </p>
              <p
                class="nc-text-sm nc-text-secondary"
                :style="{ lineHeight: 'var(--nc-leading-relaxed)', marginBottom: 'var(--nc-space-1)' }"
              >
                {{ p.summary }}
              </p>
              <button
                class="nc-text-sm"
                style="display: inline-flex; align-items: center; gap: var(--nc-space-1); color: var(--nc-accent-ink); background: none; border: none; cursor: pointer; text-decoration: underline;"
                @click="openExternal(p.url)"
              >
                {{ p.name }} policy
                <ExternalLink :size="11" />
              </button>
            </li>
          </ul>
        </section>

        <hr class="nc-divider" />

        <!-- 4. Hard-delete behavior -->
        <section :style="{ paddingTop: 'var(--nc-space-10)', paddingBottom: 'var(--nc-space-10)' }">
          <h2 class="nc-heading-4" :style="{ marginBottom: 'var(--nc-space-1)' }">Hard-delete behavior</h2>
          <p
            class="nc-text-sm nc-text-muted"
            :style="{ lineHeight: 'var(--nc-leading-relaxed)', marginBottom: 'var(--nc-space-6)' }"
          >
            The Settings panel's Danger Zone exposes three destructive actions. Each one removes data permanently; there
            is no undo and no remote backup.
          </p>
          <dl :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--nc-space-5)' }">
            <div>
              <dt class="nc-text-sm nc-font-semibold" :style="{ color: 'var(--nc-ink)', marginBottom: 'var(--nc-space-1)' }">
                Clear mirror data
              </dt>
              <dd class="nc-text-sm nc-text-secondary" :style="{ lineHeight: 'var(--nc-leading-relaxed)' }">
                Wipes the <code class="nc-code">persona</code> and <code class="nc-code">interview</code> stores. Your
                provider settings and API key are kept.
              </dd>
            </div>
            <div>
              <dt class="nc-text-sm nc-font-semibold" :style="{ color: 'var(--nc-ink)', marginBottom: 'var(--nc-space-1)' }">
                Clear AI provider
              </dt>
              <dd class="nc-text-sm nc-text-secondary" :style="{ lineHeight: 'var(--nc-leading-relaxed)' }">
                Clears the API key from the app. Your mirror data and interview data are kept.
              </dd>
            </div>
            <div>
              <dt class="nc-text-sm nc-font-semibold" :style="{ color: 'var(--nc-ink)', marginBottom: 'var(--nc-space-1)' }">
                Factory reset
              </dt>
              <dd class="nc-text-sm nc-text-secondary" :style="{ lineHeight: 'var(--nc-leading-relaxed)' }">
                Full wipe: all mirror data, interview, and API key data is deleted. The app then reloads to its first-run
                state.
              </dd>
            </div>
          </dl>
        </section>

        <hr class="nc-divider" />

        <!-- 5. Known limitations -->
        <section :style="{ paddingTop: 'var(--nc-space-10)' }">
          <h2 class="nc-heading-4" :style="{ marginBottom: 'var(--nc-space-1)' }">Known limitations</h2>
          <p class="nc-text-sm nc-text-secondary" :style="{ lineHeight: 'var(--nc-leading-relaxed)' }">
            <span class="nc-font-semibold" :style="{ color: 'var(--nc-ink)' }">
              Permissive CSP for openai-compatible endpoints.
            </span>
            The Content Security Policy includes a broad <code class="nc-code">https:</code> clause in
            <code class="nc-code">connect-src</code> so any user-supplied endpoint can be reached. A future enhancement
            will narrow this to the exact endpoint configured in Settings.
          </p>
        </section>
      </div>

      <div :style="{ height: 'var(--nc-space-12)' }" />
    </div>
  </div>
</template>
