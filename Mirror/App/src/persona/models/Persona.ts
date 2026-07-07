import type { TranscriptMessage } from "../../core/Transcript"

export interface PersonaDerived {
    howIWorkBest: string[]
    cvSummary: string | null
    linkedinAbout: string | null
    interviewPitch: string | null
}

export interface Persona {
    metadata: PersonaMetadata,
    metrics: PersonaMetrics,
    strengths: PersonaStrength[],
    weaknesses: PersonaWeakness[],
    skills: PersonaSkill[],
    career: PersonaCareer[],
    personal: PersonaCareer[],
    traits: PersonaTrait[],
    values: string[],
    hiddenAssets: string[],
    goals: PersonaGoal[],
    interview: PersonaInterview,
    derived: PersonaDerived,
}

export interface PersonaMetrics {
    story: number
    strengths: number,
    growth: number,
    drivers: number
}

export interface PersonaStrength {
    title: string,
    description: string
}

export interface PersonaWeakness {
    title: string,
    description: string
}


export enum PersonaSkillCategory { Technical, Soft, Domain, Language, Transversal, Tool, Other }
export enum PersonaSkillLevel { Beginner, Intermediate, Advanced, Expert, Native }
export enum PersonaSkillSource { Professional, Personal, Inferred }

export interface PersonaSkill {
    name: string,
    category: PersonaSkillCategory,
    level: PersonaSkillLevel,
    source: PersonaSkillSource
}

export interface PersonaCareer {
    dateStart: number,
    dateEnd: number,
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
    messages: TranscriptMessage[]
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
            strengths: 0,
            growth: 0
        },
        strengths: [],
        weaknesses: [],
        skills: [],
        career: [],
        personal: [],
        traits: [],
        values: [],
        hiddenAssets: [],
        goals: [],
        interview: {
            messages: []
        },
        derived: {
            howIWorkBest: [],
            cvSummary: null,
            linkedinAbout: null,
            interviewPitch: null,
        },
    };
}