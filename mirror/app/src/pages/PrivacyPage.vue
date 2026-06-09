<script setup lang="ts">
import { ArrowLeft, Shield, ExternalLink } from "lucide-vue-next";
import { Band, Cell } from "@nc-750/lab-vue";
import { openExternal } from "../lib/utils";

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
  <Band :grow="1" class="overflow-y-auto">
    <Cell title="PRIVACY" spec="// 0x00">
      <div class="privacy-page">
        <!-- Back -->
        <router-link to="/" class="privacy-back">
          <ArrowLeft :size="14" aria-hidden="true" />
          Back
        </router-link>

        <!-- Header -->
        <div class="privacy-header">
          <div class="privacy-header__icon">
            <Shield :size="18" aria-hidden="true" />
          </div>
          <div>
            <h1 class="nc-heading-3 privacy-header__title">Privacy details</h1>
            <p class="nc-text-sm nc-text-muted privacy-header__subtitle">
              A plain-words breakdown of what stays on your device and what leaves it.
            </p>
          </div>
        </div>

        <!-- 1. What stays on your device -->
        <section class="privacy-section">
          <h2 class="nc-heading-4 privacy-section__heading">What stays on your device</h2>
          <p class="nc-text-sm nc-text-muted privacy-section__intro">
            Mirror keeps your data local. None of the items below are uploaded to a Mirror-owned server. Mirror has
            no server.
          </p>
          <dl class="privacy-dl">
            <div v-for="item in LOCAL_ITEMS" :key="item.term">
              <dt class="privacy-dl__term">
                <code class="nc-code">{{ item.term }}</code>
              </dt>
              <dd class="nc-text-sm nc-text-secondary privacy-dl__desc">
                {{ item.description }}
              </dd>
            </div>
          </dl>
        </section>

        <hr class="nc-divider" />

        <!-- 2. What is sent -->
        <section class="privacy-section">
          <h2 class="nc-heading-4 privacy-section__heading">What is sent to your AI provider</h2>
          <p class="nc-text-sm nc-text-secondary privacy-section__intro">
            When you run an interview, the app calls your AI provider's API directly from this device. Every one of the
            following is POSTed over HTTPS to the provider you chose:
          </p>
          <ul class="privacy-sent-list">
            <li v-for="item in SENT_ITEMS" :key="item" class="privacy-sent-item">
              <span class="privacy-sent-item__dash">–</span>
              <span>{{ item }}</span>
            </li>
          </ul>
          <p class="nc-text-sm nc-text-muted privacy-note">
            The provider sees everything required to generate a response. Treat this as if you were pasting the content
            into their official web app.
          </p>
        </section>

        <hr class="nc-divider" />

        <!-- 3. Provider data policies -->
        <section class="privacy-section">
          <h2 class="nc-heading-4 privacy-section__heading">Provider data policies</h2>
          <p class="nc-text-sm nc-text-muted privacy-section__intro">
            Each provider has its own retention and training policy. Mirror does not control or alter these.
          </p>
          <ul class="privacy-provider-list">
            <li v-for="p in PROVIDER_POLICIES" :key="p.name">
              <p class="nc-text-sm nc-font-semibold privacy-provider__name">{{ p.name }}</p>
              <p class="nc-text-sm nc-text-secondary privacy-provider__summary">
                {{ p.summary }}
              </p>
              <button
                class="privacy-provider__link nc-text-sm"
                @click="openExternal(p.url)"
              >
                {{ p.name }} policy
                <ExternalLink :size="11" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </section>

        <hr class="nc-divider" />

        <!-- 4. Hard-delete behavior -->
        <section class="privacy-section">
          <h2 class="nc-heading-4 privacy-section__heading">Hard-delete behavior</h2>
          <p class="nc-text-sm nc-text-muted privacy-section__intro">
            The Settings panel's Danger Zone exposes three destructive actions. Each one removes data permanently; there
            is no undo and no remote backup.
          </p>
          <dl class="privacy-dl">
            <div>
              <dt class="nc-text-sm nc-font-semibold privacy-dl__term--strong">
                Clear mirror data
              </dt>
              <dd class="nc-text-sm nc-text-secondary privacy-dl__desc">
                Wipes the <code class="nc-code">persona</code> and <code class="nc-code">interview</code> stores. Your
                provider settings and API key are kept.
              </dd>
            </div>
            <div>
              <dt class="nc-text-sm nc-font-semibold privacy-dl__term--strong">
                Clear AI provider
              </dt>
              <dd class="nc-text-sm nc-text-secondary privacy-dl__desc">
                Clears the API key from the app. Your mirror data and interview data are kept.
              </dd>
            </div>
            <div>
              <dt class="nc-text-sm nc-font-semibold privacy-dl__term--strong">
                Factory reset
              </dt>
              <dd class="nc-text-sm nc-text-secondary privacy-dl__desc">
                Full wipe: all mirror data, interview, and API key data is deleted. The app then reloads to its first-run
                state.
              </dd>
            </div>
          </dl>
        </section>

        <hr class="nc-divider" />

        <!-- 5. Known limitations -->
        <section class="privacy-section">
          <h2 class="nc-heading-4 privacy-section__heading">Known limitations</h2>
          <p class="nc-text-sm nc-text-secondary privacy-limitation">
            <span class="nc-font-semibold privacy-limitation__label">
              Permissive CSP for openai-compatible endpoints.
            </span>
            The Content Security Policy includes a broad <code class="nc-code">https:</code> clause in
            <code class="nc-code">connect-src</code> so any user-supplied endpoint can be reached. A future enhancement
            will narrow this to the exact endpoint configured in Settings.
          </p>
        </section>
      </div>
    </Cell>
  </Band>
