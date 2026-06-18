// Post-build step for GitHub Pages.
//
// GitHub Pages has no server-side rewrite rules, so a cold deep-link or a
// hard refresh on a client-side route (e.g. /settings) returns a 404. The
// standard SPA fix is to ship a 404.html that is identical to index.html;
// Pages serves it for any unknown path, the app boots, and vue-router takes
// over. After the service worker installs, navigation is client-side anyway.
//
// Run with bun: `bun run scripts/pages-postbuild.mjs` (wired into build:pages).

import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dist = join(import.meta.dirname, "..", "dist");
const index = join(dist, "index.html");
const fallback = join(dist, "404.html");

if (!existsSync(index)) {
  console.error(`[pages-postbuild] ${index} not found — run the build first.`);
  process.exit(1);
}

copyFileSync(index, fallback);
console.log("[pages-postbuild] wrote dist/404.html (SPA fallback for GitHub Pages)");
