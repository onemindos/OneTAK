import { connect, StringCodec, type NatsConnection } from 'nats.ws'
import type { ThreeLayer } from './layer'
import type { XrEntityState } from '../../xr/src/types'

const SERVER_URL = 'wss://ws.onemindos.dev'
const sc = StringCodec()
let nc: NatsConnection | null = null

export async function connectNats(
    onConnected: (connected: boolean) => void,
    layer: ThreeLayer,
): Promise<void> {
    try {
        nc = await connect({
            servers: SERVER_URL,
            reconnect: true,
            maxReconnectAttempts: -1,
            reconnectTimeWait: 2000,
        })
        onConnected(true)
        nc.closed().then(() => onConnected(false))
        subscribeEntities(layer)
    } catch (err) {
        console.error('[omos-maplibre-three] NATS connect failed:', err)
    }
}

export async function disconnectNats(): Promise<void> {
    if (nc) {
        await nc.drain()
        nc = null
    }
}

function subscribeEntities(layer: ThreeLayer): void {
    if (!nc) return
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
                layer.upsertEntity(entity)
            } catch { /* skip malformed */ }
        }
    })()
}
