import { connect, StringCodec, credsAuthenticator, type NatsConnection, type Subscription } from 'nats.ws'
import type { Pinia } from 'pinia'
import { useOpsStore } from './store'
import type { OpsMessage, OpsTask } from './types'

const SERVER_URL = 'wss://ws.onemindos.dev'
const sc = StringCodec()

let nc: NatsConnection | null = null
const subs: Subscription[] = []

export async function connectNats(pinia: Pinia, creds?: string): Promise<void> {
    const store = useOpsStore(pinia)

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

        subscribeInbox(pinia)
        subscribeTasks(pinia)
        subscribeAlerts(pinia)
    } catch (err) {
        console.error('[omos-ops] NATS connect failed:', err)
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

export function publish(subject: string, payload: string | Uint8Array): void {
    if (!nc) return
    nc.publish(subject, typeof payload === 'string' ? sc.encode(payload) : payload)
}

export function getNatsConnection(): NatsConnection | null {
    return nc
}

function subscribeInbox(pinia: Pinia) {
    if (!nc) return
    const store = useOpsStore(pinia)
    const sub = nc.subscribe('onemind.inbox.>')
    subs.push(sub)
    ;(async () => {
        for await (const msg of sub) {
            store.addMessage({
                id: `${msg.subject}-${Date.now()}`,
                subject: msg.subject,
                from: msg.headers?.get('from') ?? 'unknown',
                body: sc.decode(msg.data),
                receivedAt: Date.now(),
                read: false,
            } as OpsMessage)
        }
    })()
}

function subscribeTasks(pinia: Pinia) {
    if (!nc) return
    const store = useOpsStore(pinia)
    const sub = nc.subscribe('onemind.tasks.>')
    subs.push(sub)
    ;(async () => {
        for await (const msg of sub) {
            try {
                store.upsertTask(JSON.parse(sc.decode(msg.data)) as OpsTask)
            } catch {
                // malformed task payload — ignore
            }
        }
    })()
}

function subscribeAlerts(pinia: Pinia) {
    if (!nc) return
    const store = useOpsStore(pinia)
    const sub = nc.subscribe('onemind.alerts.>')
    subs.push(sub)
    ;(async () => {
        for await (const msg of sub) {
            store.addMessage({
                id: `alert-${msg.subject}-${Date.now()}`,
                subject: msg.subject,
                from: 'system',
                body: sc.decode(msg.data),
                receivedAt: Date.now(),
                read: false,
            } as OpsMessage)
        }
    })()
}
