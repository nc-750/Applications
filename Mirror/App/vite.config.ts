import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { readFileSync } from 'fs';

const host = process.env.TAURI_DEV_HOST;
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig(async () => ({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/favicon.ico", "icons/apple-touch-icon-180x180.png"],
      manifest: {
        name: "Mirror",
        short_name: "Mirror",
        description:
          "Mirror interviews you with AI, finds patterns you missed, and produces a private insight document and a polished public profile. Nothing leaves your device.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "icons/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  clearScreen: false,
  server: {
    port: 1421,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Point at live source so rebuilding lab/* is instantly picked up.
      "@nc-750/lab-vue": path.resolve(__dirname, "../../lab/vue/dist/lab-vue.js"),
      "@nc-750/lab-css": path.resolve(__dirname, "../../lab/css/lab.css"),
    }
  }
}));
