import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AgentMessage, ToolCall } from './types'

export const useAiStore = defineStore('omos-ai', () => {
    const messages = ref<AgentMessage[]>([])
    const toolCalls = ref<ToolCall[]>([])
    const connected = ref(false)
    const streaming = ref(false)

    function addMessage(msg: AgentMessage) {
        const idx = messages.value.findIndex(m => m.id === msg.id)
        if (idx >= 0) {
            messages.value[idx] = msg
        } else {
            messages.value.push(msg)
        }
    }

    function upsertToolCall(call: ToolCall) {
        const idx = toolCalls.value.findIndex(t => t.id === call.id)
        if (idx >= 0) toolCalls.value[idx] = call
        else toolCalls.value.push(call)
    }

    const pendingToolCalls = computed(() =>
        toolCalls.value.filter(t => t.status === 'pending')
    )

    return {
        messages,
        toolCalls,
        connected,
        streaming,
        pendingToolCalls,
        addMessage,
        upsertToolCall,
    }
})
