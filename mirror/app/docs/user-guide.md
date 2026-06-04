# Mirror User Guide

A step-by-step walkthrough for getting the most out of Mirror.

## What Mirror does

Mirror interviews you about your career, then produces two documents:

- **Insight** — a private, honest self-knowledge document. Strengths with evidence, growth areas, hidden skills, personality dimensions, values, and goals. For your eyes only.
- **Profile** — a polished, shareable professional page for recruiters, clients, and collaborators. Growth areas are excluded; in their place is a constructive "How I Work Best" section.

Everything stays on your device. There is no account and no Mirror server. You bring your own AI key.

---

## 1. Set up your AI provider

Mirror needs an AI provider to run the interview. You supply the key — the app talks to the provider directly from your machine.

1. Open **Settings** (gear icon in the sidebar).
2. Pick a provider from the dropdown.
3. Paste your API key.
4. Optional: click **Fetch models** to see what's available, or type a model name directly.
5. Click **Test connection** to verify everything works.
6. Click **Save**.

See the [Provider Setup Guide](./provider-setup.md) for help getting API keys.

> **Tip:** For maximum privacy, point the "OpenAI-compatible" option at a local model running on your machine via [Ollama](https://ollama.com) or [LM Studio](https://lmstudio.ai). No API key needed, and nothing leaves your device.

---

## 2. Start an interview

From the welcome screen, click **Start interview**. You'll land on the data-input screen.

### Provide background (optional but recommended)

The more context you give, the more targeted the interview questions will be. You can:

- **Paste text** — your CV, LinkedIn About, or a freeform description of your career.
- **Attach files** — PDF, Markdown, HTML, text, or JSON. Drag and drop works too.
- **Skip** — start with no background data. The interviewer will open with a broad question.

If your input is very large (roughly over 600,000 characters), Mirror will run a background analysis pass to condense it before the interview. You'll see a notice when this happens.

Click **Start interview** when ready.

### The interview

The AI will ask you a series of questions about your work. Answer naturally — this is a conversation, not a form.

- **Free tier:** 2–3 questions, surface-level.
- **Pro tier:** 5–8 questions, deep excavation across two layers (experience + transversal).

When the interview is complete, the AI will thank you and Mirror will build your profile. This takes a few seconds.

---

## 3. View your results

Once synthesis finishes, you'll see a completion banner with two buttons:

- **View Insight** — your private, full self-knowledge document.
- **View Profile** — your public, shareable professional page.

Both are rendered in the app and downloadable as self-contained HTML files. The HTML files have no remote dependencies — you can open them from disk, host them, or send them to someone.

### What's in each document

| Section | Insight (private) | Profile (public) |
|---------|:---:|:---:|
| Elevator pitch | ✓ | ✓ |
| Strengths (with evidence) | ✓ | ✓ |
| Growth areas / weaknesses | ✓ | — |
| Skills map (by category) | ✓ | ✓ |
| Career timeline (with real_story) | ✓ | ✓ (highlights only) |
| Outside-work activities | ✓ | ✓ |
| Hidden assets | ✓ | — |
| Personality dimensions | ✓ | — |
| Values & goals | ✓ | — |
| Ready-to-use text (CV summary, pitch, LinkedIn About) | ✓ | — |
| How I Work Best | — | ✓ |

---

## 4. Import an existing mirror.json

If you already have a mirror.json file (from another device or an earlier export):

1. From the welcome screen, click **Import mirror.json**.
2. Select the file.
3. If the file is valid, your mirror data loads immediately — no re-interview needed.

You can also import from **Settings → Data → Import mirror.json**.

---

## 5. Export your data

- **Insight or Profile:** click **Download HTML** in the toolbar.
- **mirror.json:** go to **Settings → Data → Export mirror.json**. This exports the raw structured data, which can be re-imported later.

---

## 6. Free vs. Pro

| | Free | Pro |
|---|:---:|:---:|
| Interview depth | 2–3 questions, surface | 5–8 questions, deep excavation |
| "How I Work Best" detail | 2 concise statements | 3–4 nuanced statements |
| Strengths, skills, timeline | ✓ | ✓ (richer) |
| Growth areas, hidden assets, personality | ✓ | ✓ (richer) |
| Ready-to-use text | ✓ | ✓ (richer) |

Pro requires a license key. To activate one, open **Settings → License** and paste your key.

---

## 7. Managing your data

Mirror stores everything locally. The Settings panel has three data controls:

- **Clear mirror data** — deletes your mirror data and interview history. Keeps your provider settings.
- **Clear AI provider** — removes your API key and provider settings. Keeps your mirror data.
- **Factory reset** — wipes everything and reloads the app to its first-run state.

All three are permanent — there is no undo and no remote backup.

---

## Need help?

- **Provider setup:** see the [Provider Setup Guide](./provider-setup.md).
- **How it works internally:** see the [Architecture Overview](./architecture.md).
- **Privacy details:** open **Settings → Privacy details**, or ask a question.
