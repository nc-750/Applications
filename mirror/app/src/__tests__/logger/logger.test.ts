import { describe, it, expect, beforeEach } from "vitest";
import { logger, setDebugEnabled } from "../../logger/logger";
import { useMirrorStore } from "../../stores/mirror";

// ── Helpers ─────────────────────────────────────────────────────────────────

function resetLogStore() {
  const store = useMirrorStore();
  store.clearLogs();
  store.setDebugEnabled(false);
  store.setMaxEntries(500);
}

// ── API Key Redaction ──────────────────────────────────────────────────────

describe("logger — API key redaction", () => {
  beforeEach(() => {
    resetLogStore();
    useMirrorStore().setDebugEnabled(true);
  });

  it("redacts sk-* keys in log messages", () => {
    logger.info("llm", "Using key sk-proj-abcdefghijklmnopqrstuvwxyz123456");
    const entries = useMirrorStore().logEntries;
    expect(entries.length).toBe(1);
    expect(entries[0].message).not.toContain("sk-proj-");
    expect(entries[0].message).toContain("[REDACTED]");
  });

  it("redacts sk-ant-* keys in log messages", () => {
    logger.info("llm", "Using key sk-ant-admin-abcdefghijklmnopqrst123456");
    const entries = useMirrorStore().logEntries;
    expect(entries.length).toBe(1);
    expect(entries[0].message).not.toContain("sk-ant-");
    expect(entries[0].message).toContain("[REDACTED]");
  });

  it("redacts keys inside the data object", () => {
    logger.info("llm", "API call", {
      data: { apiKey: "sk-verysecretkey123456789012345" },
    });
    const entries = useMirrorStore().logEntries;
    expect(entries.length).toBe(1);
    const data = entries[0].data as Record<string, unknown> | undefined;
    expect(data).toBeDefined();
    expect(JSON.stringify(data)).not.toContain("sk-verysecretkey");
    expect(JSON.stringify(data)).toContain("[REDACTED]");
  });

  it("redacts keys nested inside arrays in data", () => {
    logger.info("llm", "Batch call", {
      data: { keys: ["sk-key12345678901234567890", "normal-text"] },
    });
    const entries = useMirrorStore().logEntries;
    expect(entries.length).toBe(1);
    const data = entries[0].data as Record<string, unknown> | undefined;
    const keys = (data as any)?.keys;
    expect(keys[0]).toBe("[REDACTED]");
    expect(keys[1]).toBe("normal-text");
  });

  it("does not redact non-key strings", () => {
    logger.info("app", "Mirror saved successfully");
    const entries = useMirrorStore().logEntries;
    expect(entries[0].message).toBe("Mirror saved successfully");
  });

  it("redacts deeply nested key in object", () => {
    logger.info("settings", "Config", {
      data: { config: { credentials: { token: "sk-api12345678901234567890" } } },
    });
    const entries = useMirrorStore().logEntries;
    const str = JSON.stringify(entries[0].data);
    expect(str).not.toContain("sk-api");
    expect(str).toContain("[REDACTED]");
  });
});

// ── Debug Filter ────────────────────────────────────────────────────────────

describe("logger — debug filter", () => {
  beforeEach(() => {
    resetLogStore();
  });

  it("does not push debug entries when debugEnabled is false", () => {
    useMirrorStore().setDebugEnabled(false);
    logger.debug("llm", "This is a debug message");
    const entries = useMirrorStore().logEntries;
    expect(entries.length).toBe(0);
  });

  it("pushes debug entries when debugEnabled is true", () => {
    useMirrorStore().setDebugEnabled(true);
    logger.debug("llm", "This is a debug message");
    const entries = useMirrorStore().logEntries;
    expect(entries.length).toBe(1);
    expect(entries[0].level).toBe("debug");
  });

  it("always pushes info entries regardless of debugEnabled", () => {
    useMirrorStore().setDebugEnabled(false);
    logger.info("app", "Info message");
    expect(useMirrorStore().logEntries.length).toBe(1);
  });

  it("always pushes warn entries regardless of debugEnabled", () => {
    useMirrorStore().setDebugEnabled(false);
    logger.warn("app", "Warning message");
    expect(useMirrorStore().logEntries.length).toBe(1);
  });

  it("always pushes error entries regardless of debugEnabled", () => {
    useMirrorStore().setDebugEnabled(false);
    logger.error("app", "Error message", { error: new Error("test") });
    expect(useMirrorStore().logEntries.length).toBe(1);
  });

  it("setDebugEnabled toggles the store flag", () => {
    setDebugEnabled(true);
    expect(useMirrorStore().debugEnabled).toBe(true);
    setDebugEnabled(false);
    expect(useMirrorStore().debugEnabled).toBe(false);
  });
});

