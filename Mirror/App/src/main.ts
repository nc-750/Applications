import { createApp } from "vue";
import { createPinia } from "pinia";
import { Lab } from "@nc-750/lab-vue";
import { logger } from "./logger";

import "./styles/app.css";

import App from "./App.vue";
import Router from "./router";

// Capture unhandled errors and rejections into the debug log
window.addEventListener("error", (event) => {
  logger.error("system", "Unhandled error", {
    data: {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    },
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
createApp(App).use(createPinia()).use(Router).use(Lab).mount("#root");
