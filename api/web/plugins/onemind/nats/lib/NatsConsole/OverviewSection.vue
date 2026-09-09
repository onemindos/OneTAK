<template>
    <div class="ov">
        <div class="ov-header">
            <div>
                <div class="ov-title">
                    OneMind OS
                </div>
                <div class="ov-sub">
                    Unified NATS Operations Center
                </div>
            </div>
            <div
                class="ov-pill"
                :class="status"
            >
                <div class="ov-pill-dot" />
                {{ status === 'connected' ? 'Bus Online' : status === 'connecting' ? 'Connecting…' : 'Disconnected' }}
            </div>
        </div>

        <div class="ov-metrics">
            <div
                v-for="m in metricCards"
                :key="m.label"
                class="ov-metric"
            >
                <div class="ov-metric-top">
                    <component
                        :is="m.icon"
                        :size="13"
                        class="ov-accent"
                    />
                    <span class="ov-label">{{ m.label }}</span>
                </div>
                <div class="ov-metric-val">
                    {{ m.value }}
                </div>
                <div class="ov-muted">
                    {{ m.sub }}
                </div>
            </div>
        </div>

        <div class="ov-two">
            <div class="ov-card">
                <div class="ov-card-hd">
                    <Users
                        :size="12"
                        class="ov-accent"
                    />Active Agents
                </div>
                <div
                    v-if="agentList.length === 0"
                    class="ov-empty"
                >
                    No agents discovered yet. Listening on agents.heartbeat.&gt;
                </div>
                <template v-else>
                    <div
                        v-for="a in agentList.slice(0, 6)"
                        :key="a.id"
                        class="ov-agent"
                    >
                        <div
                            class="ov-dot"
                            :style="{ background: agentColor(a.status) }"
                        />
                        <span class="ov-mono">{{ a.name }}</span>
                        <span class="ov-muted ov-type">{{ a.type }}</span>
                        <span
                            v-if="a.capabilities"
                            class="ov-mono ov-muted ov-ml"
                        >{{ a.capabilities.length }} tools</span>
                    </div>
                    <span
                        v-if="agentList.length > 6"
                        class="ov-muted ov-sm"
                    >+{{ agentList.length - 6 }} more</span>
                </template>
            </div>

            <div class="ov-card">
                <div class="ov-card-hd">
                    <Zap
                        :size="12"
                        class="ov-accent"
                    />Integrations
                </div>
                <button
                    class="ov-launch"
                    style="--a:#00d4ff"
                    @click="openUrl(cloudtakUrl)"
                >
                    <div class="ov-launch-icon">
                        <Crosshair :size="15" />
                    </div>
                    <div class="ov-launch-txt">
                        <div class="ov-launch-name">
                            ATOC — CloudTAK
                        </div>
                        <div class="ov-muted">
                            Ground COP — CoT tracks, missions, TAK devices
                        </div>
                    </div>
                    <ExternalLink
                        :size="12"
                        class="ov-muted"
                    />
                </button>
                <button
                    class="ov-launch"
                    style="--a:#c084fc"
                    @click="openUrl(wwvUrl)"
                >
                    <div class="ov-launch-icon">
                        <Globe2 :size="15" />
                    </div>
                    <div class="ov-launch-txt">
                        <div class="ov-launch-name">
                            ATLAS — WorldWideView
                        </div>
                        <div class="ov-muted">
                            Strategic globe — space domain, orbital, recon
                        </div>
                    </div>
                    <ExternalLink
                        :size="12"
                        class="ov-muted"
                    />
                </button>
            </div>
        </div>

        <div class="ov-card">
            <div class="ov-card-hd">
                <Shield
                    :size="12"
                    class="ov-accent"
                />Bus Health
            </div>
            <div class="ov-health">
                <div>
                    <div class="ov-muted">
                        Streams
                    </div>
                    <div class="ov-big">
                        {{ metrics.streams }}
                    </div>
                </div>
                <div>
                    <div class="ov-muted">
                        Subscriptions
                    </div>
                    <div class="ov-big">
                        {{ fmt(metrics.subjects) }}
                    </div>
                </div>
                <div>
                    <div class="ov-muted">
                        Throughput
                    </div>
                    <div class="ov-big">
                        {{ fmtBytes(metrics.bytesIn + metrics.bytesOut) }}/s
                    </div>
                </div>
                <div>
                    <div class="ov-muted">
                        Status
                    </div>
                    <div class="ov-hstatus">
                        <div
                            class="ov-dot"
                            :class='{ glow: status === "connected" }'
                            :style='{ background: status === "connected" ? "#43e27d" : "#ef4444" }'
                        />
                        <span>{{ status === 'connected' ? 'Healthy' : 'Degraded' }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, onUnmounted } from 'vue';
import {
    Activity, Users, ArrowUp, ArrowDown, Zap, Shield, Crosshair, Globe2, ExternalLink,
} from 'lucide-vue-next';
import { useNatsStore } from '../stores/nats.store';
import { useAgents } from '../composables/useAgents';
import type { Agent } from '../composables/useAgents';

const { nc, status } = useNatsStore();
const { agents } = useAgents();

const cloudtakUrl = (import.meta as { env?: Record<string, string> }).env?.VITE_CLOUDTAK_URL ?? 'https://cloudtak.onemindos.dev';
const wwvUrl       = (import.meta as { env?: Record<string, string> }).env?.VITE_WWV_URL       ?? 'https://wwv.onemindos.dev';

