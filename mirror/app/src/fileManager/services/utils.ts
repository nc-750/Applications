import { logger } from "../../logger";

/** Join class names, filtering out falsy values */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Download a string as a file */
export function downloadFile(content: string, filename: string, mimeType = "text/plain"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Read a text file from an <input type="file"> change event */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Open an external URL in the user's default browser.
 * - In Tauri: delegates to `@tauri-apps/plugin-opener` so the OS browser opens
 *   instead of navigating the WebView itself.
 * - In PWA: falls back to `window.open` with `noopener,noreferrer`.
 */
export async function openExternal(url: string): Promise<void> {
  const isTauri =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  if (isTauri) {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return;
    } catch (e) {
      logger.warn("app", "openExternal: Tauri opener failed, falling back", { error: e instanceof Error ? e : undefined });
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
