<template>
    <div
        class="user-row"
        :class="{ 'user-row--talking': user.talking }"
    >
        <span class="user-row__indicator">{{ user.talking ? '🔊' : (user.selfMuted ? '🔇' : '·') }}</span>
        <span class="user-row__name">{{ user.name }}</span>
        <span
            v-if="user.muted || user.deafened"
            class="user-row__flags"
        >
            <span v-if="user.muted">M</span>
            <span v-if="user.deafened">D</span>
        </span>
    </div>
</template>

<script setup lang="ts">
import type { MumbleUser } from '../types'
defineProps<{ user: MumbleUser }>()
</script>

<style scoped>
.user-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 24px;
}

.user-row--talking {
  background: #0a1a0a;
}

.user-row__indicator {
  font-size: 12px;
  width: 16px;
}

.user-row__name {
  flex: 1;
  font-size: 12px;
  color: #ccc;
}

.user-row--talking .user-row__name {
  color: #44ff88;
}

.user-row__flags {
  font-size: 10px;
  color: #ff4444;
  display: flex;
  gap: 2px;
}
</style>
