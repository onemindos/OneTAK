import { ref, readonly } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BridgeAgent {
    instanceId: string;
    agent: string;
    owner: string;
    name: string;
    description: string;
    version: string;
    protocolVersion: string;
    metadata: Record<string, string>;
    promptEndpoint: {
        subject: string;
        maxPayloadBytes?: number;
        attachmentsOk?: boolean;
        metadata: Record<string, string>;
    };
}

export type BridgeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface PromptEvent {
    kind: 'response' | 'status' | 'tool-use' | 'tool-result' | 'cost' | 'done' | 'error';
    text?: string;
    status?: string;
    toolName?: string;
    input?: Record<string, unknown>;
    output?: string;
    isError?: boolean;
    message?: string;
    turnCostUsd?: number;
    totalCostUsd?: number;
}

type PromptCallback  = (ev: PromptEvent) => void;
type RawMsgHandler   = (msg: Record<string, unknown>) => void;

// ── Singleton state ──────────────────────────────────────────────────────────

const BRIDGE_URL       = 'wss://legacy-ai.onemindos.dev/ws';
const RECONNECT_BASE   = 500;
const RECONNECT_MAX    = 15_000;

const status     = ref<BridgeStatus>('disconnected');
const natsServer = ref<string | null>(null);
const agents     = ref<Map<string, BridgeAgent>>(new Map());

let ws:            WebSocket | null = null;
let reconnTimer:   ReturnType<typeof setTimeout> | null = null;
let reconnAttempt  = 0;
let shouldReconn   = false;
let reqCounter     = 0;
const callbacks    = new Map<string, PromptCallback>();
const rawHandlers  = new Set<RawMsgHandler>();

function nextId() { return `req-${Date.now()}-${++reqCounter}`; }

function handleRaw(data: string) {
    try {
        const msg = JSON.parse(data) as Record<string, unknown>;
        // Notify all raw handlers
        rawHandlers.forEach(h => { try { h(msg); } catch { /* ignore */ } });
        switch (msg.kind) {
            case 'ready':
                natsServer.value = (msg.natsServer as string) ?? null;
                break;
            case 'agents':
                agents.value = new Map((msg.agents as BridgeAgent[]).map(a => [a.instanceId, a]));
                break;
            case 'agent-added': {
                const a = msg.agent as BridgeAgent;
                const m = new Map(agents.value);
                m.set(a.instanceId, a);
                agents.value = m;
                break;
            }
            case 'agent-removed': {
                const m = new Map(agents.value);
                m.delete(msg.instanceId as string);
                agents.value = m;
                break;
            }
            case 'response':
            case 'status':
            case 'tool-use':
            case 'tool-result':
            case 'cost':
            case 'done':
            case 'error': {
                const id = msg.id as string;
                const cb = callbacks.get(id);
                if (cb) {
                    cb(msg as unknown as PromptEvent);
                    if (msg.kind === 'done' || msg.kind === 'error') callbacks.delete(id);
                }
                break;
            }
        }
    } catch { /* ignore */ }
}

function doConnect() {
    if (!shouldReconn) return;
    if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) return;

    status.value = 'connecting';
    ws = new WebSocket(BRIDGE_URL);

    ws.onopen = () => {
        reconnAttempt = 0;
        status.value  = 'connected';
        ws!.send(JSON.stringify({ kind: 'discover' }));
    };
    ws.onmessage = (e) => handleRaw(e.data as string);
    ws.onerror   = () => { status.value = 'error'; ws?.close(); };
    ws.onclose   = () => {
        if (!shouldReconn) return;
        status.value = 'disconnected';
        if (!reconnTimer) {
            const d = Math.min(RECONNECT_BASE * 2 ** reconnAttempt, RECONNECT_MAX);
            reconnAttempt++;
            reconnTimer = setTimeout(() => { reconnTimer = null; doConnect(); }, d);
        }
    };
}

// ── Public composable ────────────────────────────────────────────────────────

export function useBridge() {
    return {
        status:     readonly(status),
        natsServer: readonly(natsServer),
        agents:     readonly(agents),

        start() { shouldReconn = true; doConnect(); },

        stop() {
            shouldReconn = false;
            if (reconnTimer) { clearTimeout(reconnTimer); reconnTimer = null; }
            if (ws) { ws.onclose = null; ws.close(); ws = null; }
            status.value = 'disconnected';
        },

        discover() {
            if (ws?.readyState === WebSocket.OPEN)
                ws.send(JSON.stringify({ kind: 'discover' }));
        },

        prompt(instanceId: string, text: string, onEvent: PromptCallback): string {
            const id = nextId();
            callbacks.set(id, onEvent);
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ kind: 'prompt', id, instanceId, text }));
            } else {
                setTimeout(() => {
                    onEvent({ kind: 'error', message: 'Bridge not connected' });
                    callbacks.delete(id);
                }, 0);
            }
            return id;
        },

        cancel(id: string) {
            if (ws?.readyState === WebSocket.OPEN)
                ws.send(JSON.stringify({ kind: 'cancel', id }));
            callbacks.delete(id);
        },

        sendRaw(msg: Record<string, unknown>): boolean {
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(msg));
                return true;
            }
            return false;
        },

        onMessage(handler: RawMsgHandler): () => void {
            rawHandlers.add(handler);
            return () => rawHandlers.delete(handler);
        },
    };
}
