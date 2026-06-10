<script setup lang="ts">
import { Band, Cell } from "@nc-750/lab-vue";
import { computed } from "vue";

import { useRoute } from 'vue-router'
const route = useRoute()

const isWelcomePage = computed(() => route.name === "welcome");
const isSettingsPage = computed(() => route.name === "settings");

const cellLayout = computed(() => {
    let layout = "flex";

    if (isSettingsPage.value) {
        console.log(isSettingsPage)
        return layout + " justify-start";
    }

    if (isWelcomePage.value) {
        return layout + " justify-end";
    }

    return layout + " justify-between"
});
</script>

<template>
    <Band>
        <Cell title="" spec="" surface="brushed" variant="thin">
        <div :class="cellLayout">
            <router-link v-if="!isWelcomePage" to="/">Home</router-link>
            <router-link v-if="!isSettingsPage" to="/settings">Settings</router-link>
        </div>
        </Cell>
    </Band>
</template>