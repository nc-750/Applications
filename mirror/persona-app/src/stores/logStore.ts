import { defineStore } from "pinia";
import { ref } from "vue";
import type { LogEntry } from "../logger/types";

export const useLogStore = defineStore("log", () => {
  const entries = ref<LogEntry[]>([]);
  const debugEnabled = ref(false);
  const maxEntries = ref(500);

  function append(entry: LogEntry) {
    const next = entries.value.length >= maxEntries.value
      ? [...entries.value.slice(1), entry]
      : [...entries.value, entry];
    entries.value = next;
  }

  function clear() {
    entries.value = [];
  }

  function setDebugEnabled(enabled: boolean) {
    debugEnabled.value = enabled;
  }

  function setMaxEntries(max: number) {
    // Trim if shrinking below current count
    if (entries.value.length > max) {
      entries.value = entries.value.slice(entries.value.length - max);
    }
    maxEntries.value = max;
  }

  return { entries, debugEnabled, maxEntries, append, clear, setDebugEnabled, setMaxEntries };
});
