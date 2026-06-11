import { ref } from "vue";
import { createEmptyPersona, Persona } from "../models/Persona";

export function usePersonaStore() {
    const persona = ref<Persona>(createEmptyPersona());

    async function loadPersona() {
        // Load from DB
    }

    async function savePerson(newPersona: Persona) {
        persona.value = newPersona;
        
        // Save to DB
    }

    async function clearPersona() {
        persona.value = createEmptyPersona();
    }

    return {
        persona,
        loadPersona,
        savePerson,
        clearPersona
    }
}