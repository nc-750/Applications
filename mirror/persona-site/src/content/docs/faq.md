---
title: "FAQ"
description: "Frequently asked questions about Persona"
order: 5
---

## Is my data safe?

Yes. Persona has no server. Nothing is uploaded to a Persona-owned backend. Your data lives on your device in IndexedDB, and your API key is stored in your OS credential manager on desktop (Windows Credential Manager, macOS Keychain) or IndexedDB on PWA.

The only data that leaves your device is what you send to your AI provider during the interview — and you choose which provider to use. See the [Privacy page](/docs/privacy) for full details.

---

## What AI providers work?

OpenAI, Anthropic, Mistral, and any OpenAI-compatible endpoint (Groq, Together AI, OpenRouter, Ollama, LM Studio, etc.). See the [Provider Setup guide](/docs/provider-setup) for step-by-step instructions.

---

## Can I use it completely offline?

Yes, if you run a local model. Install [Ollama](https://ollama.com) or [LM Studio](https://lmstudio.ai) on your machine, point Persona at `http://localhost:11434/v1` (Ollama) or `http://localhost:1234/v1` (LM Studio), and nothing leaves your device. Not even to an AI provider.

Local models produce less consistent structured output, but Persona has a fallback path that handles that.

---

## How is Pro different from Free?

Free gives you 2–3 interview questions at surface level. Pro unlocks 5–8 deep excavation questions across two layers, richer synthesis, and more nuanced "How I Work Best" statements. Free is fully functional, not a trial — it never expires. Pro is a one-time purchase, not a subscription.

See the [comparison table](/#compare) for a full breakdown.

---

## What happens if I lose my device?

Persona doesn't sync or back up data anywhere. To protect against device loss:

- **Export your persona.json** from Settings → Data regularly. This is a small JSON file you can re-import on a new device.
- **Download your Insight and Profile HTML** files and save them somewhere safe.

Without a backup, there's nothing to recover — Persona deliberately doesn't hold your data.

---

## Can I use Persona on multiple devices?

Yes, but each device is independent. Persona doesn't sync between devices. Export your `persona.json` from one device and import it on another to transfer the finished persona. Interview transcripts don't transfer.

---

## Why do I need to bring my own API key?

This is the core privacy model. Persona has no server, so it can't proxy your requests. Your device talks directly to the AI provider. You pay the provider directly (most offer free credits for new accounts), and you control which provider sees your data.

This also means Persona can be free and open source — there's no server cost to cover.

---

## What does the Pro license cost?

$29–49, one-time. No subscription. One license key activates on multiple devices (within reason — it's per-person, not per-seat). Buy through Lemon Squeezy.

---

## Can I contribute?

Yes. Persona is open source on [GitHub](https://github.com/vendinois/persona). See the [Architecture overview](/docs/architecture) for how everything fits together, and the [Development guide](https://github.com/vendinois/persona/blob/main/docs/development.md) for setup instructions.

---

## What platforms does Persona run on?

Windows, macOS, and Linux as a desktop app (via Tauri). Any modern browser as a PWA (installable on desktop and mobile).

---

## Will Persona ever have a cloud version?

No. The zero-server architecture is a feature, not a limitation. Persona is deliberately offline-first and local-only. There is no plan to add a backend.
