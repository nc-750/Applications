# Changelog

All notable changes to Mirror (NODE-0M) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-06-17

First public release, shipped as an installable PWA.

### Added
- **AI interview → insight flow.** Mirror interviews you with your own AI model, finds
  patterns across your answers, and synthesizes a private insight document
  ("How I Work Best").
- **Bring-your-own-key (BYOK).** Supply your own key for OpenAI, Anthropic, Mistral, or
  any OpenAI-compatible endpoint. There is no NC-750 account and no NC-750 server in the
  request path — your content goes only to the provider you choose.
- **Local-first storage.** Personas, interview state, and settings live on-device in
  IndexedDB. Nothing is written to an NC-750-owned server.
- **Installable PWA.** Web app manifest, service worker (auto-update), offline app shell,
  and a Content-Security-Policy that constrains network access to AI providers.
- **Settings with connection test.** Pick a provider/model, store your key, and verify the
  link before starting.

### Notes
- The **Profile** feature (a publishable version of your profile) is marked "coming soon"
  in this release; the private insight document is fully available.
- Desktop (Tauri) builds are not distributed in this release.

[1.0.0]: https://github.com/vendinois/nc750/releases/tag/v1.0.0
