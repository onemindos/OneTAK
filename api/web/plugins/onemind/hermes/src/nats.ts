import { connect, StringCodec, credsAuthenticator, type NatsConnection, type Subscription } from 'nats.ws'
import type { Pinia } from 'pinia'
import { useAiStore } from './store'
import type { AgentMessage, ToolCall, HermesPrompt } from './types'

const SERVER_URL = 'wss://ws.onemindos.dev'
const SUBJECT_PROMPT   = 'agents.prompt.hermes.zeus.legacy'
const SUBJECT_RESPONSE = 'agents.response.hermes.zeus.legacy'
const SUBJECT_TOOL     = 'agents.tool.hermes.zeus.legacy'

const sc = StringCodec()
let nc: NatsConnection | null = null
const subs: Subscription[] = []

export async function connectNats(pinia: Pinia, creds?: string): Promise<void> {
    const store = useAiStore(pinia)

    try {
        nc = await connect({
            servers: SERVER_URL,
            authenticator: creds ? credsAuthenticator(new TextEncoder().encode(creds)) : undefined,
            reconnect: true,
            maxReconnectAttempts: -1,
            reconnectTimeWait: 2000,
        })

        store.connected = true

        nc.closed().then(() => {
            store.connected = false
        })

        subscribeResponses(pinia)
        subscribeToolCalls(pinia)
    } catch (err) {
        console.error('[omos-ai] NATS connect failed:', err)
        store.connected = false
    }
}

export async function disconnectNats(): Promise<void> {
    subs.forEach(s => s.unsubscribe())
    subs.length = 0
    if (nc) {
        await nc.drain()
        nc = null
    }
}

export function sendPrompt(content: string, context?: string): string {
    if (!nc) {
        console.warn('[omos-ai] NATS not connected')
        return ''
    }
    const id = `prompt-${Date.now()}`
    const payload: HermesPrompt = { id, content, context, timestamp: Date.now() }
    nc.publish(SUBJECT_PROMPT, sc.encode(JSON.stringify(payload)))
    return id
}

export function approveToolCall(callId: string): void {
    if (!nc) return
    nc.publish(`${SUBJECT_TOOL}.approve`, sc.encode(JSON.stringify({ id: callId })))
}

export function denyToolCall(callId: string): void {
    if (!nc) return
    nc.publish(`${SUBJECT_TOOL}.deny`, sc.encode(JSON.stringify({ id: callId })))
}

function subscribeResponses(pinia: Pinia) {
    if (!nc) return
    const store = useAiStore(pinia)
    const sub = nc.subscribe(SUBJECT_RESPONSE)
    subs.push(sub)
    ;(async () => {
        for await (const msg of sub) {
            try {
                const data = JSON.parse(sc.decode(msg.data)) as AgentMessage
                store.streaming = !!data.streaming
                store.addMessage(data)
            } catch {
                // malformed response — ignore
            }
        }
    })()
}

function subscribeToolCalls(pinia: Pinia) {
    if (!nc) return
    const store = useAiStore(pinia)
    const sub = nc.subscribe(SUBJECT_TOOL)
    subs.push(sub)
    ;(async () => {
        for await (const msg of sub) {
            try {
                const call = JSON.parse(sc.decode(msg.data)) as ToolCall
                store.upsertToolCall(call)
            } catch {
                // malformed tool call — ignore
            }
        }
    })()
}
