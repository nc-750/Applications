import type { LLMClient } from "@nc-750/llm-ts";

// Characters of raw input before the map-reduce digest pre-pass fires (≈170k tokens at 3.5 chars/token)
export const DIGEST_THRESHOLD_CHARS: number = Number(
  import.meta.env.VITE_DIGEST_THRESHOLD_CHARS ?? 600_000
);

// Characters per chunk in the map step (≈23k tokens)
export const DIGEST_CHUNK_CHARS: number = Number(
  import.meta.env.VITE_DIGEST_CHUNK_CHARS ?? 80_000
);

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

function MAP_PROMPT(chunk: string, chunkIndex: number, totalChunks: number): string {
  return `You are extracting structured information from segment ${chunkIndex + 1}/${totalChunks} of a user's personal data to prepare for a persona interview.

CRITICAL RULE: This is EXTRACTION, not summarization. Preserve verbatim: job titles, company names, dates, technology/tool names, numbers, statistics, and the person's own phrasing for achievements. Do NOT paraphrase or generalize these specifics. "Led a team of 5 engineers rebuilding the auth service in Go" stays as-is; it does NOT become "led engineering work."

Discard: UUIDs, raw timestamps, UI metadata, off-topic conversation turns unrelated to the person's professional/personal identity.

Output a structured extract with these sections (omit any section that has no relevant content in this segment):

## Identity & Contact
(name, location, email, links — only if present)

## Career Timeline
(list each role as: TITLE @ ORG | DATE_RANGE — one-line verbatim highlight)

## Skills & Technologies
(exact names only, grouped: Technical / Tools / Languages / Domain)

## Education
(institution, degree, dates)

## Non-Professional Activities
(hobbies, side projects, caregiving, volunteering — keep specifics)

## Excavation Hooks
(list items that a skilled interviewer should probe further: compressed/terse role entries, career gaps, unusual transitions, skill clusters implying unlisted abilities, anything unexpected. Flag as HOOK: <item>)

Raw data segment:
<segment>
${chunk}
</segment>`;
}

function REDUCE_PROMPT(combinedExtracts: string, chunkExtracts: string[]): string {
  return `You are merging ${chunkExtracts.length} structured extracts from different segments of the same person's data into one unified brief for a persona interview.

Rules:
- Preserve verbatim specifics: titles, company names, dates, tool names, numbers — do not paraphrase.
- Deduplicate: if the same role or skill appears in multiple extracts, keep it once with the most detail.
- Merge Excavation Hooks from all segments into one combined section — do not drop any.
- Keep the same section structure as the input extracts.
- Do not add inferences or summaries beyond what the source material states.

Extracts to merge:

${combinedExtracts}`;
}

export async function prepareLLMInput(
  rawData: string,
  llm: LLMClient,
  signal?: AbortSignal
): Promise<{ llmInput: string; wasDigested: boolean }> {
  return prepareInputBrief(rawData, llm, signal);
}

export async function prepareInputBrief(
  rawData: string,
  llm: LLMClient,
  signal?: AbortSignal
): Promise<{ llmInput: string; wasDigested: boolean }> {
  if (rawData.length <= DIGEST_THRESHOLD_CHARS) {
    return { llmInput: rawData, wasDigested: false };
  }

  const chunks: string[] = [];
  for (let start = 0; start < rawData.length; start += DIGEST_CHUNK_CHARS) {
    chunks.push(rawData.slice(start, start + DIGEST_CHUNK_CHARS));
  }

  const chunkResults = await Promise.all(
    chunks.map(async (chunk, i) => {
      const result = await llm.message(
        [{ role: "user", content: MAP_PROMPT(chunk, i, chunks.length) }],
        { signal },
      );
      if (!result.ok) throw result.error;
      return result.value as string;
    })
  );

  if (chunkResults.length === 1) {
    return { llmInput: chunkResults[0], wasDigested: true };
  }

  const combinedExtracts = chunkResults.join("\n\n---\n\n");
  const briefResult = await llm.message(
    [{ role: "user", content: REDUCE_PROMPT(combinedExtracts, chunkResults) }],
    { signal },
  );

  if (!briefResult.ok) throw briefResult.error;

  return { llmInput: briefResult.value as string, wasDigested: true };
}
