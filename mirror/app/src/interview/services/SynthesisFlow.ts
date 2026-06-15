// End-of-interview synthesis orchestrator.
//
// Runs the full three-phase LLM pipeline (extract → analyze → polish), merges
// the fragments, derives "How I Work Best", transforms everything into the
// domain Persona via `toPersona`, and commits through the persona store.
//
// This is the ONE impure function for synthesis (CONVENTIONS 4.3). Every
// phase failure is fatal (throws — no partial persona); HWB failure is
// non-fatal (logs, defaults to []).

import type { LLMClient, Message } from "@nc-750/llm-ts";
import { logger } from "../../logger";
import type { useInterviewStore } from "../stores/InterviewStore";
import type { usePersonaStore } from "../../persona/stores";
import type { Persona } from "../../persona/models/Persona";
import {
    buildExtractSystemPrompt,
    buildExtractUserPrompt,
    ExtractSchema,
    EXTRACT_SCHEMA_NAME,
    EXTRACT_JSON_SCHEMA,
    buildAnalyzeSystemPrompt,
    buildAnalyzeUserPrompt,
    AnalyzeSchema,
    ANALYZE_SCHEMA_NAME,
    ANALYZE_JSON_SCHEMA,
    buildPolishSystemPrompt,
    buildPolishUserPrompt,
    PolishSchema,
    POLISH_SCHEMA_NAME,
    POLISH_JSON_SCHEMA,
    buildHowIWorkBestPrompt,
    HowIWorkBestSchema,
    mergeSynthesisFragments,
    type SynthesisResult,
    type HowIWorkBestInput,
} from "../prompts/Synthesis";
import { extractFencedJSON } from "../prompts/Json";
import { transcriptOf } from "./Helpers";
import { toPersona } from "./SynthesisBridge";

// ── Internal helpers ──────────────────────────────────────────────────────

/** Run a single structured LLM call with fallback to plain + fenced JSON. */
async function structuredCall<T>(
    llmClient: LLMClient,
    messages: Message[],
    schemaName: string,
    jsonSchema: Record<string, unknown>,
    parser: (value: unknown) => { success: true; data: T } | { success: false; error: unknown },
    phaseLabel: string,
): Promise<T> {
    // Structured output first.
    const structured = await llmClient.message(messages, {
        structured: { name: schemaName, schema: jsonSchema, strict: false },
    });

    if (structured.ok) {
        const parsed = parser(structured.value);
        if (parsed.success) return parsed.data;
    }

    // Fallback to plain completion + fenced JSON extraction.
    const plain = await llmClient.message(messages);
    if (!plain.ok) {
        throw new Error(
            `Synthesis ${phaseLabel} phase failed: ${plain.error.message}`,
        );
    }

    const text = typeof plain.value === "string" ? plain.value : "";
    const raw = extractFencedJSON(text);
    const parsed = parser(raw);
    if (!parsed.success) {
        throw new Error(
            `Synthesis ${phaseLabel} phase parse failed: ${String(parsed.error)}`,
        );
    }

    return parsed.data;
}

// ── Public orchestrator ───────────────────────────────────────────────────

/**
 * Run the full end-of-interview synthesis pipeline:
 *   extract → analyze → polish → merge → How I Work Best → toPersona → commit.
 *
 * Sets the interview status to `"completed"` on success or `"error"` on failure.
 * Returns the completed `Persona` (with `derived.howIWorkBest` populated).
 */
export async function runSynthesis(
    llmClient: LLMClient,
    interviewStore: ReturnType<typeof useInterviewStore>,
    personaStore: ReturnType<typeof usePersonaStore>,
): Promise<Persona> {
    await interviewStore.setStatus("synthesizing");

    // Snapshot interview state before the pipeline (the store may be mutated
    // by other actions during the LLM calls, though in practice it isn't).
    const messages = [...interviewStore.messages];
    const initialData = interviewStore.initialData;
    const coverage = { ...interviewStore.coverage };
    const transcriptText = transcriptOf(messages);

    try {
        // ── Phase 1: Extract ──────────────────────────────────────────────
        const extractSys = buildExtractSystemPrompt();
        const extractUser = buildExtractUserPrompt(initialData, transcriptText);
        const extractOutput = await structuredCall(
            llmClient,
            [extractSys, extractUser],
            EXTRACT_SCHEMA_NAME,
            EXTRACT_JSON_SCHEMA,
            (v) => ExtractSchema.safeParse(v),
            "extract",
        );

        // ── Phase 2: Analyze ──────────────────────────────────────────────
        const analyzeSys = buildAnalyzeSystemPrompt();
        const analyzeUser = buildAnalyzeUserPrompt(
            initialData,
            transcriptText,
            extractOutput as unknown as Record<string, unknown>,
        );
        const analyzeOutput = await structuredCall(
            llmClient,
            [analyzeSys, analyzeUser],
            ANALYZE_SCHEMA_NAME,
            ANALYZE_JSON_SCHEMA,
            (v) => AnalyzeSchema.safeParse(v),
            "analyze",
        );

        // ── Phase 3: Polish ───────────────────────────────────────────────
        const polishSys = buildPolishSystemPrompt();
        const polishUser = buildPolishUserPrompt(
            initialData,
            transcriptText,
            extractOutput as unknown as Record<string, unknown>,
            analyzeOutput as unknown as Record<string, unknown>,
        );
        const polishOutput = await structuredCall(
            llmClient,
            [polishSys, polishUser],
            POLISH_SCHEMA_NAME,
            POLISH_JSON_SCHEMA,
            (v) => PolishSchema.safeParse(v),
            "polish",
        );

        // ── Merge ─────────────────────────────────────────────────────────
        const result: SynthesisResult = mergeSynthesisFragments(
            extractOutput,
            analyzeOutput,
            polishOutput,
        );

        // ── How I Work Best (non-fatal) ────────────────────────────────────
        let howIWorkBest: string[] = [];
        try {
            const hwbInput: HowIWorkBestInput = {
                name: extractOutput.identity.name,
                weaknesses: analyzeOutput.weaknesses,
                traits: analyzeOutput.personality_traits,
                values: extractOutput.values,
            };
            const hwbPrompt = buildHowIWorkBestPrompt(hwbInput);
            howIWorkBest = await structuredCall(
                llmClient,
                [hwbPrompt],
                "how_i_work_best",
                { type: "array", items: { type: "string" } },
                (v) => HowIWorkBestSchema.safeParse(v),
                "How I Work Best",
            );
        } catch (e) {
            logger.warn("app", "How I Work Best derivation failed (non-fatal)", {
                data: { error: e instanceof Error ? e.message : String(e) },
            });
            // Continue with empty HWB — persona is still valid.
        }

        // ── Transform + commit ────────────────────────────────────────────
        const persona = toPersona(result, messages, coverage);
        persona.derived.howIWorkBest = howIWorkBest;

        await personaStore.savePerson(persona);
        await interviewStore.setStatus("completed");

        return persona;
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        logger.error("synthesis", `Synthesis failed: ${message}`);
        await interviewStore.setStatus("error");
        interviewStore.setError(`Synthesis failed: ${message}`);
        throw e;
    }
}
