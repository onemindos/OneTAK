<template>
  <div class="ptt">
    <button
      class="ptt__btn"
      :class="{ 'ptt__btn--active': store.talking }"
      :disabled="store.connectionState !== 'connected'"
      @mousedown="startPtt"
      @mouseup="stopPtt"
      @touchstart.prevent="startPtt"
      @touchend.prevent="stopPtt"
    >
      {{ store.talking ? '🔴 Transmitting' : 'Hold to Talk' }}
    </button>
    <div class="ptt__hint">Space bar also works when panel is focused</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useMumbleStore } from '../store'
import { sendPttStart, sendPttStop } from '../mumble'

const store = useMumbleStore()

function startPtt() {
  if (store.connectionState !== 'connected') return
  store.talking = true
  sendPttStart()
}

function stopPtt() {
  store.talking = false
  sendPttStop()
}

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !e.repeat && !store.talking) {
    e.preventDefault()
    startPtt()
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    stopPtt()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<style scoped>
.ptt {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.ptt__btn {
  width: 100%;
  padding: 10px;
  background: #1a1a2a;
  color: #e0e0e0;
  border: 2px solid #2a2a4a;
  border-radius: 6px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
  user-select: none;
}

.ptt__btn:hover:not(:disabled) {
  background: #1a2a3a;
  border-color: #4a9eff;
}

.ptt__btn--active {
  background: #2a0a0a !important;
  border-color: #ff4444 !important;
  color: #ff4444;
}

.ptt__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ptt__hint {
  font-size: 10px;
  color: #444;
}
</style>