interface BusMetrics {
    connections: number; msgsIn: number; msgsOut: number;
    bytesIn: number; bytesOut: number; streams: number; subjects: number;
}
const metrics = ref<BusMetrics>({ connections: 0, msgsIn: 0, msgsOut: 0, bytesIn: 0, bytesOut: 0, streams: 0, subjects: 0 });

async function pollMetrics() {
    const conn = nc.value;
    if (!conn) return;
    try {
        const resp = await conn.request('$SYS.REQ.SERVER.PING', new Uint8Array(), { timeout: 3000 });
        const data = JSON.parse(new TextDecoder().decode(resp.data)) as Record<string, unknown>;
        const stats = data.stats as Record<string, number> | undefined;
        const js    = data.jetstream as Record<string, number> | undefined;
        if (stats) {
            metrics.value = {
                connections: stats.total_connections ?? 0,
                msgsIn:      stats.in_msgs  ?? 0,
                msgsOut:     stats.out_msgs ?? 0,
                bytesIn:     stats.in_bytes  ?? 0,
                bytesOut:    stats.out_bytes ?? 0,
                streams:     js?.streams ?? 0,
                subjects:    stats.subscriptions ?? 0,
            };
        }
    } catch { /* $SYS not available or no auth */ }
}

void pollMetrics();
const timer = setInterval(() => void pollMetrics(), 10_000);
onUnmounted(() => clearInterval(timer));

function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}
function fmtBytes(b: number): string {
    if (b < 1024)        return `${b} B`;
    if (b < 1_048_576)   return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1_073_741_824) return `${(b / 1_048_576).toFixed(1)} MB`;
    return `${(b / 1_073_741_824).toFixed(1)} GB`;
}

const agentList     = computed(() => [...agents.value.values()]);
const onlineAgents  = computed(() => agentList.value.filter(a => a.status === 'online' || a.status === 'busy').length);
const totalAgents   = computed(() => agentList.value.length);
const metricCards   = computed(() => [
    { icon: Activity,  label: 'Connections', value: fmt(metrics.value.connections), sub: 'active clients' },
    { icon: Users,     label: 'Agents',      value: `${onlineAgents.value}/${totalAgents.value}`, sub: 'online / registered' },
    { icon: ArrowDown, label: 'Msgs In',     value: fmt(metrics.value.msgsIn),  sub: fmtBytes(metrics.value.bytesIn)  },
    { icon: ArrowUp,   label: 'Msgs Out',    value: fmt(metrics.value.msgsOut), sub: fmtBytes(metrics.value.bytesOut) },
]);

function agentColor(s: Agent['status']): string {
    return s === 'online' || s === 'busy' ? '#43e27d' : s === 'idle' ? '#facc15' : '#666';
}
function openUrl(url: string) { window.open(url, '_blank', 'noopener'); }
</script>

<style scoped>
.ov { display:flex; flex-direction:column; gap:12px; padding:14px; height:100%; overflow:auto; }
.ov-header { display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
.ov-title { font-size:14px; font-weight:700; color:#e6edf3; }
.ov-sub { font-size:11px; color:rgba(255,255,255,0.4); }
.ov-pill { display:flex; align-items:center; gap:6px; padding:3px 10px; border-radius:12px; font-size:11px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.4); }
.ov-pill-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
.ov-pill.connected { color:#22c55e; border-color:rgba(34,197,94,0.25); }
.ov-pill.connecting { color:#f59e0b; }
.ov-pill.error { color:#f85149; }
.ov-metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; flex-shrink:0; }
.ov-metric { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:8px; padding:10px 12px; display:flex; flex-direction:column; gap:4px; }
.ov-metric-top { display:flex; align-items:center; gap:6px; }
.ov-metric-val { font-size:20px; font-weight:700; font-family:monospace; color:#e6edf3; }
.ov-two { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.ov-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:8px; }
.ov-card-hd { display:flex; align-items:center; gap:6px; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:rgba(255,255,255,0.4); }
.ov-accent { color:#4a9eff; }
.ov-label { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:rgba(255,255,255,0.4); }
.ov-muted { color:rgba(255,255,255,0.35); font-size:11px; }
.ov-empty { font-size:11px; font-style:italic; color:rgba(255,255,255,0.3); }
.ov-agent { display:flex; align-items:center; gap:6px; }
.ov-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.ov-dot.glow { box-shadow:0 0 5px currentColor; }
.ov-mono { font-size:11px; font-family:monospace; color:#e6edf3; }
.ov-type { flex:1; }
.ov-ml { margin-left:auto; }
.ov-sm { font-size:10px; }
.ov-launch { display:flex; align-items:center; gap:8px; padding:8px; border-radius:6px; border:1px solid color-mix(in srgb, var(--a) 20%, transparent); background:color-mix(in srgb, var(--a) 5%, transparent); cursor:pointer; text-align:left; width:100%; transition:background .15s; }
.ov-launch:hover { background:color-mix(in srgb, var(--a) 12%, transparent); }
.ov-launch-icon { width:32px; height:32px; border-radius:6px; background:color-mix(in srgb, var(--a) 15%, transparent); color:var(--a,#4a9eff); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ov-launch-txt { flex:1; min-width:0; }
.ov-launch-name { font-size:12px; font-weight:600; color:#e6edf3; }
.ov-health { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.ov-big { font-size:18px; font-weight:700; font-family:monospace; color:#e6edf3; margin-top:2px; }
.ov-hstatus { display:flex; align-items:center; gap:6px; margin-top:4px; color:#e6edf3; font-size:12px; font-weight:500; }
</style>
