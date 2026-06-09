import { defineStore } from "pinia";
import { useSettingsModule } from "./settings";

export const useMirrorStore = defineStore("mirror", () => {
  const settings = useSettingsModule();

  return {
    // Settings — LLM config
    ...settings,
  };
});

export type { LLMConfig } from "./settings";
