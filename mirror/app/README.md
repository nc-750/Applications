# Mirror (NODE-0M)

Mirror interviews you with AI, finds patterns you missed, and produces a private insight
document and a polished public profile. **Nothing leaves your device** except the requests
you send to your own AI provider.

Mirror is part of the [NC-750](../../brand/BRAND.md) universe and is built on the
[Lab design system](../../lab/DESIGN.md). It ships as an installable PWA; a desktop (Tauri)
build exists but is not distributed yet.

## Privacy stance

- **Local-first.** Your personas, interview state, and settings are stored on-device in
  IndexedDB. Mirror has no account and no NC-750 server in the request path.
- **Bring your own key (BYOK).** You supply your own API key for OpenAI, Anthropic,
  Mistral, or any OpenAI-compatible endpoint (Groq, Together, OpenRouter, Ollama, …).
  Content is sent **only** to the provider you configure, for the request you make.
- **Key at rest.** On desktop the key lives in the OS credential store (Windows Credential
  Manager / macOS Keychain / Linux Secret Service); in the PWA it falls back to IndexedDB.
- **You can leave.** The Settings panel offers tiered data wipe — clear your mirror, clear
  your provider settings, or factory-reset everything.

See [`brand/ETHOS.md`](../../brand/ETHOS.md) for the binding privacy constraints this app
satisfies, and the in-app Privacy page for the plain-words disclosure of what is sent where.

## Stack

Vue 3 + TypeScript (`<script setup>`) · Vite 7 · Pinia · vue-router · idb (IndexedDB) ·
Zod (boundary validation) · vite-plugin-pwa · Tauri v2 (desktop, not distributed yet).
UI is `@nc-750/lab-vue` + `@nc-750/lab-css`; Tailwind v4 is used only for app-level layout.

> **Build tool: [bun](https://bun.sh).** Use `bun run …` / `bunx …`, not npm/npx/node.

## Develop

```bash
bun install
bun run dev          # Vite dev server (browser) on http://localhost:1421
bun run tauri dev    # Full Tauri desktop app (optional)
```

Then open **Settings**, pick a provider, paste your API key, choose a model, test the
connection, and start an interview.

## Build & verify

```bash
bun run build         # vue-tsc --noEmit (SFC-aware type check) + production build → dist/
bunx vue-tsc --noEmit # Type check only (tsc skips .vue files — use vue-tsc)
bun run test          # vitest
bun run preview       # Serve the production dist/ locally to smoke-test the PWA
```

> **Build prerequisite:** `vite.config.ts` aliases `@nc-750/lab-vue` and `@nc-750/lab-css`
> to `../../lab/vue/dist/lab-vue.js` and `../../lab/css/lab.css`. From a clean checkout the
> `lab/` packages must be built first, or the app build will fail to resolve those imports.

A deeper tour of the architecture and conventions lives in [`CLAUDE.md`](./CLAUDE.md) and
[`CONVENTIONS.md`](./CONVENTIONS.md).

## Deploy (PWA)

The build output is the static `dist/` folder.

### Current target: GitHub Pages → `mirror.nc-750.com`

The live PWA is published to GitHub Pages from a **separate public repo that holds only the
built `dist/`** — application source stays private. The custom domain serves at the domain
root, so no base-path configuration is needed.

```bash
bun run deploy   # build + 404.html fallback, then push dist/ to the public Pages repo
```

`deploy` runs `build:pages` (production build + a `scripts/pages-postbuild.mjs` step that
copies `index.html` → `404.html` for SPA fallback, since GitHub Pages has no rewrite rules)
and then `gh-pages` pushes `dist/` to the public repo's `gh-pages` branch. The repo URL is set
in the `deploy` script in [`package.json`](./package.json). `public/CNAME`,
`public/.nojekyll`, and the generated icons ride along in `dist/` on every build.

One-time setup:
1. Create the public build repo and set its SSH URL in the `deploy` script.
2. Repo → **Settings → Pages**: serve from `gh-pages` / root, set custom domain
   `mirror.nc-750.com`, enable **Enforce HTTPS** once the certificate provisions.
3. DNS: add `CNAME  mirror  →  <github-username>.github.io.` at the nc-750.com registrar.

### Other hosts

Any static host works if it satisfies: **HTTPS**; **SPA history fallback** (rewrite unknown
paths to `/index.html`); **cache headers** (`no-cache` for `index.html`/`sw.js`, immutable for
hashed `assets/*`); and serves `manifest.webmanifest` as `application/manifest+json`.
Ready-to-use snippets:

**Netlify** (`netlify.toml`):
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-cache"
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    { "source": "/index.html", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
    { "source": "/sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
```

**Cloudflare Pages** — `public/_redirects`:
```
/*  /index.html  200
```
and `public/_headers`:
```
/index.html
  Cache-Control: no-cache
/sw.js
  Cache-Control: no-cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

**nginx**:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
location = /index.html { add_header Cache-Control "no-cache"; }
location = /sw.js      { add_header Cache-Control "no-cache"; }
location /assets/      { add_header Cache-Control "public, max-age=31536000, immutable"; }
```

## Release process

Versions are kept in sync across `package.json`, `src-tauri/tauri.conf.json`, and
`src-tauri/Cargo.toml`. To cut a release:

1. **Bump** the version in all three files.
2. **Changelog** — add an entry to [`CHANGELOG.md`](./CHANGELOG.md).
3. **Build & verify** — `bun run build`, `bun run test`, `bun run preview`.
4. **Tag** — `git tag -a vX.Y.Z -m "Mirror vX.Y.Z"` then `git push origin vX.Y.Z`.
5. **Deploy** — `bun run deploy` (publishes `dist/` to the public GitHub Pages repo).

## License

The repository is currently private; no open-source license is granted at this time.
