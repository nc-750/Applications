import { ref, readonly } from "vue";
import type { LogLevel, LogCategory, LogEntry } from "../models/types";

// ── Module-level reactive state (CONVENTIONS 5.3) ──────────────────────

const entries = ref<LogEntry[]>([]);
const debugEnabled = ref(false); // matches CONVENTIONS example + resolves TODO
const logMaxEntries = ref(500);

export const logEntries = readonly(entries);
export const maxEntries = readonly(logMaxEntries);

// ── Mutators ───────────────────────────────────────────────────────────

export function clearLogs(): void {
  entries.value = [];
}

export function setMaxEntries(max: number): void {
  if (entries.value.length > max) {
    entries.value = entries.value.slice(entries.value.length - max);
  }
  logMaxEntries.value = max;
}

export function setDebugEnabled(enabled: boolean): void {
  debugEnabled.value = enabled;
}

// ── API key sanitization ───────────────────────────────────────────────

/** Patterns that look like API keys — redacted before storage or console output. */
const KEY_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{20,}/g, // OpenAI / Anthropic / Mistral
  /sk-ant-[a-zA-Z0-9_-]{20,}/g, // Anthropic admin keys
];

function redactKeys(value: unknown): unknown {
  if (typeof value === "string") {
    let s = value;
    for (const re of KEY_PATTERNS) {
      s = s.replace(re, "[REDACTED]");
    }
    return s;
  }
  if (Array.isArray(value)) return value.map(redactKeys);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactKeys(v);
    }
    return out;
  }
  return value;
}

// ── Core log function ──────────────────────────────────────────────────

function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  opts?: { data?: unknown; error?: Error },
): void {
  // Debug-level entries are skipped entirely when the toggle is off
  if (level === "debug" && !debugEnabled.value) return;

  const entry: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message: redactKeys(message) as string,
    data: opts?.data !== undefined ? redactKeys(opts.data) : undefined,
    stack: opts?.error?.stack,
  };

  // Mirror to native console for DevTools
  const consoleMsg = `[${category}] ${entry.message}`;
  const consoleData = entry.data !== undefined ? entry.data : undefined;
  const consoleErr = opts?.error;
  switch (level) {
    case "debug":
      console.debug(consoleMsg, consoleData);
      break;
    case "info":
      console.info(consoleMsg, consoleData ?? "");
      break;
    case "warn":
      console.warn(consoleMsg, consoleData ?? "", consoleErr ?? "");
      break;
    case "error":
      console.error(consoleMsg, consoleData ?? "", consoleErr ?? "");
      break;
  }

  // Push to in-memory ring buffer
  if (entries.value.length >= logMaxEntries.value) {
    entries.value = [...entries.value.slice(1), entry];
  } else {
    entries.value = [...entries.value, entry];
  }
}

// ── Convenience logger object ──────────────────────────────────────────

export const logger = {
  debug: (category: LogCategory, message: string, opts?: { data?: unknown }) =>
    log("debug", category, message, opts),
  info: (category: LogCategory, message: string, opts?: { data?: unknown }) =>
    log("info", category, message, opts),
  warn: (category: LogCategory, message: string, opts?: { data?: unknown; error?: Error }) =>
    log("warn", category, message, opts),
  error: (category: LogCategory, message: string, opts?: { data?: unknown; error?: Error }) =>
    log("error", category, message, opts),
};
