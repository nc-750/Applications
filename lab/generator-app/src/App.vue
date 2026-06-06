<script setup lang="ts">
import Header from "./Header.vue";
import Main from "./Main.vue";
import GeneratorPanel from "./components/GeneratorPanel.vue";
</script>

<template>
    <div class="nc-lab">
        <div class="nc-chassis">
            <div class="nc-band">
                <GeneratorPanel />
                <Header />
                <Main />
            </div>
        </div>
    </div>
</template>

<style></style>
