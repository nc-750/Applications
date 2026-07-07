// Display-string lookups and facet definitions for the insight view.
//
// Reference data, not a domain model (CONVENTIONS 1.2 / 6.10): the enums are owned by
// `persona/models`; this module only maps each value to the human label the read-only
// insight view prints. It is the single shared copy of these maps so no insight
// component re-implements an enum→label switch (7.8).

import {
    PersonaSkillCategory,
    PersonaSkillLevel,
    PersonaSkillSource,
    PersonaGoalType,
    type PersonaMetrics,
} from "../../persona/models";

export const METRICS_FACETS: Array<{ key: keyof PersonaMetrics; label: string }> = [
    { key: "story",     label: "STORY" },
    { key: "strengths", label: "STRENGTHS" },
    { key: "growth",    label: "GROWTH" },
    { key: "drivers",   label: "DRIVERS" },
];

export const skillCategoryLabel: Record<PersonaSkillCategory, string> = {
    [PersonaSkillCategory.Technical]: "Technical",
    [PersonaSkillCategory.Soft]: "Soft",
    [PersonaSkillCategory.Domain]: "Domain",
    [PersonaSkillCategory.Language]: "Language",
    [PersonaSkillCategory.Transversal]: "Transversal",
    [PersonaSkillCategory.Tool]: "Tool",
    [PersonaSkillCategory.Other]: "Other",
};

export const skillLevelLabel: Record<PersonaSkillLevel, string> = {
    [PersonaSkillLevel.Beginner]: "Beginner",
    [PersonaSkillLevel.Intermediate]: "Intermediate",
    [PersonaSkillLevel.Advanced]: "Advanced",
    [PersonaSkillLevel.Expert]: "Expert",
    [PersonaSkillLevel.Native]: "Native",
};

export const skillSourceLabel: Record<PersonaSkillSource, string> = {
    [PersonaSkillSource.Professional]: "Professional",
    [PersonaSkillSource.Personal]: "Personal",
    [PersonaSkillSource.Inferred]: "Inferred",
};

export const goalTypeLabel: Record<PersonaGoalType, string> = {
    [PersonaGoalType.ShortTerm]: "Short-term",
    [PersonaGoalType.LongTerm]: "Long-term",
};