// ── Log Entry Shape ────────────────────────────────────────────────────────

describe("logger — entry shape", () => {
  beforeEach(() => {
    resetLogStore();
  });

  it("produces entries with id, timestamp, level, category, message", () => {
    logger.info("app", "Test message");
    const entries = useMirrorStore().logEntries;
    expect(entries.length).toBe(1);
    const entry = entries[0];
    expect(entry.id).toBeDefined();
    expect(typeof entry.id).toBe("string");
    expect(entry.timestamp).toBeDefined();
    expect(entry.level).toBe("info");
    expect(entry.category).toBe("app");
    expect(entry.message).toBe("Test message");
  });

  it("includes data when provided", () => {
    logger.info("app", "With data", { data: { count: 42 } });
    const entry = useMirrorStore().logEntries[0];
    expect(entry.data).toEqual({ count: 42 });
  });

  it("includes stack trace for errors", () => {
    const err = new Error("Something went wrong");
    logger.error("system", "System error", { error: err });
    const entry = useMirrorStore().logEntries[0];
    expect(entry.stack).toBeDefined();
    expect(entry.stack).toContain("Error: Something went wrong");
  });

  it("timestamp is ISO 8601 format", () => {
    logger.info("app", "Timestamp test");
    const entry = useMirrorStore().logEntries[0];
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(entry.timestamp).toMatch(isoRegex);
  });
});

// ── Ring Buffer Behavior ───────────────────────────────────────────────────

describe("logger — ring buffer", () => {
  beforeEach(() => {
    resetLogStore();
  });

  it("appends entries to the store", () => {
    logger.info("app", "First");
    logger.info("app", "Second");
    expect(useMirrorStore().logEntries.length).toBe(2);
  });

  it("shifts old entries when exceeding maxEntries", () => {
    useMirrorStore().setMaxEntries(3);
    logger.info("app", "One");
    logger.info("app", "Two");
    logger.info("app", "Three");
    logger.info("app", "Four"); // should kick out "One"
    const entries = useMirrorStore().logEntries;
    expect(entries.length).toBe(3);
    expect(entries[0].message).toBe("Two");
    expect(entries[2].message).toBe("Four");
  });

  it("clears all entries on clearLogs()", () => {
    logger.info("app", "One");
    logger.info("app", "Two");
    useMirrorStore().clearLogs();
    expect(useMirrorStore().logEntries.length).toBe(0);
  });
});

// ── Convenience methods ────────────────────────────────────────────────────

describe("logger — convenience methods", () => {
  beforeEach(() => {
    resetLogStore();
  });

  it("logger.debug writes at debug level", () => {
    useMirrorStore().setDebugEnabled(true);
    logger.debug("llm", "Debug test");
    const entry = useMirrorStore().logEntries[0];
    expect(entry.level).toBe("debug");
    expect(entry.category).toBe("llm");
  });

  it("logger.info writes at info level", () => {
    logger.info("store", "Info test");
    expect(useMirrorStore().logEntries[0].level).toBe("info");
  });

  it("logger.warn writes at warn level", () => {
    logger.warn("synthesis", "Warn test");
    expect(useMirrorStore().logEntries[0].level).toBe("warn");
  });

  it("logger.error writes at error level", () => {
    logger.error("system", "Error test", { error: new Error("fail") });
    expect(useMirrorStore().logEntries[0].level).toBe("error");
  });
});
