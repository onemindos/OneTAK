<template>
    <div class='ops-view ops-activity'>
        <div class='ops-header'>
            <h2>Activity Log</h2>
            <div class='ops-header-actions'>
                <button
                    class='btn-icon'
                    title='Clear log'
                    @click='clearLog'
                >
                    ✕
                </button>
            </div>
        </div>

        <div
            v-if='log.length === 0'
            class='ops-empty'
        >
            No activity recorded yet.
        </div>

        <ul
            v-else
            class='ops-list'
        >
            <li
                v-for='entry in log'
                :key='entry.id'
                class='ops-item'
                :class='entry.level'
            >
                <span class='ops-time'>{{ formatTime(entry.ts) }}</span>
                <span class='ops-level'>{{ entry.level }}</span>
                <span class='ops-msg'>{{ entry.message }}</span>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface LogEntry { id: string; ts: number; level: 'info' | 'warn' | 'error'; message: string }

const log = ref<LogEntry[]>([])
let intervalId: ReturnType<typeof setInterval> | null = null

function addEntry(level: LogEntry['level'], message: string) {
  log.value.unshift({ id: `${Date.now()}-${Math.random()}`, ts: Date.now(), level, message })
  if (log.value.length > 1000) log.value.pop()
}

function clearLog() {
  log.value = []
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString()
}

// expose globally so NATS/plugin can log into this view
;(window as Record<string, unknown>).__omosOpsLog = addEntry

onMounted(() => {
  addEntry('info', 'omos-ops plugin loaded')
  // periodic heartbeat to show liveness
  intervalId = setInterval(() => {
    addEntry('info', 'heartbeat')
  }, 60_000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  delete (window as Record<string, unknown>).__omosOpsLog
})
</script>

<style scoped>
.ops-view { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.ops-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--border-color, #333); }
.ops-header h2 { margin: 0; font-size: 1rem; font-weight: 600; }
.ops-header-actions { margin-left: auto; }
.btn-icon { background: none; border: none; cursor: pointer; opacity: 0.7; font-size: 1rem; }
.ops-empty { padding: 24px 16px; opacity: 0.5; font-size: 0.875rem; }
.ops-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; font-family: monospace; font-size: 0.8rem; }
.ops-item { display: flex; gap: 10px; padding: 4px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.ops-item.warn { color: #ed8936; }
.ops-item.error { color: #e53e3e; }
.ops-time { opacity: 0.5; white-space: nowrap; }
.ops-level { width: 40px; text-transform: uppercase; font-size: 0.7rem; opacity: 0.7; }
.ops-msg { flex: 1; word-break: break-word; }
</style>
