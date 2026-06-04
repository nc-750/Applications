import { describe, it, expect } from "vitest";
import { useLogStore } from "../../stores/logStore";

describe("logStore", () => {
  describe("append", () => {
    it("adds entries to the store", () => {
      useLogStore().append({
        id: "1",
        timestamp: "2026-01-01T00:00:00.000Z",
        level: "info",
        category: "app",
        message: "Test",
      });
      expect(useLogStore().entries).toHaveLength(1);
    });

    it("shifts oldest entry when exceeding maxEntries", () => {
      useLogStore().$patch({ maxEntries: 3 });

      for (let i = 1; i <= 4; i++) {
        useLogStore().append({
          id: String(i),
          timestamp: new Date().toISOString(),
          level: "info",
          category: "app",
          message: `Entry ${i}`,
        });
      }

      const entries = useLogStore().entries;
      expect(entries).toHaveLength(3);
      expect(entries[0].message).toBe("Entry 2");
      expect(entries[2].message).toBe("Entry 4");
    });
  });

  describe("clear", () => {
    it("removes all entries", () => {
      useLogStore().append({
        id: "1",
        timestamp: "2026-01-01T00:00:00.000Z",
        level: "info",
        category: "app",
        message: "Test",
      });
      expect(useLogStore().entries).toHaveLength(1);

      useLogStore().clear();
      expect(useLogStore().entries).toHaveLength(0);
    });
  });

  describe("setDebugEnabled", () => {
    it("toggles the debug flag", () => {
      expect(useLogStore().debugEnabled).toBe(false);
      useLogStore().setDebugEnabled(true);
      expect(useLogStore().debugEnabled).toBe(true);
    });
  });

  describe("setMaxEntries", () => {
    it("updates the max and trims if shrinking", () => {
      useLogStore().$patch({ maxEntries: 5 });

      for (let i = 1; i <= 5; i++) {
        useLogStore().append({
          id: String(i),
          timestamp: new Date().toISOString(),
          level: "info",
          category: "app",
          message: `Entry ${i}`,
        });
      }

      // Shrink to 3
      useLogStore().setMaxEntries(3);
      expect(useLogStore().maxEntries).toBe(3);
      expect(useLogStore().entries).toHaveLength(3);
      expect(useLogStore().entries[0].message).toBe("Entry 3");
    });

    it("updates max without trimming when expanding", () => {
      useLogStore().append({
        id: "1",
        timestamp: new Date().toISOString(),
        level: "info",
        category: "app",
        message: "Test",
      });

      useLogStore().setMaxEntries(1000);
      expect(useLogStore().maxEntries).toBe(1000);
      expect(useLogStore().entries).toHaveLength(1);
    });

    it("no-ops when shrinking below 0 entries", () => {
      useLogStore().setMaxEntries(3);
      expect(useLogStore().maxEntries).toBe(3);
      expect(useLogStore().entries).toHaveLength(0);
    });
  });
});
