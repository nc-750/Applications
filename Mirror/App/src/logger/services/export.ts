import { downloadFile } from "../../fileManager/services/utils";
import { logEntries } from "./logger";

export function exportDebugLog(): void {
    const envelope = {
        exportedAt: new Date().toISOString(),
        appVersion: "0.1.0",
        entryCount: logEntries.value.length,
        entries: logEntries.value,
    };

    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    downloadFile(
        JSON.stringify(envelope, null, 2),
        `persona-debug-log-${date}.json`,
        "application/json",
    );
}
