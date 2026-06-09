import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMirrorStore } from "../../stores/mirror";
import type { LogEntry } from "../../logger/types";

// Mock keyStore
vi.mock("../../lib/keyStore", () => ({
  loadApiKey: vi.fn().mockResolvedValue(null),
  saveApiKey: vi.fn(),
  clearApiKey: vi.fn(),
  isTauri: () => false,
}));

function makeEntry(message: string): LogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level: "info",
    category: "app",
    message,
  };
}

describe("mirrorStore log", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useMirrorStore().clearLogs();
  });

  describe("appendLog", () => {
    it("adds entries in order", () => {
      const store = useMirrorStore();
      store.appendLog(makeEntry("First"));
      store.appendLog(makeEntry("Second"));
      store.appendLog(makeEntry("Third"));

      expect(store.logEntries.length).toBe(3);
      expect(store.logEntries[0].message).toBe("First");
      expect(store.logEntries[2].message).toBe("Third");
    });

    it("drops oldest entries when buffer exceeds maxEntries", () => {
      const store = useMirrorStore();
      store.setMaxEntries(3);

      store.appendLog(makeEntry("A"));
      store.appendLog(makeEntry("B"));
      store.appendLog(makeEntry("C"));
      store.appendLog(makeEntry("D")); // kicks out "A"
      store.appendLog(makeEntry("E")); // kicks out "B"

      expect(store.logEntries.length).toBe(3);
      expect(store.logEntries[0].message).toBe("C");
      expect(store.logEntries[1].message).toBe("D");
      expect(store.logEntries[2].message).toBe("E");
    });
  });

  describe("clearLogs", () => {
    it("empties the buffer", () => {
      const store = useMirrorStore();
      store.appendLog(makeEntry("A"));
      store.appendLog(makeEntry("B"));
      expect(store.logEntries.length).toBe(2);

      store.clearLogs();

      expect(store.logEntries.length).toBe(0);
    });
  });

  describe("setDebugEnabled", () => {
    it("toggles the debug flag", () => {
      const store = useMirrorStore();
      expect(store.debugEnabled).toBe(false);

      store.setDebugEnabled(true);
      expect(store.debugEnabled).toBe(true);

      store.setDebugEnabled(false);
      expect(store.debugEnabled).toBe(false);
    });
  });

  describe("setMaxEntries", () => {
    it("trims oldest entries when shrinking below current count", () => {
      const store = useMirrorStore();
      store.setMaxEntries(10);

      store.appendLog(makeEntry("1"));
      store.appendLog(makeEntry("2"));
      store.appendLog(makeEntry("3"));
      store.appendLog(makeEntry("4"));
      store.appendLog(makeEntry("5"));

      store.setMaxEntries(3);

      expect(store.logEntries.length).toBe(3);
      expect(store.logEntries[0].message).toBe("3");
      expect(store.logEntries[2].message).toBe("5");
    });

    it("keeps all entries when expanding maxEntries", () => {
      const store = useMirrorStore();
      store.setMaxEntries(3);
      store.appendLog(makeEntry("A"));
      store.appendLog(makeEntry("B"));

      store.setMaxEntries(10);

      expect(store.logEntries.length).toBe(2);
      expect(store.logMaxEntries).toBe(10);
    });
  });
});
