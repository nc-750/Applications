<script setup lang="ts">
import Header from "./Header.vue";
import Main from "./Main.vue";
import GeneratorPanel from "./components/GeneratorPanel.vue";
</script>

<template>
    <div class="nc-shell">
        <div class="nc-module">
            <div class="nc-faceplate">
                <GeneratorPanel />
                <Header />
                <Main />
            </div>
        </div>
    </div>
</template>

<style></style>
