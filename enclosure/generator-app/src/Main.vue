<script setup lang="ts">
import ShowcaseColor from "./components/ShowcaseColor.vue";
import ShowcaseTypography from "./components/ShowcaseTypography.vue";
import ShowcaseButtons from "./components/ShowcaseButtons.vue";
import ShowcaseChat from "./components/ShowcaseChat.vue";
import ShowcaseControls from "./components/ShowcaseControls.vue";
import ShowcaseInputs from "./components/ShowcaseInputs.vue";
import ShowcaseDisplays from "./components/ShowcaseDisplays.vue";
import ShowcaseStatus from "./components/ShowcaseStatus.vue";
import ShowcaseNavigation from "./components/ShowcaseNavigation.vue";
import ShowcaseArchitecture from "./components/ShowcaseArchitecture.vue";
</script>

<template>
    <main class="flex flex-col">
        <!-- =====================================================
             FOUNDATIONS: Color + Typography (3 cols, default seam)
             ===================================================== -->
        <div class="flex">
            <div class="nc-cell flex-2/4">
                <ShowcaseColor />
            </div>
            <div class="nc-cell flex-1/4">
                <ShowcaseTypography />
            </div>
        </div>

        <!-- =====================================================
             INTERACTION: Buttons + Controls + Inputs (3 cols)
             ===================================================== -->
        <div class="grid grid-cols-3">
            <div class="nc-cell col-span-3">
                <ShowcaseButtons />
            </div>
            <div class="nc-cell col-span-3">
                <ShowcaseChat />
            </div>
            <div class="nc-cell col-span-2">
                <ShowcaseControls />
            </div>
            <div class="nc-cell">
                <ShowcaseInputs />
            </div>
        </div>

        <!-- =====================================================
             DATA: Displays + Status (2 cols, hairline seam)
             ===================================================== -->
        <div class="grid grid-cols-2">
            <div class="nc-cell col-span-2">
                <ShowcaseDisplays />
            </div>
            <div class="nc-cell col-span-2">
                <ShowcaseStatus />
            </div>
        </div>

        <!-- =====================================================
             SYSTEM: Navigation + Architecture (2 cols, accent seam)
             ===================================================== -->
        <div class="grid grid-cols-2">
            <div class="nc-cell">
                <ShowcaseNavigation />
            </div>
            <div class="nc-cell">
                <ShowcaseArchitecture />
            </div>
        </div>
    </main>
</template>

<style></style>
