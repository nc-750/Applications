---
title: "Privacy"
description: "What stays on your device, what is sent to your AI provider, and how data is managed"
order: 3
---

A plain-words breakdown of what stays on your device and what leaves it.

---

## What stays on your device

Persona keeps your data local. None of the items below are uploaded to a Persona-owned server. Persona has no server.

**Settings** — Your selected provider, model, endpoint, and (in the PWA) your API key.

**Persona** — Your finished persona.

**Interview** — The current interview's status, message history, and the background data you provided up front.

**Keys** — Desktop only. Stored in your operating system's credential store (Windows Credential Manager on Windows, macOS Keychain on macOS). Encrypted by the OS; not accessible to other user accounts.

---

## What is sent to your AI provider

When you run an interview, the app calls your AI provider's API directly from this device. Every one of the following is POSTed over HTTPS to the provider you chose:

- Every message you type in the interview.
- Every assistant reply (sent back on the next turn for context).
- The system prompt that defines the interviewer's behavior.
- The initial background data you paste or upload at the start of the interview.
- The full text of any file you upload (CV, LinkedIn export, PDF, JSON, etc.). The file is parsed locally to text before sending.

The provider sees everything required to generate a response. Treat this as if you were pasting the content into their official web app.

---

## Provider data policies

Each provider has its own retention and training policy. Persona does not control or alter these.

### OpenAI
Requests are not used for training by default. Retention up to 30 days. [Full policy](https://openai.com/policies/api-data-usage-policies).

### Anthropic
Requests are not used for training by default. [Full policy](https://www.anthropic.com/legal/privacy).

### Mistral
Mistral may retain prompts. Review their data policy before sending sensitive content. [Terms](https://mistral.ai/terms).

### OpenAI-compatible
Behavior depends on your endpoint. For maximum privacy, run a local model with Ollama or LM Studio. [Ollama](https://ollama.com)

---

## Hard-delete behavior

The Settings panel's Danger Zone exposes three destructive actions. Each one removes data permanently; there is no undo and no remote backup.

**Clear persona data** — Wipes the persona and interview stores. Your provider settings and API key are kept.

**Clear AI provider** — Clears the API key from the app. Your persona and interview data are kept.

**Factory reset** — Full wipe: all persona, interview, and API key data is deleted. The app then reloads to its first-run state.

---

## Known limitations

**Permissive CSP for openai-compatible endpoints.** The Content Security Policy includes a broad `https:` clause in `connect-src` so any user-supplied endpoint can be reached. A future enhancement will narrow this to the exact endpoint configured in Settings.
