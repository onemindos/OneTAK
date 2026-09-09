<template>
    <div
        class='bubble'
        :class='`bubble--${message.role}`'
    >
        <span class='bubble__role'>{{ roleLabel }}</span>
        <span class='bubble__content'>{{ message.content }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AgentMessage } from '../types'

const props = defineProps<{ message: AgentMessage }>()

const roleLabel = computed(() => {
  switch (props.message.role) {
    case 'user':   return 'you'
    case 'agent':  return 'hermes'
    case 'tool':   return 'tool'
    case 'system': return 'sys'
    default:       return props.message.role
  }
})
</script>

<style scoped>
.bubble {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 6px;
  max-width: 90%;
}

.bubble--user {
  align-self: flex-end;
  background: #1e3a5f;
}

.bubble--agent {
  align-self: flex-start;
  background: #1e2a1e;
}

.bubble--tool {
  align-self: flex-start;
  background: #2a2a1e;
  font-family: monospace;
}

.bubble--system {
  align-self: center;
  background: transparent;
  opacity: 0.5;
  font-size: 11px;
}

.bubble__role {
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.6;
}

.bubble--user .bubble__role  { color: #4a9eff; }
.bubble--agent .bubble__role { color: #7b8cde; }
.bubble--tool .bubble__role  { color: #f0a500; }

.bubble__content {
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
