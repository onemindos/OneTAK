<template>
    <div class="tool-card">
        <div class="tool-card__header">
            <span class="tool-card__name">{{ call.name }}</span>
            <span class="tool-card__badge">tool request</span>
        </div>
        <pre class="tool-card__args">{{ formattedArgs }}</pre>
        <div class="tool-card__actions">
            <button
                class="tool-card__btn tool-card__btn--approve"
                @click="approve"
            >
                Approve
            </button>
            <button
                class="tool-card__btn tool-card__btn--deny"
                @click="deny"
            >
                Deny
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { approveToolCall, denyToolCall } from '../nats'
import { useAiStore } from '../store'
import type { ToolCall } from '../types'

const props = defineProps<{ call: ToolCall }>()
const store = useAiStore()

const formattedArgs = computed(() =>
  JSON.stringify(props.call.args, null, 2)
)

function approve() {
  approveToolCall(props.call.id)
  store.upsertToolCall({ ...props.call, status: 'approved' })
}

function deny() {
  denyToolCall(props.call.id)
  store.upsertToolCall({ ...props.call, status: 'denied' })
}
</script>

<style scoped>
.tool-card {
  margin: 6px 8px;
  padding: 8px 10px;
  background: #1e1e0e;
  border: 1px solid #f0a500;
  border-radius: 6px;
}

.tool-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.tool-card__name {
  font-weight: bold;
  color: #f0a500;
}

.tool-card__badge {
  font-size: 10px;
  background: #2a200a;
  color: #f0a500;
  padding: 1px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tool-card__args {
  font-size: 11px;
  color: #c8c8a0;
  margin: 0 0 8px 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.tool-card__actions {
  display: flex;
  gap: 6px;
}

.tool-card__btn {
  flex: 1;
  padding: 4px;
  border: none;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  font-weight: bold;
}

.tool-card__btn--approve {
  background: #1a3a1a;
  color: #44ff88;
  border: 1px solid #44ff88;
}

.tool-card__btn--deny {
  background: #3a1a1a;
  color: #ff4444;
  border: 1px solid #ff4444;
}
</style>
