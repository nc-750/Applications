// import { defineStore } from "pinia";
// import { ref, computed } from "vue";
// import { Persona } from "../../persona/models/Persona";
// import { useLogModule } from "./log";
// import { useSettingsStore } from "../../settings/stores";

// export const useMirrorStore = defineStore("mirror", () => {
//   const settings = useSettingsStore();
//   const persona = usePersonaStore();
//   const log = useLogModule();

//   return {
//     ...settings,
//     ...persona,
//     ...log
//   };
// });

// function usePersonaStore() {
//   const persona = ref<Persona | null>(null);
//   const isPersonaValid = computed(() => persona !== null);

//   return {
//     persona,
//     isPersonaValid
//   };
// }