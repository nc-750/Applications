# Interview feature — UI/UX findings

Test session: drove the interview end-to-end in the Claude Preview pane with a
fake persona ("Maya Okonkwo", UX designer → PM career-changer). Goal was UX of
what the UI shows, not interview/data quality. 6 probes exercised.

Quantitative measurements are DOM-measured (`.mr-probe__q` heading height,
`.mr-probe__input` top offset) at 1280px-wide preview.

---

## 1. [PRIMARY] The ProbeCell heading shows the whole assistant turn, not the question

The `<h2 class="mr-probe__q">` is bound to the entire last assistant message,
which is **acknowledgement-of-your-last-answer + the question**, so the "question"
heading reads like a chat reply rather than a question.

Root cause (two halves):

- **Prompt** — `buildProbePrompt` tells Call A to *"Output only the message to the
  user (**acknowledgement + the single question**)"* and, on follow-ups,
  *"If a bridge is helpful, use ≤10 words."*
  (`src/skills/interviewPrompt.ts:151`, `:165`).
- **Binding** — `activeQuestion = streamingContent || lastAssistant`, where
  `lastAssistant` is the full last assistant `content`
  (`src/components/interview/InterviewInstrument.vue:65-68`), piped straight into
  the `<h2>` (`src/components/interview/ProbeCell.vue:43`).

Observed headings (note the leading reaction clause each time):

| # | Facet | Heading (verbatim, abridged) | Chars | Height |
|---|-------|------------------------------|-------|--------|
| 1 | story | "That checkout redesign you led — the one that cut cart abandonment by 18% — I'd love to hear the real story…" | 212 | 181px |
| 2 | story | "**That sounds like a gutsy call to scrap the original brief.** What was the conversation like when you told your stakeholders…" | 188 | 181px |
| 3 | story | "**That compromise with the engineering lead — the \"from $X\" version —** what was that trade-off like for you personally?…" | 211 | 181px |
| 4 | story | "**That's a really sharp learning.** Have you found yourself applying that same \"ship first, argue later\" approach…" | 138 | 121px |
| 5 | hidden | "**That's a really consistent pattern.** What part of that fast-decision-then-correct cycle feels almost effortless to you…" | 187 | 181px |

Even probe #1 — where the prompt explicitly says *"no preamble or summary needed"*
— came back at 212 chars / 8 lines. The model does not reliably keep the
acknowledgement to "≤10 words"; it's a sentence or more.

## 2. "The UI moves too much" — quantified layout instability

Because the heading is variable-height and the textarea + Submit sit *below* it in
a flex column, the input controls slide vertically as the question changes.

- **Within one turn (streaming):** the textarea top moved **151px** in ~0.7s.
  Sequence measured: previous question shown (taTop 340) → new stream replaces it,
  heading collapses to first token (36 chars / 30px, taTop **249**) → grows
  line-by-line as tokens arrive (59 → 119 → 157 → 187 chars) → settles at taTop
  **400**. So the Submit button first jumps *up* ~91px, then crawls *down* ~151px.
- **Between turns:** taTop varied 340–400px and heading 121–181px purely from
  question-length differences, a ~60px jump turn-to-turn.

The eye has to re-find the textarea and Submit button after every probe.

## 3. Stale question + blinking caret while the next probe is generating

Between hitting Submit and the first streamed token of the next probe, the heading
keeps showing the **previous** question with a blinking caret (`▋`) appended — it
looks like the old question is being re-typed.

Cause: `activeQuestion = streamingContent || lastAssistant` falls back to the last
committed question while `streamingContent` is still `""`, and the caret renders
whenever `questionStreaming` is true (`ProbeCell.vue:44`,
`InterviewInstrument.vue:69`). During Call B (analysis) and the Call A warm-up
there is no overlay on the heading, so the user stares at the prior question with
an active caret.

## 4. The acknowledgement is shown twice

The reaction to the user's answer appears in the heading **and** is stored in the
committed assistant message, which the Session Log then renders in full
(`SessionLogCell` builds each entry body as `Q: <full question incl. ack>\n\nA:
<answer>`, `src/components/interview/SessionLogCell.vue:28`). So the same "That
sounds like a gutsy call…" text is on screen in two places.

## 5. The Monitor / readout (the "hero") is intermittently dead and lurches

Call B (per-turn analysis) failed on **4 of the first 5 turns** with:

```
[warn] [app] Turn analysis failed; continuing without readout update
  Error: analysis parse failed: Invalid input: expected object, received null
```

(`src/composables/useInterview.ts:93` `runAnalysis` → structured call returned
`null`). While it failed: LED stuck on "AWAITING SIGNAL", all five coverage meters
at 0%, and `currentFacet` never advanced (facet tag read "PROBING · STORY" for the
first four probes). Then on turn 6 it succeeded and the readout **jumped in one
step** from all-0% to STORY 75 / STRENGTHS 50 / HIDDEN 0 / GROWTH 0 / DRIVERS 38,
LED flipping to "SIGNAL · STRONG — ADVANCING" and facet to HIDDEN.

Relevance to the fix: the brief suggests housing a "context window" in the Monitor
instrument — but the Monitor frequently has no data to show with this model, and
when it updates it does so abruptly. Any context surfaced there must degrade
gracefully when Call B returns nothing.

---

## Suggested fix direction (validating the brief's hypothesis)

The brief's instinct is right: this needs **both** a prompt rework and a UI change.

**Prompt (Call A — `buildProbePrompt`)**
- Make the probe output the **question only** — one clear interrogative sentence,
  no acknowledgement, no preamble, no "bridge". Drop the "acknowledgement + the
  single question" instruction.
- If a short human reaction is still wanted, request it as a **separate, explicit,
  short field** (e.g. a ≤8-word "reading" line) rather than free-form prose glued
  to the front of the question — so the UI can place it deliberately instead of
  cramming it into the `<h2>`.

**UI**
- Keep the `<h2>` question-only. Surface any reaction/acknowledgement as a small,
  subdued **context line** — either a one-liner above the question or in the
  readout/Monitor — not as heading text.
- **Stabilise layout:** pin the textarea + Submit to the bottom of the cell, or
  give the question a fixed/clamped min-height with internal scroll, so the input
  controls don't move while the question streams or changes length. Clamp the
  question to ~2–3 lines with overflow handling.
- **Fix the stale-caret state:** while the next probe is being generated, don't
  fall back to the previous question + caret. Show a dedicated "reading… / next
  probe incoming" placeholder (or reuse the acquisition overlay over the heading)
  so the old question isn't shown as if it's being retyped.
- If the context window lands in the Monitor, make it degrade gracefully for the
  turns where Call B yields nothing (see §5).
