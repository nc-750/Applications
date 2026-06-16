<script setup lang="ts">
import { computed } from "vue";
import { Cell } from "@nc-750/lab-vue";
import { PersonaSkillCategory, type PersonaSkill } from "../../persona/models";
import { skillCategoryLabel, skillLevelLabel, skillSourceLabel } from "../reference";

const props = defineProps<{
    skills: PersonaSkill[];
}>();

// Groups skills by category in enum declaration order, dropping empty categories.
const groupedSkills = computed(() => {
    const groups: Array<{ category: PersonaSkillCategory; skills: PersonaSkill[] }> = [];
    for (const cat of Object.values(PersonaSkillCategory).filter(v => typeof v === "number") as PersonaSkillCategory[]) {
        const bucket = props.skills.filter(s => s.category === cat);
        if (bucket.length > 0) groups.push({ category: cat, skills: bucket });
    }
    return groups;
});
</script>

<template>
    <Cell title="SKILLS" spec="INS // 0x06" :grow="1">
        <span v-if="skills.length === 0" class="nc-text-sm nc-text-muted">—</span>
        <div v-else class="flex flex-col gap-3">
            <div v-for="group in groupedSkills" :key="group.category" class="flex flex-col gap-1">
                <span class="nc-label smc-cat-header">{{ skillCategoryLabel[group.category] }}</span>
                <div v-for="(skill, i) in group.skills" :key="i" class="smc-row">
                    <span class="nc-text-sm">{{ skill.name }}</span>
                    <span class="nc-label smc-level">{{ skillLevelLabel[skill.level] }}</span>
                    <span class="nc-text-xs nc-text-muted smc-source">{{ skillSourceLabel[skill.source] }}</span>
                </div>
            </div>
        </div>
    </Cell>
</template>

<style scoped>
/* kept: no .nc-* class for the category section divider */
.smc-cat-header {
    color: var(--nc-ink-3);
    border-bottom: var(--nc-border-width) solid var(--nc-line-subtle);
    padding-bottom: var(--nc-space-1);
    margin-bottom: var(--nc-space-1);
}

/* kept: no .nc-* class for this three-column skill row layout */
.smc-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: baseline;
    gap: var(--nc-space-3);
}

/* kept: no .nc-* class for right-aligned level badge */
.smc-level {
    text-align: right;
    white-space: nowrap;
}

/* kept: no .nc-* class for right-aligned source tag */
.smc-source {
    text-align: right;
    white-space: nowrap;
    font-family: var(--nc-font-mono);
}
</style>
