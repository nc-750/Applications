import { fileURLToPath, URL } from "node:url";
import { copyFileSync } from "node:fs";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Inline plugin: copy the vendored flat stylesheet verbatim into dist/.
// No component imports style.css, so the library build itself emits zero CSS.
const copyStyle = () => ({
  name: "enclosure-copy-style",
  closeBundle() {
    copyFileSync(
      fileURLToPath(new URL("./src/style.css", import.meta.url)),
      fileURLToPath(new URL("./dist/style.css", import.meta.url)),
    );
  },
});

export default defineConfig({
  plugins: [vue(), copyStyle()],
  build: {
    // vue-tsc emits .d.ts into dist/ before `vite build` runs; don't wipe them.
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "EnclosureVue",
      fileName: "enclosure-vue",
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
