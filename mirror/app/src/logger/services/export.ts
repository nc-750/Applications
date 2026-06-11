import { downloadFile } from "../../fileManager/services/utils";
import { useAppStore } from "../../AppStore";

export function exportDebugLog(): void {
  const { logEntries: entries } = useAppStore().logger;

  const envelope = {
    exportedAt: new Date().toISOString(),
    appVersion: "0.1.0",
    entryCount: entries.length,
    entries,
  };

  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  downloadFile(
    JSON.stringify(envelope, null, 2),
    `persona-debug-log-${date}.json`,
    "application/json",
  );
}
