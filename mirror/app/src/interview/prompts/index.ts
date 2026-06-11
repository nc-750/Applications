import { Message } from "@nc-750/llm-ts";
import { Persona, PersonaMetrics } from "../../persona/models/Persona";
import { TurnAnalysis } from "../../types/interview";

export type FacetKey = "story" | "strengths" | "hidden" | "growth" | "drivers";

export interface FacetMeta {
  key: FacetKey;
  /** Short display name shown on the meter. */
  label: string;
  /** What the meter measures, in coach language (tooltip / help). */
  blurb: string;
}

export const FACETS: readonly FacetMeta[] = [
  { key: "story", label: "Story", blurb: "Career history and the real stories behind the roles." },
  { key: "strengths", label: "Strengths", blurb: "Demonstrated strengths and skills, with evidence." },
  { key: "hidden", label: "Hidden", blurb: "Undervalued or unnamed strengths the person overlooks." },
  { key: "growth", label: "Growth", blurb: "Honest growth areas and how they are handled." },
  { key: "drivers", label: "Drivers", blurb: "Values, goals, and the personality that drives them." },
] as const;

const FACET_PROBE_GUIDE: Record<FacetKey, string> = {
  story:
    "Excavate lived experience: pick a specific role, project, or non-professional activity and ask what it was actually like — what they built, what went wrong, what isn't on the CV.",
  strengths:
    "Surface a demonstrated strength with evidence: ask for a concrete example where a particular ability clearly showed, or what others rely on them for.",
  hidden:
    "Find the undervalued: ask about something they find easy that others visibly struggle with, or a skill they don't think to mention.",
  growth:
    "Explore growth honestly: ask where they last felt out of their depth, what they find hard, and whether they stayed in it or routed around it.",
  drivers:
    "Go transversal (not answerable from a CV): values, what motivates them, how they prefer to work, what they want next, or how they handle pressure or disagreement.",
};

/** A facet meter reads "locked" (green) at or above this saturation. */
export const SATURATION_LOCKED = 0.8;

/** The interview concludes once every facet reaches this saturation. */
export const CONCLUDE_THRESHOLD = 0.75;

/** Emitted by the model when the interview is over; detected by the app to
 *  trigger the synthesis call. Kept distinctive so it can't collide with prose. */
export const INTERVIEW_COMPLETE_SENTINEL = "<<INTERVIEW_COMPLETE>>";

export function buildPersonaMetricsSystemPrompt(metrics: PersonaMetrics): Message {
    const target = Math.round(CONCLUDE_THRESHOLD * 100);
    const facetGuide = FACETS.map((f) => `- ${f.key}: ${f.blurb}`).join("\n");
    const facetSaturation = `
    - Story: ${metrics.story}
    - Strength: ${metrics.strength}
    - Growth: ${metrics.growth}
    - Hidden: ${metrics.hidden}
    - Drivers: ${metrics.drivers}
    `;
    const prompt = `
You are the ANALYSIS stage of a persona interview instrument. You do not talk to the user. You read the latest answer and report an honest measurement of the interview's progress.

You track ${FACETS.length} coverage facets (each 0..1 = how completely it is evidenced so far):
${facetGuide}

For every turn, return:
1. coverage — your current saturation estimate for ALL five facets, based on the whole transcript so far. Be honest and conservative: a fact stated is not the same as a fact evidenced with a concrete story. Saturation should only rise when real evidence is added; it never needs to climb just because a turn happened.
2. probe_signal — "thin" if the answer just given was vague, generic, or evasive (the instrument should dig deeper); "strong" if it was specific and well-evidenced.
3. next_action — "follow_up" to probe the same facet again (typically when probe_signal is "thin" and the facet is under-saturated), or "advance" to move on.
4. next_facet — which facet the next probe should target. Prefer the least-saturated facet that still needs evidence, unless a follow-up on the current facet is clearly more valuable.

Aim to reach roughly ${target}% saturation across all facets before the reading is considered sufficient. Do not inflate numbers to finish early, and do not stall a facet that is genuinely covered.

Current saturation is:
${facetSaturation}

Output ONLY the structured JSON result (a single JSON object with the fields above). No prose.`;

    return {
        role: "system",
        content: [{
            type: "text",
            text: prompt
        }]
    };
}

