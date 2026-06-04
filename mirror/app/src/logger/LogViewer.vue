<script setup lang="ts">
import { ref, computed } from "vue";
import { useLogStore } from "../stores/logStore";
import type { LogLevel } from "./types";

const LEVEL_COLORS: Record<LogLevel, { bg: string; text: string }> = {
  debug: { bg: "var(--nc-line)", text: "var(--nc-ink-3)" },
  info: { bg: "var(--nc-info-subtle)", text: "var(--nc-info)" },
  warn: { bg: "var(--nc-accent-subtle)", text: "var(--nc-accent)" },
  error: { bg: "var(--nc-error-subtle)", text: "var(--nc-error)" },
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatTimeMs(iso: string): string {
  const d = new Date(iso);
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${formatTime(iso)}.${ms}`;
}

const logStore = useLogStore();

const minLevel = ref<LogLevel>("debug");
const search = ref("");
const expandedId = ref<string | null>(null);

const levelIndex = (lvl: LogLevel) => LOG_LEVELS.indexOf(lvl);

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return logStore.entries.filter(
    (e) =>
      levelIndex(e.level) >= levelIndex(minLevel.value) &&
      (q === "" || e.category.toLowerCase().includes(q) || e.message.toLowerCase().includes(q)),
  );
});

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}

function levelButtonLabel(lvl: LogLevel): string {
  return lvl === "debug" ? "All" : lvl === "info" ? "Info+" : lvl === "warn" ? "Warn+" : "Errors";
}
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="logStore.entries.length === 0"
    :style="{
      borderRadius: 'var(--nc-radius-md)',
      border: 'var(--nc-border-width) solid var(--nc-line)',
      backgroundColor: 'var(--nc-panel-2)',
      padding: 'var(--nc-space-6) var(--nc-space-3)',
      textAlign: 'center',
      fontSize: 'var(--nc-text-xs)',
      color: 'var(--nc-ink-3)',
    }"
  >
    No log entries yet. Enable debug logging and use the app to populate the buffer.
  </div>

  <div v-else class="flex flex-col" :style="{ gap: 'var(--nc-space-2)' }">
    <!-- Filters -->
    <div class="flex items-center flex-wrap" :style="{ gap: 'var(--nc-space-2)' }">
      <span
        :style="{ fontSize: '10px', fontWeight: 'var(--nc-font-medium)', letterSpacing: 'var(--nc-track-label)', textTransform: 'uppercase', color: 'var(--nc-ink-3)', marginRight: 'var(--nc-space-1)' }"
      >
        Level
      </span>
      <button
        v-for="lvl in LOG_LEVELS"
        :key="lvl"
        :style="{
          fontSize: '10px',
          fontWeight: 'var(--nc-font-medium)',
          padding: '1px var(--nc-space-2)',
          borderRadius: 'var(--nc-radius-full)',
          backgroundColor: minLevel === lvl ? LEVEL_COLORS[lvl].bg : 'var(--nc-panel-2)',
          color: minLevel === lvl ? LEVEL_COLORS[lvl].text : 'var(--nc-ink-3)',
          border: minLevel === lvl ? '1px solid' : 'none',
          borderColor: minLevel === lvl ? 'var(--nc-accent)' : 'transparent',
          cursor: 'pointer',
          transition: 'color var(--nc-transition-fast), background var(--nc-transition-fast)',
        }"
        @click="minLevel = lvl"
      >
        {{ levelButtonLabel(lvl) }}
      </button>
      <input
        v-model="search"
        type="text"
        placeholder="Filter…"
        class="nc-input nc-input--sm"
        :style="{ marginLeft: 'auto', width: '7rem', fontSize: '11px' }"
      />
    </div>

    <!-- Entry list -->
    <div
      :style="{
        borderRadius: 'var(--nc-radius-md)',
        border: 'var(--nc-border-width) solid var(--nc-line)',
        backgroundColor: 'var(--nc-panel-2)',
        overflow: 'hidden',
        maxHeight: '300px',
        overflowY: 'auto',
      }"
    >
      <div
        v-for="(entry, i) in filtered"
        :key="entry.id"
        :style="i < filtered.length - 1 ? { borderBottom: 'var(--nc-border-width) solid var(--nc-line-subtle)' } : undefined"
      >
        <button
          :style="{
            width: '100%',
            textAlign: 'left',
            padding: 'var(--nc-space-1) var(--nc-space-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--nc-space-2)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
          }"
          @click="toggle(entry.id)"
        >
          <!-- Timestamp -->
          <span
            :style="{ fontSize: '10px', fontFamily: 'var(--nc-font-mono)', color: 'var(--nc-ink-3)', width: '7.5rem', flexShrink: 0 }"
          >
            {{ formatTimeMs(entry.timestamp) }}
          </span>

          <!-- Level badge -->
          <span
            :style="{
              fontSize: '9px',
              fontWeight: 'var(--nc-font-semibold)',
              padding: '1px var(--nc-space-1)',
              borderRadius: 'var(--nc-radius-full)',
              textTransform: 'uppercase',
              width: '2.5rem',
              textAlign: 'center',
              flexShrink: 0,
              backgroundColor: LEVEL_COLORS[entry.level].bg,
              color: LEVEL_COLORS[entry.level].text,
            }"
          >
            {{ LEVEL_LABELS[entry.level] }}
          </span>

          <!-- Category badge -->
          <span
            :style="{
              fontSize: '9px',
              padding: '1px var(--nc-space-1)',
              borderRadius: 'var(--nc-radius-full)',
              textTransform: 'uppercase',
              flexShrink: 0,
              backgroundColor: 'var(--nc-panel-3)',
              color: 'var(--nc-ink-2)',
            }"
          >
            {{ entry.category }}
          </span>

          <!-- Message -->
          <span
            :style="{ fontSize: '11px', fontFamily: 'var(--nc-font-mono)', color: 'var(--nc-ink-2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }"
          >
            {{ entry.message }}
          </span>

          <!-- Expand chevron -->
          <span :style="{ fontSize: '9px', color: 'var(--nc-ink-3)', flexShrink: 0 }">
            {{ expandedId === entry.id ? "▲" : "▼" }}
          </span>
        </button>

        <!-- Expanded detail -->
        <div v-if="expandedId === entry.id" :style="{ padding: '0 var(--nc-space-2) var(--nc-space-2)' }">
          <div v-if="entry.data !== undefined" :style="{ marginBottom: 'var(--nc-space-2)' }">
            <p
              :style="{ fontSize: '9px', fontWeight: 'var(--nc-font-semibold)', textTransform: 'uppercase', color: 'var(--nc-ink-3)', marginBottom: '2px' }"
            >
              Data
            </p>
            <pre
              :style="{
                fontSize: '10px',
                fontFamily: 'var(--nc-font-mono)',
                color: 'var(--nc-ink-2)',
                backgroundColor: 'var(--nc-inset)',
                borderRadius: 'var(--nc-radius-sm)',
                padding: 'var(--nc-space-2)',
                overflowX: 'auto',
                maxHeight: '150px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
              }"
              >{{ JSON.stringify(entry.data, null, 2) }}</pre
            >
          </div>
          <div v-if="entry.stack">
            <p
              :style="{ fontSize: '9px', fontWeight: 'var(--nc-font-semibold)', textTransform: 'uppercase', color: 'var(--nc-ink-3)', marginBottom: '2px' }"
            >
              Stack
            </p>
            <pre
              :style="{
                fontSize: '9px',
                fontFamily: 'var(--nc-font-mono)',
                color: 'var(--nc-ink-3)',
                backgroundColor: 'var(--nc-inset)',
                borderRadius: 'var(--nc-radius-sm)',
                padding: 'var(--nc-space-2)',
                overflowX: 'auto',
                maxHeight: '120px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
              }"
              >{{ entry.stack }}</pre
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <p :style="{ fontSize: '10px', color: 'var(--nc-ink-3)', textAlign: 'right' }">
      Showing {{ filtered.length }} of {{ logStore.entries.length }} entries
      <span v-if="logStore.entries.length >= logStore.maxEntries" :style="{ color: 'var(--nc-accent)', marginLeft: 'var(--nc-space-1)' }"
        >(buffer full)</span
      >
    </p>
  </div>
</template>
