export interface AgentMessage {
    id: string
    role: 'user' | 'agent' | 'tool' | 'system'
    content: string
    timestamp: number
    streaming?: boolean
}

export interface ToolCall {
    id: string
    name: string
    args: Record<string, unknown>
    status: 'pending' | 'approved' | 'denied'
    result?: string
    requestedAt: number
}

export interface HermesPrompt {
    id: string
    content: string
    context?: string
    timestamp: number
}
