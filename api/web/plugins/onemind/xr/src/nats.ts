import { connect, StringCodec, type NatsConnection } from 'nats.ws'
import { useXrStore } from './store'
import type { XrEntityState } from './types'

const SERVER_URL = import.meta.env.VITE_NATS_WS_URL ?? 'wss://ws.onemindos.dev'
const STALE_TTL  = 5 * 60_000  // prune entities unseen for 5 minutes

const sc = StringCodec()
let nc: NatsConnection | null = null
let pruneTimer: ReturnType<typeof setInterval> | null = null

export async function connectNats(): Promise<void> {
    const store = useXrStore()
    try {
        const opts: Parameters<typeof connect>[0] = {
            servers: SERVER_URL,
            reconnect: true,
            maxReconnectAttempts: -1,
            reconnectTimeWait: 2000,
        }
        const user = import.meta.env.VITE_NATS_WS_USER
        const pass = import.meta.env.VITE_NATS_WS_PASS
        if (user && pass) { opts.user = user; opts.pass = pass }

        nc = await connect(opts)
        store.natsConnected = true
        nc.closed().then(() => { store.natsConnected = false })

        subscribeEntities()
        subscribeCot()
        pruneTimer = setInterval(() => pruneStale(store), 30_000)
    } catch (err) {
        console.error('[omos-xr] NATS connect failed:', err)
    }
}

export async function disconnectNats(): Promise<void> {
    if (pruneTimer) { clearInterval(pruneTimer); pruneTimer = null }
    if (nc) {
        await nc.drain()
        nc = null
    }
}

export async function publishHermesCommand(text: string): Promise<void> {
    if (!nc) return
    const payload = JSON.stringify({ text, session: 'xr', ts: Date.now() })
    nc.publish('agents.prompt.hermes.zeus.legacy', sc.encode(payload))
}

function upsertFromRaw(store: ReturnType<typeof useXrStore>, raw: any, fallbackUid: string) {
    const entity: XrEntityState = {
        uid:      raw.uid      ?? fallbackUid,
        callsign: raw.callsign ?? raw.uid ?? fallbackUid,
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
}

function subscribeEntities() {
    if (!nc) return
    const store = useXrStore()
    const sub = nc.subscribe('ent.*.*.state')
    ;(async () => {
        for await (const msg of sub) {
            try {
                const raw   = JSON.parse(sc.decode(msg.data))
                const parts = msg.subject.split('.')
                upsertFromRaw(store, raw, parts[2] ?? 'unknown')
            } catch { /* skip malformed */ }
        }
    })()
}

function subscribeCot() {
    if (!nc) return
    const store = useXrStore()
    const sub = nc.subscribe('tak.cot.>')
    ;(async () => {
        for await (const msg of sub) {
            try {
                const xml   = sc.decode(msg.data)
                const entity = parseCot(xml)
                if (entity) store.upsertEntity(entity)
            } catch { /* skip malformed */ }
        }
    })()
}

function parseCot(xml: string): XrEntityState | null {
    const doc   = new DOMParser().parseFromString(xml, 'text/xml')
    const event = doc.querySelector('event')
    const point = doc.querySelector('point')
    if (!event || !point) return null
    const uid      = event.getAttribute('uid') ?? 'unknown'
    const type     = event.getAttribute('type') ?? 'a-f-G'
    const lat      = Number(point.getAttribute('lat') ?? 0)
    const lon      = Number(point.getAttribute('lon') ?? 0)
    const hae      = Number(point.getAttribute('hae') ?? 0)
    const contact  = doc.querySelector('contact')
    const callsign = contact?.getAttribute('callsign') ?? uid
    const staleStr = event.getAttribute('stale') ?? ''
    const stale    = staleStr ? new Date(staleStr).getTime() < Date.now() : false
    return { uid, callsign, lat, lon, hae, type, stale, ts: Date.now() }
}

function pruneStale(store: ReturnType<typeof useXrStore>) {
    const cutoff = Date.now() - STALE_TTL
    for (const [uid, e] of store.entities.entries()) {
        if (e.ts < cutoff) store.entities.delete(uid)
    }
}
