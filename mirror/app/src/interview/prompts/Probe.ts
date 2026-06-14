// Flow 3 — Probe (Call A).
//
// The instrument asks exactly ONE facet-scoped question per turn. Which facet, and
// whether to follow-up vs advance, is decided by the analysis call (Call B,
// TurnAnalysis); this stage just renders the next question in probe voice. It does
// NOT plan ahead, list questions, or decide completion — the service concludes from
// coverage.
//
// The probe returns STRUCTURED JSON { context, question } so the UI can place the
// two cleanly: `question` is the probe heading; `context` is a brief read-only
// reaction to the previous answer. This file owns the prompt builder and the
// `Probe` boundary contract (Zod + JSON Schema, type via z.infer — CONVENTIONS
// 1.9 / 1.10).

import { z } from "zod";
import type { Message } from "@nc-750/llm-ts";
import { FACETS, FACET_PROBE_GUIDE } from "../reference";
import { philosophyIntro, languageRule, toneRule, textMessage } from "./Fragments";
import type { TurnAnalysis } from "./TurnAnalysis";

/** Boundary schema for the structured probe result — a reaction + one question. */
export const ProbeSchema = z.object({
    context: z.string(),
    question: z.string(),
});

/** The validated probe result — derived from the schema so they cannot drift. */
export type Probe = z.infer<typeof ProbeSchema>;

export const PROBE_SCHEMA_NAME = "probe";

/** JSON Schema form for providers that enforce strict structured output. */
export const PROBE_JSON_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        context: {
            type: "string",
            description:
                "A brief, warm acknowledgement of the user's PREVIOUS answer — at most ~12 words, one clause, no question. Empty string on the first probe (there is no prior answer yet).",
        },
        question: {
            type: "string",
            description:
                "The single question to ask this turn — one clear interrogative sentence. No preamble, no acknowledgement, no compound questions, no list.",
        },
    },
    required: ["context", "question"],
};

/** The probe system prompt for the facet/action the analysis call selected. */
export function buildNextQuestionSystemPrompt(turnAnalysis: TurnAnalysis): Message {
    const facetMeta = FACETS.find((f) => f.key === turnAnalysis.next_facet);
    const instruction = turnAnalysis.next_action === "follow_up"
        ? `Dig DEEPER on the thread from the user's last answer, staying within the "${facetMeta?.label}" facet. "context" is a brief acknowledgement of that answer; "question" digs further.`
        : `Move on to the "${facetMeta?.label}" facet. "context" briefly acknowledges the user's last answer; "question" opens the new facet.`;
    const guide = FACET_PROBE_GUIDE[turnAnalysis.next_facet];

    const prompt = `
${philosophyIntro()}

You are the instrument's probe stage. You ask exactly ONE question per turn — never compound, never a list. You do not plan ahead and you do not decide when the interview ends; the instrument decides that from the reading.

## This turn
Target facet: ${facetMeta?.label} (${turnAnalysis.next_facet}) — ${facetMeta?.blurb}
What to dig into: ${guide}

${instruction}

## Output
Return a JSON object with exactly two string fields:
- "context": a brief, warm acknowledgement of the user's PREVIOUS answer — at most ~12 words, one clause, NOT a question. Use an empty string on the first probe. Never repeat the answer back verbatim.
- "question": the single question to ask this turn — one clear interrogative sentence, no preamble, no acknowledgement folded in, no compound questions.

Keep the acknowledgement and the question strictly separate: nothing question-like in "context", nothing acknowledgement-like in "question".

${languageRule()}

${toneRule()}`;

    return textMessage("system", prompt);
}
