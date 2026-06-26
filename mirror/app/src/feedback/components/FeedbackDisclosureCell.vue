<script setup lang="ts">
// FeedbackDisclosureCell — content-only disclosure cell for the feedback modal.
//
// Prop-less, emit-less, logic-free. Renders two disclosure copy blocks that
// satisfy ETHOS C1.3 (plain-words disclosure) and C7.2/C7.5 (claims literally
// true). Wired into the modal's #disclosure slot in Phase 5.
//
// nc-750-web-frontend-architecture: CONVENTIONS 7 — one job per component;
//   view renders, no logic, no store, no service.
// nc-750-frontend-presentation: content cell on a light surface; no monitor
//   cavity (no input).
// ETHOS C1.3: names the destination and the local transport path.
// ETHOS C7.3: discloses what is sent, where, and why.
// ETHOS C7.2/C7.5: claims match the mailto: transport — no "we send",
//   no "we receive", no "message sent", no "email sent".
</script>

<template>
  <div class="fdc-root nc-text-sm">
    <p class="fdc-block">
      <strong>What helps most:</strong> a clear description of the bug or the
      idea, and the steps that led to it. The more concrete, the more useful.
    </p>
    <p class="fdc-block nc-text-muted">
      Sending opens your own email app with a pre-filled message to
      support@nc-750.com. Mirror does not transmit anything itself, and keeps
      no copy. You review and send the email from your own mail client.
    </p>
  </div>
</template>

<style scoped>
.fdc-root {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.fdc-block {
  margin: 0;
  line-height: 1.5;
}
</style>
