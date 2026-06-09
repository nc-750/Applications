<script setup lang="ts">
import { Band, Cell } from "@nc-750/lab-vue";

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
    term: "API Keys",
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
  <Band>
    <Cell title="DATA POLICY" spec="PRV // 0x01">
      <section>
        <div class="flex items-baseline gap-3 mb-3 border-b-[1.5px]">
          <span class="nc-label nc-label--accent">01.</span>
          <h4 class="nc-heading-4 flex-auto">What stays on your device</h4>
        </div>
        <p class="nc-text-sm nc-text-muted mb-6">
          Mirror keeps your data local. None of the items below are uploaded to a Mirror-owned server. Mirror has
          no server.
        </p>
          <dl>
            <div v-for="item in LOCAL_ITEMS" :key="item.term">
              <dt>
                <code class="nc-code">{{ item.term }}</code>
              </dt>
              <dd class="nc-text-sm nc-text-secondary mb-2">
                {{ item.description }}
              </dd>
            </div>
          </dl>
        </section>
    </Cell>
    <Cell title="AI PROVIDER" spec="PRV // 0x02">
      <section>
        <header class="flex items-baseline gap-3 mb-3 border-b-[1.5px]">
          <span class="nc-label nc-label--accent">02.</span>
          <h4 class="nc-heading-4 flex-auto">What is sent to your AI provider</h4>
        </header>
        <p class="nc-text-sm nc-text-secondary mb-6">
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
    </Cell>      
  </Band>
  <Band>
    <Cell title="PROVIDER POLICY" spec="PRV // 0x03">
      <section>
        <header class="flex items-baseline gap-3 mb-3 border-b-[1.5px]">
          <span class="nc-label nc-label--accent">03.</span>
          <h4 class="nc-heading-4 flex-auto">Provider data policies</h4>
        </header>
          
        <p class="nc-text-sm nc-text-muted mb-6">
          Each provider has its own retention and training policy. Mirror does not control or alter these.
        </p>
        <ul class="ml-4">
          <li class="mb-4" v-for="p in PROVIDER_POLICIES" :key="p.name">
            <a class="nc-text-sm nc-font-semibold" :href="p.url">{{ p.name }}</a>
            <p class="nc-text-sm nc-text-secondary">{{ p.summary }}</p>
          </li>
        </ul>
      </section>
    </Cell>
  </Band>
  <Band>
    <Cell title="DELETION" spec="PRV // 0x04" :grow="2">
      <section>
        <header class="flex items-baseline gap-3 mb-3 border-b-[1.5px]">
          <span class="nc-label nc-label--accent">03.</span>
          <h4 class="nc-heading-4">Hard-delete behavior</h4>
        </header>
        <p class="nc-text-sm nc-text-muted mb-6">
          The Settings panel's Danger Zone exposes three destructive actions. Each one removes data permanently; there
          is no undo and no remote backup.
        </p>
        <dl>
          <div>
            <dt class="nc-text-sm nc-font-semibold">
              Clear mirror data
            </dt>
            <dd class="nc-text-sm nc-text-secondary mb-2">
              Wipes the <code class="nc-code">persona</code> and <code class="nc-code">interview</code> stores. Your
              provider settings and API key are kept.
            </dd>
          </div>
          <div>
            <dt class="nc-text-sm nc-font-semibold">
              Clear AI provider
            </dt>
            <dd class="nc-text-sm nc-text-secondary mb-2">
              Clears the API key from the app. Your mirror data and interview data are kept.
            </dd>
          </div>
          <div>
            <dt class="nc-text-sm nc-font-semibold">
              Factory reset
            </dt>
            <dd class="nc-text-sm nc-text-secondary">
              Full wipe: all mirror data, interview, and API key data is deleted. The app then reloads to its first-run
              state.
            </dd>
          </div>
        </dl>
      </section>
    </Cell>
    <Cell title="LIMITATIONS" spec="PRV // 0x05">
      <section>
        <header class="flex items-baseline gap-3 mb-3 border-b-[1.5px]">
          <span class="nc-label nc-label--accent">03.</span>
          <h2 class="nc-heading-4 flex-auto">Known limitations</h2>
        </header>
        <p class="nc-text-sm nc-text-secondary">
          <span class="nc-font-semibold">
            Permissive CSP for openai-compatible endpoints.
          </span>
          The Content Security Policy includes a broad <code class="nc-code">https:</code> clause in
          <code class="nc-code">connect-src</code> so any user-supplied endpoint can be reached. A future enhancement
          will narrow this to the exact endpoint configured in Settings.
        </p>
      </section>
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
