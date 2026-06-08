import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// lab-vue ships NO CSS: components emit class strings only, and the consumer
// imports the Lab stylesheet (lab.css) separately. The library build emits
// zero CSS, and the runtime guard (src/guard.ts) verifies lab.css is loaded.

export default defineConfig({
  plugins: [vue()],
  build: {
    // vue-tsc emits .d.ts into dist/ before `vite build` runs; don't wipe them.
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "LabVue",
      fileName: "lab-vue",
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: { vue: "Vue" },
      },
    },
  },
});
