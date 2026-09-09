<template>
  <div class="ops-view ops-inbox">
    <div class="ops-header">
      <h2>Inbox</h2>
      <span v-if="unread > 0" class="badge">{{ unread }}</span>
      <div class="ops-header-actions">
        <button class="btn-icon" title="Mark all read" @click="markAllRead">✓</button>
      </div>
    </div>

    <div v-if="store.messages.length === 0" class="ops-empty">
      No messages. Listening on <code>onemind.inbox.&gt;</code>
    </div>

    <ul v-else class="ops-list">
      <li
        v-for="msg in store.messages"
        :key="msg.id"
        class="ops-item"
        :class="{ unread: !msg.read }"
        @click="store.markRead(msg.id)"
      >
        <div class="ops-item-header">
          <span class="ops-subject">{{ msg.subject }}</span>
          <span class="ops-time">{{ formatTime(msg.receivedAt) }}</span>
        </div>
        <div class="ops-item-from">{{ msg.from }}</div>
        <div class="ops-item-body">{{ msg.body }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOpsStore } from '../store'

const store = useOpsStore()
const unread = computed(() => store.unreadCount())

function markAllRead() {
  store.messages.forEach(m => { m.read = true })
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString()
}
</script>

<style scoped>
.ops-view { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.ops-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--border-color, #333); }
.ops-header h2 { margin: 0; font-size: 1rem; font-weight: 600; }
.badge { background: #e53e3e; color: #fff; border-radius: 10px; padding: 1px 7px; font-size: 0.75rem; }
.ops-header-actions { margin-left: auto; }
.btn-icon { background: none; border: none; cursor: pointer; opacity: 0.7; font-size: 1rem; }
.ops-empty { padding: 24px 16px; opacity: 0.5; font-size: 0.875rem; }
.ops-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
.ops-item { padding: 10px 16px; border-bottom: 1px solid var(--border-color, #333); cursor: pointer; transition: background 0.1s; }
.ops-item:hover { background: rgba(255,255,255,0.04); }
.ops-item.unread { border-left: 3px solid #48bb78; }
.ops-item-header { display: flex; justify-content: space-between; align-items: center; }
.ops-subject { font-size: 0.8rem; font-family: monospace; opacity: 0.7; }
.ops-time { font-size: 0.75rem; opacity: 0.5; }
.ops-item-from { font-size: 0.8rem; opacity: 0.6; margin-top: 2px; }
.ops-item-body { font-size: 0.875rem; margin-top: 4px; word-break: break-word; }
</style>
