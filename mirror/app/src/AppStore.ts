import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useSettingsStore } from "./settings/stores";
import { useLogModule } from "./stores/mirror/log";

export const useAppStore = defineStore("app", () => {
  const settingsStore = useSettingsStore();
  const personaStore = usePersonaStore();
  const logStore = useLogModule();

  return {
    settings: {
        ...settingsStore
    },
    persona: {
        ...personaStore
    },
    log: {
        ...logStore
    }
  };
});

function usePersonaStore() {
  const persona = ref<Persona | null>(null);
  const isPersonaValid = computed(() => persona !== null);

  return {
    persona,
    isPersonaValid
  };
}