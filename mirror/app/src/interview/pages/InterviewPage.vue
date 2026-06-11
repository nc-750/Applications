<script setup lang="ts">
import { ref } from 'vue';
import InterviewPreparation from '../components/InterviewPreparation.vue';
import { useAppStore } from '../../AppStore.ts';
import { logger } from '../../logger/index.ts';
import { AttachedFile } from '../../lib/fileExtractor.ts';
import { ContentPart, createLLMClient, LLMClient, Message, ProviderKind } from '@nc-750/llm-ts';
import { Persona, PersonaMetrics } from '../../persona/models/Persona.ts';
import { buildInterviewSystemPrompt, buildNextQuestionSystemPrompt, buildPersonaMetricsSystemPrompt, buildPersonaMetricsUserPrompt } from '../prompts/index.ts';
import { ANALYZE_SCHEMA_NAME } from '../../persona/personaSchemas.ts';
import { ANALYSIS_JSON_SCHEMA, TurnAnalysisSchema } from '../prompts/analysisPrompt.ts';
import { extractFencedJSON } from '../prompts/interviewExtractor.ts';
import { TurnAnalysis } from '../../types/interview.ts';
import { PROBE_JSON_SCHEMA, PROBE_SCHEMA_NAME } from '../prompts/interviewPrompt.ts';
import { LLMProvider } from '../../settings/models/index.ts';

interface ProbeResult {
    context: string;
    question: string;
}

const personaStore = useAppStore().persona;
const isInterviewStarted = ref(false);
const isAnalyzing = ref(false);

function alertError(message: string) {
    logger.error("app", message);
}

async function startInterview(userInput: string, files?: AttachedFile[]) {    
    const llm = getLLMForInterview();
   
    if (!llm) {
        return;
    }

    isAnalyzing.value = true;

    const persona = personaStore.persona;
    const userMessage = transformInputDataForLLMInput(userInput, files);

    try {
        let metrics = await runPersonaMetricsAnalysis(
            "Can you please provide information about yourself?", 
            userMessage, 
            persona,
            llm
        );

        if (isPersonaAnalysisFinished(metrics.coverage)) {
            logger.debug("app", "Interview is finished: metrics reached coverage goals");
            finishInterview();
            return;
        }

        let result = await runFirstAnalysis(userMessage, metrics, persona, llm);
    } catch (e) {
        return;
    } finally {
        isAnalyzing.value = true;
    }
} 

function getLLMForInterview(): LLMClient | undefined {
    const settingsStore = useAppStore().settings;
    const llmConfig = settingsStore.llmConfig;

    if (!settingsStore.isLLMConfigured) {
        alertError("LLM not configured.");
        return undefined;
    }

    let provider: ProviderKind = "openai-compatible";
         
    switch (Number(llmConfig!.provider)) {
        case LLMProvider.OpenAI: 
            provider = "openai";
            break;
        case LLMProvider.Anthropic: 
            provider = "anthropic";
            break;
        case LLMProvider.CompatibleOpenAI: 
            provider = "openai-compatible";
            break;
    }
    
    const keyProvider = async () => llmConfig!.apiKey;

    const clientResult = createLLMClient({
        provider: provider,
        model: llmConfig!.model,
        keyProvider,
        baseUrl: llmConfig!.endpoint,
    });

    if (clientResult.ok) {
        return clientResult.value;
    }

    alertError(`Unable to create LLM Client: ${clientResult.error.message}`);
    return undefined;
}

function transformInputDataForLLMInput(userInput: string, files?: AttachedFile[]): Message {
    let fileContents: ContentPart[] = files?.map((file) => ({
        type: "text",
        text: file.text
    })) ?? [];

    let userMessage: ContentPart = {
        type: "text",
        text: userInput
    };

    return {
        role: "user",
        content: [
            ...fileContents,
            userMessage
        ]
    };
}

function updateDiscussion(inputMessage: Message, persona: Persona): Message[] {
    let previousMessages = persona.interview.messages
    
    return [
        ...previousMessages,
        inputMessage
    ]
}

