<template>
    <div class='br'>
        <!-- Header -->
        <div class='br-hd'>
            <GitMerge
                :size='13'
                class='br-acc'
            />
            <span class='br-title'>BRIDGE MONITOR</span>
            <span class='br-badge green'>LIVE {{ liveCount }}</span>
            <span
                v-if='pausedCount > 0'
                class='br-badge warn'
            >PAUSED {{ pausedCount }}</span>
            <span
                v-if='errorCount > 0'
                class='br-badge err'
            >ERROR {{ errorCount }}</span>
            <span class='br-badge'>TOTAL {{ bridges.length }}</span>
            <div class='br-spacer' />
            <span
                v-if='nc'
                class='br-rate br-mono'
            >{{ aggregateRate }} msg/s aggregate</span>
        </div>

        <!-- Grid -->
        <div class='br-body'>
            <div
                v-if='!nc'
                class='br-empty'
            >
                <GitMerge
                    :size='24'
                    class='br-empty-icon'
                />
                <span>CONNECT TO NATS TO MONITOR BRIDGES</span>
            </div>
            <div
                v-else
                class='br-grid'
            >
                <div
                    v-for='bridge in bridges'
                    :key='bridge.id'
                    class='br-card'
                    :class='bridge.status'
                >
                    <!-- Card header -->
                    <div class='br-card-hd'>
                        <div
                            class='br-icon-wrap'
                            :class='bridge.status'
                        >
                            <component
                                :is='bridge.icon'
                                :size='14'
                            />
                        </div>
                        <div class='br-card-info'>
                            <div class='br-card-name'>
                                {{ bridge.name }}
                            </div>
                            <div class='br-card-subj br-mono'>
                                {{ bridge.natsSubject }}
                            </div>
                        </div>
                        <div
                            class='br-status-pill'
                            :class='bridge.status'
                        >
                            <div
                                class='br-dot'
                                :class='bridge.status'
                            />
                            {{ STATUS_LABELS[bridge.status] }}
                        </div>
                    </div>

                    <!-- Metrics row -->
                    <div class='br-metrics'>
                        <div class='br-metric'>
                            <span
                                class='br-metric-val'
                                :class='{ bright: bridge.status === "live" }'
                            >
                                {{ bridge.msgsPerSec }}
                            </span>
                            <span class='br-metric-lbl'>msg/s</span>
                        </div>
                        <div class='br-metric'>
                            <span class='br-metric-val'>{{ fmtCount(bridge.totalMsgs) }}</span>
                            <span class='br-metric-lbl'>total</span>
                        </div>
                        <div class='br-metric'>
                            <span class='br-metric-val'>{{ timeAgo(bridge.lastMessageAt) }}</span>
                            <span class='br-metric-lbl'>last msg</span>
                        </div>
                    </div>

                    <!-- Error message -->
                    <div
                        v-if='bridge.errorMessage'
                        class='br-error-msg'
                    >
                        <AlertTriangle :size='10' />
                        {{ bridge.errorMessage }}
                    </div>

                    <!-- Actions -->
                    <div class='br-actions'>
                        <button
                            v-if='bridge.status === "live"'
                            class='br-btn warn'
                            @click='pauseBridge(bridge.id)'
                        >
                            <Pause :size='10' /> Pause
                        </button>
                        <button
                            v-else
                            class='br-btn primary'
                            @click='resumeBridge(bridge.id)'
                        >
                            <Play :size='10' /> Resume
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class='br-footer'>
            <span class='br-mono'>{{ bridges.filter(b => b.totalMsgs > 0).length }} bridges seen traffic</span>
            <span class='br-mono'>LIVE • {{ BRIDGE_DEFS.map(b => b.natsSubject).join(', ').slice(0,60) }}…</span>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, watch, onUnmounted } from 'vue';
