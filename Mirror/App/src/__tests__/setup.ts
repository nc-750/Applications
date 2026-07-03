import "fake-indexeddb/auto";
import { beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";

// Satisfy the lab-vue guard (probes the --nc-lab:750 sentinel that lab.css
// sets). Tests don't load lab.css, so set it here or lab-vue fails loud.
if (typeof document !== "undefined") {
  document.documentElement.style.setProperty("--nc-lab", "750");
}

// jsdom does not implement matchMedia; several stores read prefers-color-scheme.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// Every test gets a fresh Pinia so stores start from their initial state.
beforeEach(() => {
  setActivePinia(createPinia());
});

// Silence Tauri invoke warnings in the test environment — individual tests
// configure specific mock return values via vi.mocked(invoke).
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));

// IDB factory modules export a singleton connection; reset the module graph
// between tests so each test gets a fresh in-memory database.
afterEach(async () => {
  // Close any open IndexedDB connection so deleteDatabase won't be blocked.
  const { closeDB, DB_NAME } = await import("../db");
  closeDB();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("deleteDatabase failed"));
    req.onblocked = () => {
      // If blocked, force-close and retry once.
      closeDB();
      const retry = indexedDB.deleteDatabase(DB_NAME);
      retry.onsuccess = () => resolve();
      retry.onerror = () => reject(retry.error ?? new Error("deleteDatabase failed"));
    };
  });
});
