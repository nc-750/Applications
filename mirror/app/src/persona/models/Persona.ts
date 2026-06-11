import { Message } from "@nc-750/llm-ts"

export interface Persona {
    metadata: PersonaMetadata,
    metrics: PersonaMetrics,
    strengths: string[],
    weaknesses: string[],
    skills: PersonaSkill[],
    carreer: PersonaCareer[],
    personal: PersonaCareer[],
    traits: PersonaTrait[],
    values: string[],
    hiddenAssets: string[],
    goals: PersonaGoal[],
    interview: PersonaInterview
}

export interface PersonaMetrics {
    story: number
    strength: number,
    hidden: number,
    growth: number,
    drivers: number
}

export enum PersonaSkillCategory { Technical, Soft, Domain, Language, Transversal, Tool }
export enum PersonaSkillLevel { Beginner, Intermediate, Advanced, Expert, Native }
export enum PersonaSkillSource { Professional, Personal, Inferred }

export interface PersonaSkill {
    category: PersonaSkillCategory,
    level: PersonaSkillLevel,
    source: PersonaSkillSource
}

export interface PersonaCareer {
    dateState: Date,
    dateEnd: Date,
    role: string,
    highlights: string[],
    organization?: string,
    realStory?: string,
    skillsRevealed?: PersonaSkill[],
    note?: string
}

export interface PersonaTrait {
    dimension: string,
    position: number,
    note?: string
}

export enum PersonaGoalType { ShortTerm, LongTerm }

export interface PersonaGoal {
    type: PersonaGoalType,
    description: string
}

export interface PersonaMetadata {
    sourceUsed: string[],
    language: string,
    createdAt: number,
    version: string
}

export interface PersonaInterview {
    messages: Message[]
}

export function createEmptyPersona(): Persona {
    return {
        metadata: {
            createdAt: Date.now(),
            language: "en-us",
            sourceUsed: [],
            version: "1.0"
        },
        metrics: {
            drivers: 0,
            story: 0,
            strength: 0,
            hidden: 0,
            growth: 0
        },
        strengths: [],
        weaknesses: [],
        skills: [],
        carreer: [],
        personal: [],
        traits: [],
        values: [],
        hiddenAssets: [],
        goals: [],
        interview: {
            messages: []
        }
    };
}