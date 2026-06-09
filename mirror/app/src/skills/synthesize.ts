/**
 * Call C — end-of-interview SYNTHESIS (unchanged three-phase pipeline).
 *
 * Pure orchestration: given an LLM and the transcript, run the
 * extract → analyze → polish calls and merge them into a validated PersonaJSON.
 * No store/persona coupling here — the caller persists the result.
 *
 * Extracted from the old InterviewView so both the (transitional) chat view and
 * the new instrument share one implementation.
 */

import {
  buildExtractSystemPrompt,
  buildExtractUserPrompt,
  buildAnalyzeSystemPrompt,
  buildAnalyzeUserPrompt,
  buildPolishSystemPrompt,
  buildPolishUserPrompt,
  FALLBACK_FORMAT_SUFFIX,
} from "./synthesisPrompts";
import {
  EXTRACT_JSON_SCHEMA,
  EXTRACT_SCHEMA_NAME,
  ANALYZE_JSON_SCHEMA,
  ANALYZE_SCHEMA_NAME,
  POLISH_JSON_SCHEMA,
  POLISH_SCHEMA_NAME,
  ExtractDataSchema,
  AnalyzeDataSchema,
  PolishDataSchema,
  mergeSynthesisFragments,
} from "./personaSchemas";
import { extractFencedJSON } from "./interviewExtractor";
import { logger } from "../logger";
import { stripNulls, type PersonaJSON } from "../types/persona";
import type { Message, LLMProvider } from "../llm/types";
import type { InterviewMessage } from "../db/schema";

export type SynthesisPhase = "extracting" | "analyzing" | "polishing" | "finalizing";

function unwrapCallOutput(raw: unknown, requiredField: string): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;
  if (requiredField in o) return o;
  for (const [, val] of Object.entries(o)) {
    if (val && typeof val === "object" && requiredField in (val as Record<string, unknown>)) {
      return val;
    }
  }
  return o;
}

async function synthesisCall(
  llm: LLMProvider,
  systemPrompt: string,
  userPrompt: string,
  schema: Record<string, unknown>,
  schemaName: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const raw = await llm.structuredComplete(messages, schema, schemaName, signal);
    if (raw != null && typeof raw === "object") return stripNulls(raw);
  } catch (e) {
    if (signal?.aborted) throw e;
    logger.warn("synthesis", `structured output failed (${schemaName}), falling back to plain completion`, { error: e instanceof Error ? e : undefined });
  }

  const text = await llm.complete(
    [...messages.slice(0, -1), { role: "user" as const, content: userPrompt + FALLBACK_FORMAT_SUFFIX }],
    signal,
  );
  const raw = extractFencedJSON(text);
  if (raw != null && typeof raw === "object") return stripNulls(raw);

  throw new Error(`${schemaName}: both structured-output and plain-text fallback failed. Raw response: ${text.slice(0, 300)}`);
}

async function synthesisCallWithRetry(
  llm: LLMProvider,
  systemPrompt: string,
  userPrompt: string,
  schema: Record<string, unknown>,
  schemaName: string,
  signal?: AbortSignal,
): Promise<unknown> {
  try {
    return await synthesisCall(llm, systemPrompt, userPrompt, schema, schemaName, signal);
  } catch (e) {
    if (signal?.aborted) throw e;
    logger.warn("synthesis", `${schemaName} first attempt failed; retrying`);
  }
  return synthesisCall(llm, systemPrompt, userPrompt + FALLBACK_FORMAT_SUFFIX, schema, schemaName, signal);
}

export interface SynthesizeOptions {
  llm: LLMProvider;
  initialData: string;
  messages: InterviewMessage[];
  signal?: AbortSignal;
  onPhase?: (phase: SynthesisPhase) => void;
}

/** Run the three-phase synthesis and return a validated PersonaJSON (no source attached). */
export async function synthesizePersona(opts: SynthesizeOptions): Promise<PersonaJSON> {
  const { llm, initialData, messages, signal, onPhase } = opts;

  const transcript = messages
    .filter((m) => !m.isError)
    .map((m) => `${m.role === "user" ? "User" : "Interviewer"}: ${m.content}`)
    .join("\n\n");

  onPhase?.("extracting");
  const extractRaw = unwrapCallOutput(
    await synthesisCallWithRetry(llm, buildExtractSystemPrompt(), buildExtractUserPrompt(initialData, transcript), EXTRACT_JSON_SCHEMA, EXTRACT_SCHEMA_NAME, signal),
    "identity",
  );
  const extract = ExtractDataSchema.safeParse(extractRaw);
  if (!extract.success) {
    const f = extract.error.issues[0];
    throw new Error(`Extract phase — ${f.path.length ? f.path.join(".") : "(root)"}: ${f.message}`);
  }

  onPhase?.("analyzing");
  const analyzeRaw = unwrapCallOutput(
    await synthesisCallWithRetry(llm, buildAnalyzeSystemPrompt(), buildAnalyzeUserPrompt(initialData, transcript, extract.data as Record<string, unknown>), ANALYZE_JSON_SCHEMA, ANALYZE_SCHEMA_NAME, signal),
    "strengths",
  );
  const analyze = AnalyzeDataSchema.safeParse(analyzeRaw);
  if (!analyze.success) {
    const f = analyze.error.issues[0];
    throw new Error(`Analyze phase — ${f.path.length ? f.path.join(".") : "(root)"}: ${f.message}`);
  }

  onPhase?.("polishing");
  const polishRaw = unwrapCallOutput(
    await synthesisCallWithRetry(llm, buildPolishSystemPrompt(), buildPolishUserPrompt(initialData, transcript, extract.data as Record<string, unknown>, analyze.data as Record<string, unknown>), POLISH_JSON_SCHEMA, POLISH_SCHEMA_NAME, signal),
    "use_cases",
  );
  const polish = PolishDataSchema.safeParse(polishRaw);
  if (!polish.success) {
    const f = polish.error.issues[0];
    throw new Error(`Polish phase — ${f.path.length ? f.path.join(".") : "(root)"}: ${f.message}`);
  }

  onPhase?.("finalizing");
  return mergeSynthesisFragments(extract.data, analyze.data, polish.data);
}
