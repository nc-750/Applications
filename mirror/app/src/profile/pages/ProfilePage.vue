<script setup lang="ts">
// TODO: Rebuild the profile feature with the same layered treatment as the
// other features (model → db → mappers → store → services → view). The old
// renderer-based implementation (profile/services/profileRenderer.ts + html.ts)
// was deleted in the dead-code cleanup because it imported the removed
// src/types/persona module. The /profile route is kept active so navigation
// does not break; this page renders an empty placeholder until the refactor.

import { Band, Cell } from "@nc-750/lab-vue";
</script>

<template>
    <!-- TODO: profile feature view — see the script comment above. -->
     <Band :grow="1">
        <Cell title="PROFILE" spec="PRF // 0x01">
            <div class="h-full flex flex-col items-center justify-center text-center">
                <h1 class="nc-heading-3 mb-4">
                    In Construction
                </h1>

                <p class="nc-text-secondary nc-text-sm max-w-lg mb-4">
                    Your personal profile, publisheable.<br/>
                    Use in portfolio, link to recruiters, use however you want.<br/>
                    Free to modify.
                </p>
            </div>
        </Cell>
     </Band>
</template>