async function runPersonaMetricsAnalysis(question: string, userAnswer: Message, persona: Persona, llm: LLMClient): Promise<TurnAnalysis> {
    const systemPrompt = buildPersonaMetricsSystemPrompt(persona.metrics);
    const userPrompt = buildPersonaMetricsUserPrompt(question, userAnswer, persona);
    const messages = [ systemPrompt, userPrompt ];

    const structuredResult = await llm.message(messages, {
        structured: {
            name: ANALYZE_SCHEMA_NAME,
            schema: ANALYSIS_JSON_SCHEMA,
            strict: false
        }
    });

    if (!structuredResult.ok && structuredResult.error.isAborted) {
        alertError(`Analysis aborted`);
        throw Error("Analysis aborted");
    }

    let parsedResponse = structuredResult.ok ? TurnAnalysisSchema.safeParse(structuredResult.value) : null;

    if (parsedResponse?.error) {
        alertError(`Couldn't parse structured response: ${parsedResponse.error.message}. Trying plain completion + lenient JSON extraction.`);
        
        const plainResult = await llm.message(messages);

        if (!plainResult.ok) {
            alertError(`Analysis failed: ${plainResult.error.message}`);
        }

        parsedResponse = plainResult.ok ? TurnAnalysisSchema.safeParse(extractFencedJSON(plainResult.value as string)) : null;

        if (parsedResponse?.error) {
            alertError(`Couldn't parse plain response: ${parsedResponse.error.message}`);
            throw Error(`Couldn't parse plain response: ${parsedResponse.error.message}`);
        }
    }

    return parsedResponse!.data;
}

/** Coerce a raw structured/extracted value into a probe, or null if unusable.
 *  Accepts a parsed object OR a JSON string (some providers return the JSON as
 *  text rather than a parsed object). */
function coerceProbe(raw: unknown): ProbeResult | null {
    let obj: unknown = raw;

    if (typeof obj === "string") obj = extractFencedJSON(obj);
    
    if (!obj || typeof obj !== "object") return null;
    
    const o = obj as Record<string, unknown>;
    const question = typeof o.question === "string" ? o.question.trim() : "";
    
    if (!question) return null;
    
    const context = typeof o.context === "string" ? o.context.trim() : "";
    
    return { context, question };
}

async function runFirstAnalysis(userMessage: Message, turnAnalysis: TurnAnalysis, persona: Persona, llm: LLMClient): Promise<ProbeResult> {
    const systemPrompt: Message = buildInterviewSystemPrompt(userMessage);
    
    persona.interview.messages.push(systemPrompt);

    return await runAnalysisForNextQuestion(turnAnalysis, persona, llm);
}

async function runAnalysisForNextQuestion(turnAnalysis: TurnAnalysis, persona: Persona, llm: LLMClient): Promise<ProbeResult> {
    const systemPrompt = buildNextQuestionSystemPrompt(turnAnalysis, persona);
    const history: Message[] = persona.interview.messages;
    const messages: Message[] = [ systemPrompt, ...history ];

    const structuredResponse = await llm.message(messages, {
        structured: { name: PROBE_SCHEMA_NAME, schema: PROBE_JSON_SCHEMA, strict: false }
    });

    let probe: ProbeResult | null = null
    
    if (structuredResponse.ok) {
        probe = coerceProbe(structuredResponse.value);
    } else {
        // The user aborted.
        return { context: "End of interview requested by user", question: "N/A" };
    }

    if (!probe) {
        const plainResponse = await llm.message(messages);

        if (!plainResponse.ok && !plainResponse.error.isAborted) {
            alertError(`Failed to get a response: ${plainResponse.error.message}`);
            return { context: `Failed to get a response: ${plainResponse.error.message}`, question: "N/A" };
        }

        const text = plainResponse.ok && typeof plainResponse.value === "string" ? plainResponse.value : "";
        probe = coerceProbe(text) ?? { context: "", question: text.trim() };
    }

    if (!probe.question) {
        alertError(`Didn't get a question in the LLM response`);
        return { context: `Didn't get a question in the LLM response`, question: "N/A" };
    }

    persona.interview.messages.push({
        role: "assistant",
        content: [{
            type: "text",
            text: `
            Acknowledge: ${probe.context}
            Question: ${probe.question}
            `
        }]
    });

    return probe;
}

function isPersonaAnalysisFinished(metrics: PersonaMetrics): boolean {
    const threshold = 0.75;
    const canConclude = Object.entries(metrics).every((m) => m[1] > threshold);

    return canConclude;
}

function finishInterview() {
    isAnalyzing.value = true;
}

function restartInterview() {

}
</script>

<template>
    <InterviewPreparation
        v-if="!isInterviewStarted"
        @start-interview="startInterview"
    />
    <!-- <InterviewInstrument/> -->
</template>
