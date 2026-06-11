import { defineStore } from "pinia";
import { useSettingsModule } from "./settings";
import { ref, computed } from "vue";
import { Persona } from "../../persona/models/Persona";
import { useLogModule } from "./log";

export const useMirrorStore = defineStore("mirror", () => {
  const settings = useSettingsModule();
  const persona = usePersonaStore();
  const log = useLogModule();

  return {
    ...settings,
    ...persona,
    ...log
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