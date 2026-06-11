import { defineStore } from "pinia";
import { useSettingsStore } from "./settings/stores";
import { useLogModule } from "./stores/mirror/log";
import { usePersonaStore } from "./persona/stores";

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