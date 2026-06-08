// Sync data-theme before first paint (lab.css uses [data-theme="dark"]).
// Respects a manual override stored in localStorage ("system" | "light" | "dark");
// falls back to OS preference when absent or set to "system".
(function () {
  var STORAGE_KEY = "mirror-theme";
  // Clean up old theme key from v0.1.0
  localStorage.removeItem("persona-theme");
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var apply = function () {
    var stored = localStorage.getItem(STORAGE_KEY) || "system";
    var effective = stored === "system" ? (mq.matches ? "dark" : "light") : stored;
    document.documentElement.setAttribute("data-theme", effective);
  };
  apply();
  mq.addEventListener("change", function () {
    // Re-read in case another tab changed the preference
    apply();
  });
  // Listen for storage events from other tabs
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) apply();
  });
})();

import { createApp } from "vue";
import { createPinia } from "pinia";
import { Lab } from "lab-vue";
import App from "./App.vue";
// Lab design system first (tokens + components + fonts + reset), then the app's
// own stylesheet (Tailwind layout utilities + component inner-layouts).
import "./styles/lab.css";
import "./styles/app.css";
import { logger } from "./logger";

// Capture unhandled errors and rejections into the debug log
window.addEventListener("error", (event) => {
  logger.error("system", "Unhandled error", {
    data: { message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno },
    error: event.error,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  logger.error("system", "Unhandled promise rejection", {
    data: { reason: String(event.reason) },
    error: event.reason instanceof Error ? event.reason : undefined,
  });
});

// Lab plugin runs the fail-loud guard (probes the --nc-lab:750 sentinel that
// lab.css sets) after first paint.
createApp(App).use(createPinia()).use(Lab).mount("#root");