import {
    Ship, Plane, Radio, Cpu, Home, Satellite, Share2, Globe,
    GitMerge, AlertTriangle, Pause, Play,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import { useNatsStore } from '../stores/nats.store';
import type { Subscription } from 'nats.ws';

// ── Types ────────────────────────────────────────────────────────────────────

type BridgeStatus = 'live' | 'paused' | 'error' | 'unknown' | 'connecting';

interface Bridge {
    id: string;
    name: string;
    icon: Component;
    status: BridgeStatus;
    msgsPerSec: number;
    totalMsgs: number;
    lastMessageAt: number | null;
    errorMessage?: string;
    natsSubject: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const BRIDGE_DEFS: Array<{ id: string; name: string; icon: Component; natsSubject: string }> = [
    { id: 'ais',           name: 'AIS Ships',       icon: Ship,     natsSubject: 'tel.ship.>'             },
    { id: 'adsb',          name: 'ADS-B Aircraft',  icon: Plane,    natsSubject: 'tel.aircraft.>'         },
    { id: 'aprs',          name: 'APRS Trackers',   icon: Radio,    natsSubject: 'tel.aprs.>'             },
    { id: 'mavlink',       name: 'MAVLink',         icon: Cpu,      natsSubject: 'tel.drone.>'            },
    { id: 'homeassistant', name: 'Home Assistant',  icon: Home,     natsSubject: 'tel.home.>'             },
    { id: 'cloudtak',      name: 'CloudTAK CoT',    icon: Globe,    natsSubject: 'tak.cot.>'              },
    { id: 'wombat',        name: 'Wombat',          icon: Share2,   natsSubject: 'svc.bridge.wombat.>'   },
    { id: 'sat',           name: 'Satellites',      icon: Satellite,natsSubject: 'tel.sat.>'              },
];

const STATUS_LABELS: Record<BridgeStatus, string> = {
    live: 'LIVE', paused: 'PAUSED', error: 'ERROR', unknown: 'UNKNOWN', connecting: 'CONNECTING',
};

const WINDOW_MS = 2000;

// ── State ────────────────────────────────────────────────────────────────────

const { nc } = useNatsStore();

const bridges = ref<Bridge[]>(
    BRIDGE_DEFS.map(d => ({ ...d, status: 'unknown' as BridgeStatus, msgsPerSec: 0, totalMsgs: 0, lastMessageAt: null }))
);

const counters = new Map<string, { count: number; windowStart: number }>(
    BRIDGE_DEFS.map(d => [d.id, { count: 0, windowStart: Date.now() }])
);

let subs: Subscription[] = [];
let rateInterval: ReturnType<typeof setInterval> | null = null;
let staleInterval: ReturnType<typeof setInterval> | null = null;

// ── NATS watch ───────────────────────────────────────────────────────────────

watch(nc, (conn) => {
    for (const s of subs) s.unsubscribe();
    subs = [];
    if (rateInterval) { clearInterval(rateInterval); rateInterval = null; }
    if (staleInterval) { clearInterval(staleInterval); staleInterval = null; }
    bridges.value = BRIDGE_DEFS.map(d => ({ ...d, status: 'unknown' as BridgeStatus, msgsPerSec: 0, totalMsgs: 0, lastMessageAt: null }));
    if (!conn) return;

    for (const def of BRIDGE_DEFS) {
        try {
            const sub = conn.subscribe(def.natsSubject);
            subs.push(sub);
            (async () => {
                for await (const msg of sub) {
                    const counter = counters.get(def.id);
                    if (counter) counter.count++;
                    const now = Date.now();

                    // Check for status message
                    let errorMessage: string | undefined;
                    let statusOverride: BridgeStatus | undefined;
                    try {
                        const text = new TextDecoder().decode(msg.data);
                        if (msg.subject.endsWith('.status')) {
                            const p = JSON.parse(text) as { status?: BridgeStatus; error?: string };
                            if (p.status) statusOverride = p.status;
                            if (p.error) errorMessage = p.error;
                        }
                    } catch { /* ignore */ }

                    bridges.value = bridges.value.map(b =>
                        b.id === def.id
                            ? { ...b, status: statusOverride ?? 'live', lastMessageAt: now, totalMsgs: Math.min(b.totalMsgs + 1, 9_999_999), errorMessage }
                            : b
                    );
                }
            })().catch(() => {});
        } catch { /* ignore */ }
    }

    // Rate calculation every 2s
    rateInterval = setInterval(() => {
        const now = Date.now();
        bridges.value = bridges.value.map(b => {
            const c = counters.get(b.id);
            if (!c) return b;
            const elapsed = Math.max((now - c.windowStart) / 1000, 0.001);
            const rate = Math.round(c.count / elapsed);
            c.count = 0;
            c.windowStart = now;
            return { ...b, msgsPerSec: rate };
        });
    }, WINDOW_MS);

    // Stale check every 5s
    staleInterval = setInterval(() => {
        const now = Date.now();
        bridges.value = bridges.value.map(b => {
            if (b.status === 'live' && b.lastMessageAt && now - b.lastMessageAt > 30_000) {
                return { ...b, status: 'paused' as BridgeStatus };
            }
            return b;
        });
    }, 5000);

}, { immediate: true });

onUnmounted(() => {
    for (const s of subs) s.unsubscribe();
    if (rateInterval) clearInterval(rateInterval);
    if (staleInterval) clearInterval(staleInterval);
});

// ── Computed ─────────────────────────────────────────────────────────────────

const liveCount    = computed(() => bridges.value.filter(b => b.status === 'live').length);
const pausedCount  = computed(() => bridges.value.filter(b => b.status === 'paused').length);
const errorCount   = computed(() => bridges.value.filter(b => b.status === 'error').length);
const aggregateRate = computed(() => bridges.value.reduce((a, b) => a + b.msgsPerSec, 0).toLocaleString());

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number | null): string {
    if (!ts) return '—';
    const s = Math.floor((Date.now() - ts) / 1000);
    return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s/60)}m ago` : `${Math.floor(s/3600)}h ago`;
}

function fmtCount(n: number): string {
    if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n/1_000).toFixed(1)}K`;
    return n.toString();
}

