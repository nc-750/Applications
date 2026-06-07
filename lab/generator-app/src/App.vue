<script setup lang="ts">
import { ref } from "vue";
import GeneratorPanel from "./components/GeneratorPanel.vue";
import StatusBar from "./components/StatusBar.vue";
import FooterBar from "./components/FooterBar.vue";
import CatalogView from "./components/CatalogView.vue";
import InspectView from "./components/InspectView.vue";
import BrandView from "./components/BrandView.vue";

const view = ref<"catalog" | "inspect" | "brand">("catalog");
</script>

<template>
  <div class="nc-lab flex-col items-center justify-start">
    <GeneratorPanel class="w-full shrink-0" />

    <div class="flex justify-center w-full pb-3 shrink-0 mt-3">
      <div class="nc-segment">
        <button
          :class="{ 'is-active': view === 'catalog' }"
          @click="view = 'catalog'"
        >
          Catalog
        </button>
        <button
          :class="{ 'is-active': view === 'inspect' }"
          @click="view = 'inspect'"
        >
          Inspect
        </button>
        <button
          :class="{ 'is-active': view === 'brand' }"
          @click="view = 'brand'"
        >
          Brand
        </button>
      </div>
    </div>

    <div class="nc-chassis">
      <StatusBar
        :partno="
          view === 'catalog'
            ? 'NC-750 // LAB // DESIGN SYSTEM'
            : view === 'inspect'
              ? 'NC-750 // NODE-0M // INSPECT'
              : 'NC-750'
        "
      >
        <template v-if="view === 'catalog'">
          <span class="nc-led nc-led--on">LOCAL</span>
          <span class="nc-led nc-led--on">READY</span>
        </template>
        <template v-else-if="view === 'inspect'">
          <span class="nc-led nc-led--on">LOCAL</span>
          <span class="nc-led nc-led--rec">ANALYZING</span>
        </template>
      </StatusBar>

      <CatalogView v-if="view === 'catalog'" />
      <InspectView v-if="view === 'inspect'" />
      <BrandView v-if="view === 'brand'" />

      <FooterBar partno="NC-750 // 0x00">
        <div class="nc-barcode w-32" />
      </FooterBar>
    </div>
  </div>
</template>
