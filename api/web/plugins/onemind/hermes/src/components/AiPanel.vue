<template>
    <div class="ai-panel">
        <div class="ai-panel__header">
            <span class="ai-panel__title">Hermes</span>
            <span
                class="ai-panel__status"
                :class="{ 'ai-panel__status--on': store.connected }"
            >
                {{ store.connected ? 'online' : 'offline' }}
            </span>
        </div>

        <ToolCard
            v-for="call in store.pendingToolCalls"
            :key="call.id"
            :call="call"
        />

        <ChatThread class="ai-panel__thread" />

        <PromptInput
            class="ai-panel__input"
            :disabled="!store.connected || store.streaming"
            @send="onSend"
        />
    </div>
</template>

<script setup lang="ts">
import { useAiStore } from '../store'
import { sendPrompt } from '../nats'
import ChatThread from './ChatThread.vue'
import PromptInput from './PromptInput.vue'
import ToolCard from './ToolCard.vue'

const store = useAiStore()

function onSend(content: string) {
  const id = sendPrompt(content)
  if (!id) return
  store.addMessage({
    id: `user-${id}`,
    role: 'user',
    content,
    timestamp: Date.now(),
  })
}
</script>

<style scoped>
.ai-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a2e;
  color: #e0e0e0;
  font-family: monospace;
  font-size: 13px;
}

.ai-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #2a2a4a;
  background: #0f0f1e;
}

.ai-panel__title {
  font-weight: bold;
  letter-spacing: 0.05em;
  color: #7b8cde;
}

.ai-panel__status {
  font-size: 11px;
  color: #ff4444;
}

.ai-panel__status--on {
  color: #44ff88;
}

.ai-panel__thread {
  flex: 1;
  overflow-y: auto;
}

.ai-panel__input {
  border-top: 1px solid #2a2a4a;
}
</style>
