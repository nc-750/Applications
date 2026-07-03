<script setup lang="ts">
import ShowcaseColor from "./ShowcaseColor.vue";
import ShowcaseTypography from "./ShowcaseTypography.vue";
import ShowcaseButtons from "./ShowcaseButtons.vue";
import ShowcaseControls from "./ShowcaseControls.vue";
import ShowcaseInputs from "./ShowcaseInputs.vue";
import ShowcaseDisplays from "./ShowcaseDisplays.vue";
import ShowcaseStatus from "./ShowcaseStatus.vue";
import ShowcaseNavigation from "./ShowcaseNavigation.vue";
import ShowcaseArchitecture from "./ShowcaseArchitecture.vue";
</script>

<template>
  <div class="nc-band">
    <div class="nc-cell nc-cell--grow-2"><ShowcaseColor /></div>
    <div class="nc-cell"><ShowcaseTypography /></div>
  </div>

  <div class="nc-band">
    <div class="nc-cell"><ShowcaseButtons /></div>
  </div>

  <div class="nc-band">
    <div class="nc-cell nc-cell--grow-2"><ShowcaseControls /></div>
    <div class="nc-cell"><ShowcaseInputs /></div>
  </div>

  <div class="nc-band">
    <div class="nc-cell"><ShowcaseDisplays /></div>
    <div class="nc-cell"><ShowcaseStatus /></div>
  </div>

  <div class="nc-band">
    <div class="nc-cell"><ShowcaseNavigation /></div>
    <div class="nc-cell"><ShowcaseArchitecture /></div>
  </div>
</template>
