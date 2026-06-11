import { defineStore } from "pinia";
import { useSettingsStore } from "./settings/stores";
import { usePersonaStore } from "./persona/stores";
import { useLoggerStore } from "./logger/stores";

export const useAppStore = defineStore("app", () => {
  const settingsStore = useSettingsStore();
  const personaStore = usePersonaStore();
  const logStore = useLoggerStore();

  return {
    settings: {
        ...settingsStore
    },
    persona: {
        ...personaStore
    },
    logger: {
        ...logStore
    }
  };
});