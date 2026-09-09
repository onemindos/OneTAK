<template>
    <div class="mumble-panel">
        <div class="mumble-panel__header">
            <span class="mumble-panel__title">Mumble</span>
            <span
                class="mumble-panel__status"
                :class="`mumble-panel__status--${store.connectionState}`"
            >
                {{ store.connectionState }}
            </span>
        </div>

        <div class="mumble-panel__body">
            <ChannelTree />
        </div>

        <div
            v-if="store.activeSpeakers.length"
            class="mumble-panel__speaking"
        >
            <span
                v-for="u in store.activeSpeakers"
                :key="u.session"
                class="mumble-panel__speaker"
            >
                🔊 {{ u.name }}
            </span>
        </div>

        <PttButton class="mumble-panel__ptt" />
    </div>
</template>

<script setup lang="ts">
import { useMumbleStore } from '../store'
import ChannelTree from './ChannelTree.vue'
import PttButton from './PttButton.vue'

const store = useMumbleStore()
</script>

<style scoped>
.mumble-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #12141a;
  color: #e0e0e0;
  font-family: monospace;
  font-size: 13px;
}

.mumble-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #2a2a3a;
  background: #0a0c10;
}

.mumble-panel__title {
  font-weight: bold;
  color: #5b8dee;
  letter-spacing: 0.05em;
}

.mumble-panel__status {
  font-size: 11px;
}

.mumble-panel__status--connected    { color: #44ff88; }
.mumble-panel__status--connecting   { color: #f0a500; }
.mumble-panel__status--disconnected { color: #888; }
.mumble-panel__status--error        { color: #ff4444; }

.mumble-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.mumble-panel__speaking {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 12px;
  background: #0a1a0a;
  border-top: 1px solid #1a3a1a;
}

.mumble-panel__speaker {
  font-size: 12px;
  color: #44ff88;
}

.mumble-panel__ptt {
  border-top: 1px solid #2a2a3a;
}
</style>
