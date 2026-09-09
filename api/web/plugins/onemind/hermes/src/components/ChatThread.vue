<template>
  <div ref="threadEl" class="chat-thread">
    <MessageBubble
      v-for="msg in store.messages"
      :key="msg.id"
      :message="msg"
    />
    <div v-if="store.streaming" class="chat-thread__typing">
      <span>▋</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useAiStore } from '../store'
import MessageBubble from './MessageBubble.vue'

const store = useAiStore()
const threadEl = ref<HTMLElement | null>(null)

async function scrollBottom() {
  await nextTick()
  if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight
}

watch(() => store.messages.length, scrollBottom)
watch(() => store.streaming, (s) => { if (!s) scrollBottom() })
</script>

<style scoped>
.chat-thread {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-thread__typing {
  padding: 4px 10px;
  color: #7b8cde;
  animation: blink 1s step-start infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}
</style>
