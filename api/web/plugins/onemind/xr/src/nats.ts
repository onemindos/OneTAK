import { connect, StringCodec, type NatsConnection } from 'nats.ws'
import { useXrStore } from './store'
import type { XrEntityState } from './types'

const SERVER_URL = 'wss://ws.onemindos.dev'
const sc = StringCodec()
let nc: NatsConnection | null = null

export async function connectNats(): Promise<void> {
    const store = useXrStore()
    try {
        nc = await connect({
            servers: SERVER_URL,
            reconnect: true,
            maxReconnectAttempts: -1,
            reconnectTimeWait: 2000,
        })
        store.natsConnected = true
        nc.closed().then(() => { store.natsConnected = false })
        subscribeEntities()
    } catch (err) {
        console.error('[omos-xr] NATS connect failed:', err)
    }
}

export async function disconnectNats(): Promise<void> {
    if (nc) {
        await nc.drain()
        nc = null
    }
}

function subscribeEntities() {
    if (!nc) return
    const store = useXrStore()
    const sub = nc.subscribe('ent.*.*.state')
    ;(async () => {
        for await (const msg of sub) {
            try {
                const raw    = JSON.parse(sc.decode(msg.data))
                const parts  = msg.subject.split('.')
                const entity: XrEntityState = {
                    uid:      raw.uid      ?? parts[2] ?? 'unknown',
                    callsign: raw.callsign ?? raw.uid  ?? 'unknown',
                    lat:      Number(raw.lat  ?? raw.position?.lat  ?? 0),
                    lon:      Number(raw.lon  ?? raw.position?.lon  ?? 0),
                    hae:      Number(raw.hae  ?? raw.position?.hae  ?? 0),
                    type:     raw.type     ?? 'a-f-G',
                    speed:    raw.speed    !== undefined ? Number(raw.speed)  : undefined,
                    course:   raw.course   !== undefined ? Number(raw.course) : undefined,
                    stale:    !!raw.stale,
                    ts:       raw.ts ?? Date.now(),
                }
                store.upsertEntity(entity)
            } catch { /* skip malformed */ }
        }
    })()
}
