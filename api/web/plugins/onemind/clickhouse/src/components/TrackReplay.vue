<template>
  <div class="track-replay">
    <div class="track-replay__header">
      Track Replay
      <span class="track-replay__count">{{ result.rowCount }} points</span>
    </div>
    <div class="track-replay__controls">
      <button class="track-replay__btn" @click="toggleReplay">
        {{ store.replay.active ? '⏸ Pause' : '▶ Play' }}
      </button>
      <input
        type="range"
        class="track-replay__slider"
        :min="minTime"
        :max="maxTime"
        :value="store.replay.currentTime"
        @input="onScrub"
      />
      <select class="track-replay__speed" v-model="store.replay.speedMultiplier">
        <option :value="1">1×</option>
        <option :value="5">5×</option>
        <option :value="10">10×</option>
        <option :value="60">60×</option>
      </select>
    </div>
    <div class="track-replay__time">
      {{ currentTimeLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useClickHouseStore } from '../store'
import type { ClickHouseResult } from '../types'

const props = defineProps<{ result: ClickHouseResult }>()
const store = useClickHouseStore()

const minTime = computed(() => {
    const times = props.result.rows.map(r => Number(r['timestamp'])).filter(Boolean)
    return times.length ? Math.min(...times) : 0
})

const maxTime = computed(() => {
    const times = props.result.rows.map(r => Number(r['timestamp'])).filter(Boolean)
    return times.length ? Math.max(...times) : 0
})

const currentTimeLabel = computed(() => {
    if (!store.replay.currentTime) return '—'
    return new Date(store.replay.currentTime).toISOString().replace('T', ' ').slice(0, 19)
})

function toggleReplay() {
    store.replay.active = !store.replay.active
    if (store.replay.active && !store.replay.currentTime) {
        store.replay.currentTime = minTime.value
    }
}

function onScrub(e: Event) {
    store.replay.currentTime = Number((e.target as HTMLInputElement).value)
}
</script>

<style scoped>
.track-replay {
  border-top: 1px solid #2a2a3a;
  padding: 8px 12px;
  background: #0a0c10;
}

.track-replay__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
}

.track-replay__count {
  color: #4a9eff;
}

.track-replay__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.track-replay__btn {
  background: #1a2a4a;
  color: #4a9eff;
  border: 1px solid #2a4a8a;
  border-radius: 3px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.track-replay__slider {
  flex: 1;
  accent-color: #4a9eff;
}

.track-replay__speed {
  background: #1a1a2a;
  color: #e0e0e0;
  border: 1px solid #2a2a3a;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 12px;
}

.track-replay__time {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}
</style>
