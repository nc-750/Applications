<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper num="10" title="Chat" partno="COM-MSG"
        desc="Diegetic message bubbles as flush plates — distinguished by background tint + edge accent bars, never box shadows. Transcript is a sunken channel; composer is a recessed workspace.">
        <span class="nc-label block mb-3">Transcript · message variants · composer</span>
        <div class="nc-transcript" style="max-height: 520px;">

            <!-- Assistant: welcome / introduction -->
            <div class="nc-message nc-message--assistant">
                <div class="nc-message__header">
                    <span class="nc-avatar nc-avatar--sm">E</span>
                    <span class="nc-message__name">Enclosure AI</span>
                    <span class="nc-message__time">14:32</span>
                </div>
                <div class="nc-message__body">
                    <p>Welcome to the <strong>Enclosure Design System</strong>. I'm here to help you build interfaces that feel industrial, precise, and tactile — panels separated by seams instead of shadows, monochrome with a single accent, everything flush and integrated.</p>
                    <p>Ask me anything about the <code>--nc-*</code> token architecture, component patterns, or the layout grid.</p>
                </div>
            </div>

            <!-- User: first question -->
            <div class="nc-message nc-message--user">
                <div class="nc-message__header">
                    <span class="nc-avatar nc-avatar--sm">D</span>
                    <span class="nc-message__name">dev</span>
                    <span class="nc-message__time">14:33</span>
                </div>
                <div class="nc-message__body">
                    <p>How does the two-layer component architecture work? I see you have both raw CSS classes and Vue components.</p>
                </div>
            </div>

            <!-- Assistant: thinking block + rich response -->
            <div class="nc-message nc-message--assistant">
                <div class="nc-message__header">
                    <span class="nc-avatar nc-avatar--sm">E</span>
                    <span class="nc-message__name">Enclosure AI</span>
                    <span class="nc-message__time">14:33</span>
                </div>
                <div class="nc-thinking nc-thinking--open">
                    <div class="nc-thinking__header" tabindex="0" role="button" aria-expanded="true">
                        <span class="nc-thinking__label">Reasoning · 2 steps</span>
                        <span class="nc-thinking__toggle">▾</span>
                    </div>
                    <div class="nc-thinking__body">
                        <p>The user is asking about the architecture split between <code>generator-app/css/</code> (canonical CSS source) and <code>enclosure-vue/</code> (Vue 3 facade library). I should explain the design-token pipeline: seeds → tokens → component classes → Vue props that compute class strings. The key insight is that Vue components own zero CSS themselves — they only emit class strings.</p>
                    </div>
                </div>
                <div class="nc-message__body">
                    <p>Good question. The architecture has <strong>two layers</strong> with a strict separation of concerns:</p>
                    <ul>
                        <li><strong>Canonical CSS</strong> (<code>generator-app/css/</code>) — all <code>.nc-*</code> classes defined with custom properties, zero hardcoded colors</li>
                        <li><strong>Vue Facade</strong> (<code>enclosure-vue/</code>) — typed props compute class strings; components have no <code>&lt;style&gt;</code> blocks</li>
                    </ul>
                    <p>This means you can use the design system with <strong>any</strong> framework — just ship the CSS and apply the classes. The Vue layer is a convenience, not a requirement.</p>
                </div>
            </div>

            <!-- System message -->
            <div class="nc-message nc-message--system">
                Model context updated — switched to <strong>Opus 4.8</strong> · 128k tokens available
            </div>

            <!-- User: code request -->
            <div class="nc-message nc-message--user">
                <div class="nc-message__header">
                    <span class="nc-avatar nc-avatar--sm">D</span>
                    <span class="nc-message__name">dev</span>
                    <span class="nc-message__time">14:35</span>
                </div>
                <div class="nc-message__body">
                    <p>Show me how to theme a button using the seed values.</p>
                </div>
            </div>

            <!-- Assistant: code block + actions -->
            <div class="nc-message nc-message--assistant">
                <div class="nc-message__header">
                    <span class="nc-avatar nc-avatar--sm">E</span>
                    <span class="nc-message__name">Enclosure AI</span>
                    <span class="nc-message__time">14:35</span>
                </div>
                <div class="nc-message__body">
                    <p>The 6 seed channels define the entire palette. Change these and every component re-themes automatically:</p>
                    <pre><code>/* enclosure.seeds.css — the 6 knobs */
--nc-seed-h: 210;
--nc-seed-s: 12%;
--nc-seed-l: 15%;
--nc-accent-h: 24;
--nc-accent-s: 85%;
--nc-accent-l: 55%;

/* Button surfaces derive from seeds via calc() */
/* .nc-btn uses var(--nc-panel) which chains to seeds */</code></pre>
                    <p>All <strong>370+ token values</strong> derive from these 6 numbers. Swap them and the entire system shifts — buttons, panels, typography, everything — while maintaining <strong>WCAG AA</strong> contrast ratios.</p>
                </div>
                <div class="nc-message__actions">
                    <button class="nc-btn nc-btn--ghost nc-btn--sm">Copy</button>
                    <button class="nc-btn nc-btn--ghost nc-btn--sm">Edit</button>
                    <button class="nc-btn nc-btn--ghost nc-btn--sm">Save</button>
                </div>
            </div>

            <!-- Error message -->
            <div class="nc-message nc-message--assistant nc-message--error">
                <div class="nc-message__header">
                    <span class="nc-avatar nc-avatar--sm">S</span>
                    <span class="nc-message__name">System</span>
                    <span class="nc-message__time">14:36</span>
                </div>
                <div class="nc-message__body">
                    <p><strong>Connection interrupted.</strong> The streaming endpoint returned a 503. Retrying with exponential backoff — attempt 2 of 5 in <strong>3 seconds</strong>.</p>
                </div>
            </div>

            <!-- Typing indicator -->
            <div class="nc-message nc-message--assistant">
                <div class="nc-message__header">
                    <span class="nc-avatar nc-avatar--sm">E</span>
                    <span class="nc-message__name">Enclosure AI</span>
                </div>
                <div class="nc-typing">
                    <span class="nc-typing__dots">
                        <span class="nc-typing__dot"></span>
                        <span class="nc-typing__dot"></span>
                        <span class="nc-typing__dot"></span>
                    </span>
                    <span class="nc-typing__label">Assistant is typing…</span>
                </div>
            </div>

        </div>

        <hr class="nc-divider" />

        <!-- Composer -->
        <span class="nc-label block mb-3">Composer</span>
        <div class="nc-composer">
            <textarea
                class="nc-composer__input"
                placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                rows="2"
                readonly
            ></textarea>
            <div class="nc-composer__actions">
                <button class="nc-btn nc-btn--ghost nc-btn--sm" disabled>Attach</button>
                <button class="nc-btn nc-btn--primary nc-btn--sm nc-composer__send" disabled>Send</button>
            </div>
        </div>
    </SectionWrapper>
</template>
