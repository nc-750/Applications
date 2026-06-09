import { defineStore } from "pinia";
import { useSettingsModule } from "./settings";
import { usePersonaModule } from "./persona";
import { useInterviewModule } from "./interview";
import { useLogModule } from "./log";

export const useMirrorStore = defineStore("mirror", () => {
  const settings = useSettingsModule();
  const persona = usePersonaModule();
  const interview = useInterviewModule();
  const log = useLogModule();

  return {
    // Settings — LLM config
    ...settings,
    // Persona
    ...persona,
    // Interview
    ...interview,
    // Log
    ...log,
  };
});

export type { LLMConfig } from "./settings";
