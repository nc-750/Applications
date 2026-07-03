import { describe, it, expect } from "vitest";
import { getDB, wipeDatabase, DB_NAME, DB_VERSION, STORES } from "../../db";

describe("db/Database", () => {
    it("opens the database at the declared version with the registered object stores", async () => {
        const db = await getDB();

        expect(db.version).toBe(DB_VERSION);
        expect([...db.objectStoreNames].sort()).toEqual(
            [STORES.settings, STORES.persona, STORES.interview].sort(),
        );
    });

    it("round-trips a record through an object store", async () => {
        const db = await getDB();
        const record = { id: "default", status: "active" };

        await db.put("interview", record);

        expect(await db.get("interview", "default")).toEqual(record);
    });

    it("wipeDatabase drops the entire database", async () => {
        await getDB();

        await wipeDatabase();

        const databases = await indexedDB.databases();
        expect(databases.find((d) => d.name === DB_NAME)).toBeUndefined();
    });
});
