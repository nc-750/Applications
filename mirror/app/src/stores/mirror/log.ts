import { ref } from "vue";
import type { LogEntry } from "../../logger/types";

export function useLogModule() {
  const logEntries = ref<LogEntry[]>([]);
  
  // TODO: Switch to false in production
  const debugEnabled = ref(true);
  const logMaxEntries = ref(500);

  function appendLog(entry: LogEntry) {
    const next = logEntries.value.length >= logMaxEntries.value
      ? [...logEntries.value.slice(1), entry]
      : [...logEntries.value, entry];
    logEntries.value = next;
  }

  function clearLogs() {
    logEntries.value = [];
  }

  function setDebugEnabled(enabled: boolean) {
    debugEnabled.value = enabled;
  }

  function setMaxEntries(max: number) {
    // Trim if shrinking below current count
    if (logEntries.value.length > max) {
      logEntries.value = logEntries.value.slice(logEntries.value.length - max);
    }
    logMaxEntries.value = max;
  }

  return {
    logEntries,
    debugEnabled,
    logMaxEntries,
    appendLog,
    clearLogs,
    setDebugEnabled,
    setMaxEntries,
  };
}
