<script setup lang="ts">
defineProps<{
  /** Display name shown next to the avatar. */
  name?: string;
  /** Timestamp string (e.g. "12:34 PM"). */
  time?: string;
  /** Avatar image URL. If omitted and no avatar slot, the avatar is hidden. */
  avatarSrc?: string;
  /** Alt text for the avatar image. */
  avatarAlt?: string;
}>();
</script>

<template>
  <div class="nc-message__header">
    <div v-if="avatarSrc || $slots.avatar" class="nc-avatar nc-avatar--sm">
      <slot name="avatar">
        <img v-if="avatarSrc" :src="avatarSrc" :alt="avatarAlt ?? ''" />
      </slot>
    </div>
    <span v-if="name" class="nc-message__name">{{ name }}</span>
    <span v-if="time" class="nc-message__time">{{ time }}</span>
    <slot />
  </div>
</template>
