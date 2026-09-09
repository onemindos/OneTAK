import type { Pinia } from 'pinia'
import { useMumbleStore } from './store'
import type { MumbleChannel, MumbleUser, TalkingEvent } from './types'

// Mumble WebSocket proxy protocol.
// The proxy at wss://mumble.onemindos.dev translates Mumble's Protobuf/TCP
// into a simple JSON-over-WebSocket format defined here.

let _proxyUrl = 'wss://mumble.onemindos.dev'
let ws: WebSocket | null = null
let pinia: Pinia | null = null

export type ProxyMessage =
    | { type: 'channel_state';  channel: MumbleChannel }
    | { type: 'channel_remove'; id: number }
    | { type: 'user_state';     user: MumbleUser }
    | { type: 'user_remove';    session: number }
    | { type: 'talking';        event: TalkingEvent }
    | { type: 'session';        session: number }
    | { type: 'error';          message: string }

export function configureMumble(opts: { proxyUrl?: string }) {
    if (opts.proxyUrl) _proxyUrl = opts.proxyUrl
}

export function connect(piniaInstance: Pinia): void {
    pinia = piniaInstance
    const store = useMumbleStore(pinia)

    if (ws) return

    store.connectionState = 'connecting'

    ws = new WebSocket(_proxyUrl)

    ws.onopen = () => {
        store.connectionState = 'connected'
    }

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data as string) as ProxyMessage
            handleMessage(msg)
        } catch {
            // malformed message — ignore
        }
    }

    ws.onclose = () => {
        ws = null
        store.connectionState = 'disconnected'
        setTimeout(() => {
            if (pinia) connect(pinia)
        }, 3000)
    }

    ws.onerror = () => {
        store.connectionState = 'error'
    }
}

export function disconnect(): void {
    if (ws) {
        ws.onclose = null
        ws.close()
        ws = null
    }
    if (pinia) {
        useMumbleStore(pinia).connectionState = 'disconnected'
    }
    pinia = null
}

export function sendPttStart(): void {
    send({ type: 'ptt_start' })
}

export function sendPttStop(): void {
    send({ type: 'ptt_stop' })
}

export function joinChannel(channelId: number): void {
    send({ type: 'join_channel', channelId })
}

function send(payload: unknown): void {
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload))
    }
}

function handleMessage(msg: ProxyMessage): void {
    if (!pinia) return
    const store = useMumbleStore(pinia)

    switch (msg.type) {
        case 'channel_state':  store.upsertChannel(msg.channel); break
        case 'channel_remove': store.removeChannel(msg.id); break
        case 'user_state':     store.upsertUser(msg.user); break
        case 'user_remove':    store.removeUser(msg.session); break
        case 'talking':        store.setTalking(msg.event.session, msg.event.talking); break
        case 'session':        store.mySession = msg.session; break
        case 'error':          console.error('[mumble]', msg.message); break
    }
}