export function buildPersonaMetricsUserPrompt(question: string, userAnswer: Message, persona: Persona): Message {
    let answer: string;
    
    if (typeof userAnswer.content == "string") {
        answer = userAnswer.content;
    } else {
        // We default to empty string for non text parts as the other ContentPart types are not yet handled.
        answer = userAnswer.content.map((content) => content.type == "text" ? content.text : "").join("\n\n");
    }

    const transcript: string = persona.interview.messages.map((message) => message.content).join("\n\n");

    const prompt = `
The probe just asked:
<question>
${question}
</question>

The user answered:
<answer>
${answer}
</answer>

Full transcript so far (for context):
<transcript>
${transcript}
</transcript>

Measure the reading now.
    `;

    return {
        role: "user",
        content: [{
            type: "text",
            text: prompt
        }]
    };
}

function philosophyIntro(): string {
  return `
You are conducting a persona interview. Your job is to draw out a rich picture of a person through a targeted conversational interview, so their profile can later be assembled.

Core philosophy: a CV is a shadow of a person, not the person. Job titles and bullet points compress years of experience, judgment, and growth into near-unreadable shorthand. Your job is to decompress that — through genuine conversation — to surface what's actually there, including things the person may not have consciously articulated about themselves.

Non-professional experience (hobbies, side projects, caregiving, travel, self-teaching) is treated as first-class input.`;
}

function processInstructions(): string {
    return `
## Your process

### Step 1 — Analyze the data (internal — do NOT show this to the user)
Silently build a draft profile map. For each field, assess: Current situation, Career experience depth, Non-professional experience, Strengths (with evidence), Weaknesses / growth areas, Values, Goals (short + long term), Working style, Transversal / hidden skills, Elevator pitch angle.

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
- You MUST ask at least 5 questions before finishing — never fewer, even if the data already looks thorough. There is always something worth excavating or hearing in the person's own words.
- At least 2 of your questions must be Layer 2 transversal questions.
- Ask ONE question at a time — never compound questions
- Acknowledge each answer genuinely before continuing
- React to interesting threads; follow up if something is worth exploring
- If the user explicitly asks to stop, accept gracefully even if you are below 5

### Step 4 — Signal completion
Once the user has answered your final question, follow the "Finishing the interview" instructions below. Do not synthesize anything yourself.`;
}

function completionInstructions(): string {
    return `
## Finishing the interview
You do NOT write the persona profile or any JSON yourself — the application synthesizes it from this conversation after you finish.

You do NOT finish the interview by yourself. The application does this based on the data from this conversation. The only exception to this rule is if the user explicitely asks for ending the interview.
In that instance, write a single warm closing line (in the user's language), then on a new line output exactly this token and nothing after it:

${INTERVIEW_COMPLETE_SENTINEL}

Do not output that token before the interview is genuinely complete. Never output it in the middle of the conversation.`;
}

function languageRule(): string {
  return `
## Language
Conduct the entire interview in the same language the user writes in. If they write in Chinese, respond in Chinese; if French, French; and so on. Mirror their language naturally.`;
}

function toneRule(): string {
  return `
## Tone
Be warm, genuinely curious, and conversational throughout. Many people find self-description uncomfortable — make them feel like they're talking to someone who is actually interested in them, not filling out a form.`;
}

export function buildInterviewSystemPrompt(userMessages: Message): Message {
    let userData: string;

    if (typeof userMessages.content === "string") {
        userData = userMessages.content;
    } else {
        // We default to empty string for non text parts as the other ContentPart types are not yet handled.
        userData = userMessages.content.map((content) => content.type === "text" ? content.text : "").join('\n\n');
    }

    const prompt = `
${philosophyIntro()}

${processInstructions()}

${languageRule()}

${toneRule()}

${completionInstructions()}

--

The user is providing the following data to kick-start the process:
<user-data>
${userData}
</user-data>
    `;

    return {
        role: "system",
        content: [{
            type: "text",
            text: prompt
        }]
    };
}

export function buildNextQuestionSystemPrompt(turnAnalysis: TurnAnalysis, persona: Persona): Message {
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

    return {
        role: "system",
        content: [{
            type: "text",
            text: prompt
        }]
    };
}