</template>

<style scoped>
.privacy-page {
  max-width: 42rem;
  margin: 0 auto;
}

/* ── Back link ── */
.privacy-back {
  display: inline-flex;
  align-items: center;
  gap: var(--nc-space-1);
  margin-bottom: var(--nc-space-10);
  color: var(--nc-accent-ink);
  font-size: var(--nc-text-sm);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

/* ── Header ── */
.privacy-header {
  display: flex;
  align-items: flex-start;
  gap: var(--nc-space-4);
  margin-bottom: var(--nc-space-12);
}

.privacy-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--nc-radius-md);
  background: var(--nc-metal-key);
  border: var(--nc-border-width) solid var(--nc-line-strong);
  box-shadow: var(--nc-edge-raised);
  margin-top: 2px;
  flex-shrink: 0;
}

.privacy-header__title {
  line-height: var(--nc-leading-snug);
  letter-spacing: var(--nc-track-tight);
}

.privacy-header__subtitle {
  margin-top: var(--nc-space-1);
  line-height: var(--nc-leading-relaxed);
}

/* ── Sections ── */
.privacy-section {
  padding-top: var(--nc-space-10);
  padding-bottom: var(--nc-space-10);
}

.privacy-section__heading {
  margin-bottom: var(--nc-space-1);
}

.privacy-section__intro {
  line-height: var(--nc-leading-relaxed);
  margin-bottom: var(--nc-space-6);
}

/* ── Definition lists ── */
.privacy-dl {
  display: flex;
  flex-direction: column;
  gap: var(--nc-space-5);
}

.privacy-dl__term {
  margin-bottom: var(--nc-space-1);
}

.privacy-dl__term--strong {
  color: var(--nc-ink);
  margin-bottom: var(--nc-space-1);
}

.privacy-dl__desc {
  line-height: var(--nc-leading-relaxed);
  padding-left: 2px;
}

/* ── Sent items list ── */
.privacy-sent-list {
  display: flex;
  flex-direction: column;
  gap: var(--nc-space-2);
  font-size: var(--nc-text-sm);
  color: var(--nc-ink-2);
  line-height: var(--nc-leading-relaxed);
}

.privacy-sent-item {
  display: flex;
  gap: var(--nc-space-3);
}

.privacy-sent-item__dash {
  color: var(--nc-ink-3);
  flex-shrink: 0;
}

.privacy-note {
  line-height: var(--nc-leading-relaxed);
  margin-top: var(--nc-space-5);
}

/* ── Provider policies ── */
.privacy-provider-list {
  display: flex;
  flex-direction: column;
  gap: var(--nc-space-6);
}

.privacy-provider__name {
  color: var(--nc-ink);
  margin-bottom: var(--nc-space-1);
}

.privacy-provider__summary {
  line-height: var(--nc-leading-relaxed);
  margin-bottom: var(--nc-space-1);
}

.privacy-provider__link {
  display: inline-flex;
  align-items: center;
  gap: var(--nc-space-1);
  color: var(--nc-accent-ink);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.privacy-provider__link:focus-visible {
  outline: 2px solid var(--nc-accent);
  outline-offset: 2px;
}

/* ── Known limitations ── */
.privacy-limitation {
  line-height: var(--nc-leading-relaxed);
}

.privacy-limitation__label {
  color: var(--nc-ink);
}
</style>
