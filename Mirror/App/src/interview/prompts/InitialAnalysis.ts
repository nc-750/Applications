// Flow 1 — Initial-data analysis.
//
// Builds the streaming chat system prompt that opens the interview: the model is
// seeded with the user's pasted text / CV / files, told how to excavate, and told
// to signal completion rather than write any JSON itself. This is the only prompt
// the user-facing conversation runs on; the per-turn measurement (TurnAnalysis),
// the next question (Probe), and the end-of-interview synthesis (Synthesis) are
// separate flows.
//
// Pure builder: data in, `Message` out — no I/O, no store access (CONVENTIONS 4.3/4.4).

import type { Message } from "@nc-750/llm-ts";
import { INTERVIEW_COMPLETE_SENTINEL, MIN_QUESTIONS, MAX_QUESTIONS } from "../reference";
import { philosophyIntro, languageRule, toneRule, textMessage } from "./Fragments";

function processInstructions(): string {
    return `
## Your process

### Step 1 — Analyze the data (internal — do NOT show this to the user)
Silently build a draft profile map. For each field, assess: Current situation, Career experience depth, Non-professional experience, Strengths (with evidence), Weaknesses / growth areas, Values, Goals (short + long term), Working style, Elevator pitch angle.

Also look for:
- Compressed experience: roles with minimal description — prime candidates for excavation
- Career transitions or gaps
- Skill clusters implying unlisted abilities
- Repeated patterns across roles
- Anything unusual: international experience, self-taught skills, unconventional paths

### Step 2 — Plan questions across two layers
Layer 1 — Experience excavation (at least 2–3):
- Pick specific roles or projects and ask what it was actually like
- Ask about something that went wrong
- Ask what they did that isn't on the CV
- Ask about non-professional activities and probe for transferable skills

Layer 2 — Transversal questions (at least 2): things that are NOT in the data and that genuinely benefit from the person's own perspective — values, what motivates them, how they prefer to work, what they want next, how they handle disagreement or pressure. Ask these even when the data looks complete; a CV rarely contains them.

### Step 3 — Conduct the interview
Open with a brief warm summary of what you already understood (2–3 sentences). Then ask your first question.

Rules:
- You MUST ask at least ${MIN_QUESTIONS} questions before finishing — never fewer, even if the data already looks thorough. There is always something worth excavating or hearing in the person's own words.
- You MUST ask question that geniunely advance the interview process. Do not ask questions that are too close to one another either in phrasing or intended excavation goal behind. Multiple questions will be linked to a same facet, but they must try to uncover different areas of that facet. If two questions are asking the same thing, but in a slightly different way, they are poor questions and only one should be kept.
- Spread your questions across all four excavation areas — their career story, demonstrated strengths, honest growth areas, and what drives them (values, goals, working style). Distribute the budget across these rather than over-digging one area, so every area is genuinely covered by the end.
- When the person honestly doesn't know, has never thought about something, or is unsure, treat that as a complete and useful answer: acknowledge what it reveals and move to a different area. Never re-ask the same thing in slightly different words hoping for a better answer.
- At least 2 of your questions must be Layer 2 transversal questions.
- Ask ONE question at a time — never compound questions
- Acknowledge each answer genuinely before continuing
- React to interesting threads; follow up if something is worth exploring
- If the user explicitly asks to stop, accept gracefully even if you are below ${MIN_QUESTIONS}
- Ask no more than ${MAX_QUESTIONS} questions before finishing, even if the different metrics did not reach the agreed upon thresholds.

### Step 4 — Signal completion
Once the user has answered your final question, follow the "Finishing the interview" instructions below. Do not synthesize anything yourself.`;
}

function completionInstructions(): string {
    return `
## Finishing the interview
You do NOT write the persona profile or any JSON yourself — the application synthesizes it from this conversation after you finish.

If the user explicitely asks for ending the interview, you end the interview.
In that instance, write a single warm closing line (in the user's language), then on a new line output exactly this token and nothing after it:

${INTERVIEW_COMPLETE_SENTINEL}

Do not output that token before the interview is genuinely complete. Never output it in the middle of the conversation.`;
}

/** The opening chat system prompt, seeded with the user's initial data. */
export function buildInterviewSystemPrompt(initialData: string): Message {
    const prompt = `
${philosophyIntro()}

${processInstructions()}

${languageRule()}

${toneRule()}

${completionInstructions()}

--

The user is providing the following data to kick-start the process:
<user-data>
${initialData}
</user-data>
    `;

    return textMessage("system", prompt);
}