function pauseBridge(id: string) {
    if (!nc.value) return;
    nc.value.publish(`cmd.bridge.${id}.pause`, new TextEncoder().encode('{}'));
    bridges.value = bridges.value.map(b => b.id === id ? { ...b, status: 'paused' as BridgeStatus } : b);
}

function resumeBridge(id: string) {
    if (!nc.value) return;
    nc.value.publish(`cmd.bridge.${id}.resume`, new TextEncoder().encode('{}'));
    bridges.value = bridges.value.map(b => b.id === id ? { ...b, status: 'connecting' as BridgeStatus } : b);
}
</script>

<style scoped>
.br { display:flex; flex-direction:column; height:100%; overflow:hidden; }
.br-hd { display:flex; align-items:center; gap:7px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); flex-wrap:wrap; }
.br-title { font-size:11px; font-weight:700; font-family:monospace; letter-spacing:0.06em; color:#e6edf3; }
.br-acc { color:#4a9eff; }
.br-spacer { flex:1; }
.br-mono { font-family:monospace; font-size:10px; }
.br-rate { color:rgba(255,255,255,0.35); }
.br-badge { font-size:10px; padding:2px 7px; border-radius:4px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.45); font-weight:600; font-family:monospace; }
.br-badge.green { background:rgba(34,197,94,0.12); border-color:rgba(34,197,94,0.25); color:#22c55e; }
.br-badge.warn  { background:rgba(245,158,11,0.12); border-color:rgba(245,158,11,0.25); color:#f59e0b; }
.br-badge.err   { background:rgba(248,81,73,0.12); border-color:rgba(248,81,73,0.25); color:#f85149; }

.br-body { flex:1; overflow-y:auto; padding:12px; }
.br-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; color:rgba(255,255,255,0.3); font-size:11px; font-family:monospace; letter-spacing:0.06em; }
.br-empty-icon { opacity:0.2; }
.br-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:10px; }

.br-card { border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); padding:12px; display:flex; flex-direction:column; gap:10px; transition:border-color .15s; }
.br-card.live { border-color:rgba(0,212,255,0.18); }
.br-card.error { border-color:rgba(248,81,73,0.18); }

.br-card-hd { display:flex; align-items:center; gap:9px; }
.br-icon-wrap { width:34px; height:34px; border-radius:7px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:rgba(255,255,255,0.4); transition:all .15s; }
.br-icon-wrap.live { background:rgba(0,212,255,0.08); border-color:rgba(0,212,255,0.2); color:#00d4ff; }
.br-icon-wrap.error { background:rgba(248,81,73,0.08); border-color:rgba(248,81,73,0.2); color:#f85149; }
.br-card-info { flex:1; min-width:0; }
.br-card-name { font-size:12px; font-weight:600; color:#e6edf3; }
.br-card-subj { font-size:9px; color:rgba(255,255,255,0.3); margin-top:2px; }

.br-status-pill { display:flex; align-items:center; gap:4px; font-size:9px; font-family:monospace; font-weight:600; padding:2px 7px; border-radius:10px; background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.35); border:1px solid rgba(255,255,255,0.08); white-space:nowrap; }
.br-status-pill.live { background:rgba(34,197,94,0.1); color:#22c55e; border-color:rgba(34,197,94,0.2); }
.br-status-pill.paused { background:rgba(245,158,11,0.1); color:#f59e0b; border-color:rgba(245,158,11,0.2); }
.br-status-pill.error { background:rgba(248,81,73,0.1); color:#f85149; border-color:rgba(248,81,73,0.2); }
.br-dot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.25); }
.br-dot.live { background:#22c55e; box-shadow:0 0 5px #22c55e; }
.br-dot.paused { background:#f59e0b; }
.br-dot.error { background:#f85149; box-shadow:0 0 5px #f85149; }

.br-metrics { display:flex; justify-content:space-between; background:rgba(255,255,255,0.02); border-radius:6px; padding:8px 10px; }
.br-metric { display:flex; flex-direction:column; align-items:center; gap:2px; }
.br-metric-val { font-family:monospace; font-size:13px; font-weight:600; color:rgba(255,255,255,0.4); }
.br-metric-val.bright { color:#00d4ff; }
.br-metric-lbl { font-size:9px; font-family:monospace; text-transform:uppercase; letter-spacing:0.06em; color:rgba(255,255,255,0.25); }

.br-error-msg { display:flex; align-items:flex-start; gap:5px; padding:5px 8px; border-radius:5px; background:rgba(248,81,73,0.08); border:1px solid rgba(248,81,73,0.18); font-size:10px; font-family:monospace; color:#f85149; }

.br-actions { display:flex; gap:6px; }
.br-btn { display:flex; align-items:center; gap:5px; flex:1; justify-content:center; padding:5px 10px; border-radius:5px; font-size:10px; font-family:monospace; font-weight:600; letter-spacing:0.04em; cursor:pointer; border:1px solid; transition:all .12s; }
.br-btn.warn { background:rgba(245,158,11,0.08); border-color:rgba(245,158,11,0.25); color:#f59e0b; }
.br-btn.warn:hover { background:rgba(245,158,11,0.15); }
.br-btn.primary { background:rgba(74,158,255,0.08); border-color:rgba(74,158,255,0.25); color:#4a9eff; }
.br-btn.primary:hover { background:rgba(74,158,255,0.15); }

.br-footer { display:flex; align-items:center; justify-content:space-between; padding:5px 12px; border-top:1px solid rgba(255,255,255,0.07); flex-shrink:0; color:rgba(255,255,255,0.25); font-size:10px; font-family:monospace; }
</style>
