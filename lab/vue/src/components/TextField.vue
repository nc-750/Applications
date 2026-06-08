<script setup lang="ts">
import { inject } from 'vue';


defineProps<{
  id?:string,
  type: "text" | "url" | "tel" | "password",
  placeholder?: string
}>();

// Text-like input. The .nc-input class lives on the element itself;
// consumer class/style/attrs (type, placeholder, id, ...) fall through.
const model = defineModel<string>();
const id = inject<string>("form-field-id")
</script>

<template>
  <input 
    class="nc-input" 
    v-model="model"
    :id="id"
    :type="type"
    :placeholder="placeholder" />
</template>
