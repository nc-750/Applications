// File to be reworked or scrapped

// import type { LLMClient } from "@nc-750/llm-ts";
// import type { PersonaJSON } from "../types/persona";

// /**
//  * One-shot LLM call: derives "How I Work Best" from weaknesses, personality traits, values.
//  * Called exactly once at interview completion. Result is cached in persona.derived.
//  *
//  * Produces 3–4 nuanced statements.
//  */
// export async function synthesizeHowIWorkBest(
//   persona: PersonaJSON,
//   llm: LLMClient,
//   signal?: AbortSignal
// ): Promise<string[]> {
//   const p = persona.persona;

//   const weaknessesSummary = (p.weaknesses ?? [])
//     .map((w) => `- ${w.label}: ${w.description}`)
//     .join("\n");

//   const traitsSummary = (p.personality_traits ?? [])
//     .map((t) => `- ${t.dimension} (${t.position}/10)${t.note ? `: ${t.note}` : ""}`)
//     .join("\n");

//   const valuesLine = (p.values ?? []).join(", ");

//   const count = "3–4";
//   const maxItems = 4;

//   const prompt = `You are helping write a professional "How I Work Best" section for ${p.identity.name}'s public profile.

// This section should translate honest self-knowledge into constructive working conditions — not expose weaknesses, but describe the environment and conditions in which this person genuinely thrives.

// **Source data (private — do NOT copy verbatim into output):**

// Weaknesses:
// ${weaknessesSummary || "Not provided"}

// Personality traits:
// ${traitsSummary || "Not provided"}

// Values: ${valuesLine || "Not provided"}

// **Transform rules:**
// - "indecision under uncertainty" + "needs challenge/interlocutor" → "I do my best work with a trusted collaborator or team that challenges my assumptions"
// - "motivation needs anchors" + value "exploration" → "I thrive on projects with a clear problem to solve and enough autonomy to find my own path to it"
// - "introvert-leaning" + value "meaningful conversation" → "I work best with focused, substantive collaboration rather than constant group interaction"

// **Output:** Return ONLY a JSON array of ${count} strings. Each string is one "how I work best" statement. Honest, self-aware, and constructive — not marketing copy. No explanation, no preamble. Just the JSON array.

// Example output:
// ["I do my best thinking with uninterrupted focus time, then validate with the team.", "I thrive when I can own a problem end-to-end rather than execute on someone else's solution.", "I work best with a small, trusted team where direct feedback is the norm."]`;

//   const responseResult = await llm.message(
//     [{ role: "user", content: prompt }],
//     { signal },
//   );

//   if (!responseResult.ok) throw responseResult.error;

//   // Parse JSON array from response
//   const trimmed = (responseResult.value as string).trim();
//   const match = trimmed.match(/\[[\s\S]*\]/);
//   if (match) {
//     try {
//       const arr = JSON.parse(match[0]);
//       if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
//         return arr.slice(0, maxItems);
//       }
//     } catch {
//       // fall through to line split
//     }
//   }

//   // Fallback: split by newlines, strip bullets/quotes
//   return trimmed
//     .split("\n")
//     .map((l) => l.replace(/^[-•*"'\d.)\s]+/, "").replace(/["']$/, "").trim())
//     .filter((l) => l.length > 10)
//     .slice(0, maxItems);
// }
