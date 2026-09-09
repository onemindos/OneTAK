<template>
    <div class="fl">
        <!-- Stats strip -->
        <div class="fl-stats">
            <div
                v-for="s in stats"
                :key="s.label"
                class="fl-stat"
            >
                <span class="fl-stat-val">{{ s.value }}</span>
                <span class="fl-stat-lbl">{{ s.label }}</span>
            </div>
        </div>

        <div class="fl-body">
            <!-- Roster -->
            <div class="fl-roster">
                <!-- Type filter -->
                <div class="fl-filters">
                    <button
                        v-for="f in TYPE_FILTERS"
                        :key="f"
                        class="fl-filter"
                        :class="{ active: typeFilter === f }"
                        @click="typeFilter = f"
                    >
                        {{ f === "all" ? "All" : f }}
                    </button>
                </div>

                <div
                    v-if="filteredNodes.length === 0"
                    class="fl-empty"
                >
                    <span class="fl-empty-icon">📡</span>
                    <span class="fl-muted">{{ nodeList.length === 0 ? "Listening on ent.drone.> ent.node.>" : "No nodes match filter" }}</span>
                </div>
                <button
                    v-for="node in filteredNodes"
                    :key="node.id"
                    class="fl-node-card"
                    :class="{ selected: selectedId === node.id }"
                    @click="selectedId = selectedId === node.id ? null : node.id"
                >
                    <div class="fl-node-row">
                        <div
                            class="fl-type-badge"
                            :class="node.type"
                        >
                            {{ nodeInitials(node.type) }}
                        </div>
                        <div class="fl-node-info">
                            <div class="fl-node-name">
                                {{ node.name }}
                            </div>
                            <div class="fl-node-sub fl-muted">
                                {{ node.id }}
                            </div>
                        </div>
                        <div class="fl-node-right">
                            <div
                                class="fl-status-dot"
                                :class="node.status"
                            />
                            <span
                                v-if="node.battery != null"
                                class="fl-battery fl-muted"
                            >{{ node.battery }}%</span>
                        </div>
                    </div>
                    <div
                        v-if="node.capabilities.length > 0"
                        class="fl-caps"
                    >
                        <span
                            v-for="c in node.capabilities.slice(0,3)"
                            :key="c"
                            class="fl-cap"
                        >{{ c }}</span>
                        <span
                            v-if="node.capabilities.length > 3"
                            class="fl-cap muted"
                        >+{{ node.capabilities.length - 3 }}</span>
                    </div>
                </button>
            </div>

            <!-- Node detail -->
            <div class="fl-detail">
                <template v-if="selectedNode">
                    <div class="fl-detail-hd">
                        <div
                            class="fl-type-badge lg"
                            :class="selectedNode.type"
                        >
                            {{ nodeInitials(selectedNode.type) }}
                        </div>
                        <div>
                            <div class="fl-detail-name">
                                {{ selectedNode.name }}
                            </div>
                            <div class="fl-muted">
                                {{ selectedNode.id }}
                            </div>
                        </div>
                        <div
                            class="fl-status-pill"
                            :class="selectedNode.status"
                        >
                            {{ selectedNode.status }}
                        </div>
                    </div>

                    <div class="fl-detail-body">
                        <!-- Location -->
                        <div
                            v-if="selectedNode.lat != null"
                            class="fl-section"
                        >
                            <div class="fl-section-title">
                                Location
                            </div>
                            <div class="fl-kv-grid">
                                <div class="fl-kv">
                                    <span class="fl-muted">Lat</span><span class="fl-mono">{{ selectedNode.lat.toFixed(5) }}</span>
                                </div>
                                <div class="fl-kv">
                                    <span class="fl-muted">Lng</span><span class="fl-mono">{{ selectedNode.lng?.toFixed(5) }}</span>
                                </div>
                                <div
                                    v-if="selectedNode.alt != null"
                                    class="fl-kv"
                                >
                                    <span class="fl-muted">Alt</span><span class="fl-mono">{{ selectedNode.alt.toFixed(1) }}m</span>
                                </div>
                                <div
                                    v-if="selectedNode.heading != null"
                                    class="fl-kv"
                                >
                                    <span class="fl-muted">Hdg</span><span class="fl-mono">{{ selectedNode.heading.toFixed(0) }}°</span>
                                </div>
                            </div>
                        </div>

                        <!-- Battery -->
                        <div
                            v-if="selectedNode.battery != null"
                            class="fl-section"
                        >
                            <div class="fl-section-title">
                                Battery
                            </div>
                            <div class="fl-batt-row">
                                <div class="fl-batt-bar">
                                    <div
                                        class="fl-batt-fill"
                                        :class="battClass(selectedNode.battery)"
                                        :style='{ width: selectedNode.battery + "%" }'
                                    />
                                </div>
                                <span class="fl-mono">{{ selectedNode.battery }}%</span>
                            </div>
                        </div>

                        <!-- Telemetry -->
                        <div
                            v-if="latestTelemetry.size > 0"
                            class="fl-section"
                        >
                            <div class="fl-section-title">
                                Telemetry
                            </div>
                            <div class="fl-kv-grid">
                                <div
                                    v-for="[k, v] in latestTelemetry"
                                    :key="k"
                                    class="fl-kv"
                                >
                                    <span class="fl-muted">{{ k }}</span>
                                    <span class="fl-mono">{{ v.toFixed(2) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Capabilities -->
                        <div
                            v-if="selectedNode.capabilities.length > 0"
                            class="fl-section"
                        >
                            <div class="fl-section-title">
                                Capabilities
                            </div>
                            <div class="fl-caps-wrap">
                                <span
                                    v-for="c in selectedNode.capabilities"
                                    :key="c"
                                    class="fl-cap"
                                >{{ c }}</span>
                            </div>
                        </div>

                        <!-- Meta -->
                        <div class="fl-section">
                            <div class="fl-section-title">
                                Info
                            </div>
                            <div class="fl-kv-grid">
                                <div class="fl-kv">
                                    <span class="fl-muted">Type</span><span class="fl-mono">{{ selectedNode.type }}</span>
                                </div>
                                <div
                                    v-if="selectedNode.firmware"
                                    class="fl-kv"
                                >
                                    <span class="fl-muted">Firmware</span><span class="fl-mono">{{ selectedNode.firmware }}</span>
                                </div>
                                <div class="fl-kv">
                                    <span class="fl-muted">Last seen</span><span class="fl-mono">{{ relTime(selectedNode.lastSeen) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
                <div
                    v-else
                    class="fl-detail-empty"
                >
                    <span class="fl-empty-icon">🛰️</span>
                    <span class="fl-muted">Select a node to view details</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useNatsStore } from '../stores/nats.store';
import type { Subscription } from 'nats.ws';

type NodeType   = 'drone' | 'robot' | 'edge' | 'server' | 'sensor' | 'camera' | 'vehicle' | 'unknown';
type NodeStatus = 'online' | 'offline' | 'degraded' | 'maintenance';

interface FleetNode {
    id: string; name: string; type: NodeType; status: NodeStatus;
    battery?: number; lat?: number; lng?: number; alt?: number; heading?: number;
    capabilities: string[]; lastSeen: number; firmware?: string;
    metadata?: Record<string, unknown>;
}

const { nc, sc } = useNatsStore();
const nodes      = ref<Map<string, FleetNode>>(new Map());
const telemetry  = ref<Map<string, number>>(new Map()); // key: `${nodeId}:${metric}` → latest value
const selectedId = ref<string | null>(null);
const typeFilter = ref<NodeType | 'all'>('all');

const TYPE_FILTERS: Array<NodeType | 'all'> = ['all', 'drone', 'robot', 'edge', 'server', 'sensor', 'camera', 'vehicle'];

let subs: Subscription[] = [];

function parseNode(raw: unknown): FleetNode | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.name !== 'string') return null;
    const validTypes = ['drone','robot','edge','server','sensor','camera','vehicle','unknown'];
    const validStatuses = ['online','offline','degraded','maintenance'];
    return {
        id: r.id, name: r.name,
        type: validTypes.includes(r.type as string) ? (r.type as NodeType) : 'unknown',
        status: validStatuses.includes(r.status as string) ? (r.status as NodeStatus) : 'offline',
        battery: typeof r.battery === 'number' ? r.battery : undefined,
        lat: typeof r.lat === 'number' ? r.lat : undefined,
        lng: typeof r.lng === 'number' ? r.lng : undefined,
        alt: typeof r.alt === 'number' ? r.alt : undefined,
        heading: typeof r.heading === 'number' ? r.heading : undefined,
        capabilities: Array.isArray(r.capabilities) ? (r.capabilities as string[]).filter(c => typeof c === 'string') : [],
        lastSeen: typeof r.lastSeen === 'number' ? r.lastSeen : Date.now(),
        firmware: typeof r.firmware === 'string' ? r.firmware : undefined,
        metadata: typeof r.metadata === 'object' && r.metadata !== null ? (r.metadata as Record<string, unknown>) : undefined,
    };
}

function upsertNode(n: FleetNode) {
    const next = new Map(nodes.value);
    const ex = next.get(n.id);
    next.set(n.id, ex ? { ...ex, ...n, lastSeen: n.lastSeen } : n);
    nodes.value = next;
}

watch(nc, (conn) => {
    for (const s of subs) s.unsubscribe();
    subs = [];
    nodes.value = new Map();
    telemetry.value = new Map();
    if (!conn) return;

    const entitySubjects = ['ent.drone.>', 'ent.node.>'];
    const telSubjects    = ['tel.drone.>', 'tel.node.>'];

    for (const subj of entitySubjects) {
        try {
            const sub = conn.subscribe(subj);
            subs.push(sub);
            (async () => {
                for await (const msg of sub) {
                    try {
                        const n = parseNode(JSON.parse(sc.decode(msg.data)));
                        if (n) upsertNode(n);
                    } catch { /* ignore */ }
                }
            })().catch(() => {});
        } catch { /* ignore */ }
    }

    for (const subj of telSubjects) {
        try {
            const sub = conn.subscribe(subj);
            subs.push(sub);
            (async () => {
                for await (const msg of sub) {
                    try {
                        const parts = msg.subject.split('.');
                        const nodeId = parts[2];
                        if (!nodeId) continue;
                        const payload = JSON.parse(sc.decode(msg.data)) as Record<string, unknown>;
                        const metric = parts[3];
                        const next = new Map(telemetry.value);
                        if (metric) {
                            const val = typeof payload.value === 'number' ? payload.value : payload[metric];
                            if (typeof val === 'number') next.set(`${nodeId}:${metric}`, val);
                        } else {
                            for (const [k, v] of Object.entries(payload)) {
                                if (k !== 'ts' && typeof v === 'number') next.set(`${nodeId}:${k}`, v);
                            }
                        }
                        telemetry.value = next;
                    } catch { /* ignore */ }
                }
            })().catch(() => {});
        } catch { /* ignore */ }
    }
}, { immediate: true });

onUnmounted(() => { for (const s of subs) s.unsubscribe(); });

const nodeList     = computed(() => [...nodes.value.values()]);
const filteredNodes = computed(() =>
    typeFilter.value === 'all' ? nodeList.value : nodeList.value.filter(n => n.type === typeFilter.value)
);
const selectedNode = computed(() => selectedId.value ? nodes.value.get(selectedId.value) ?? null : null);
const latestTelemetry = computed(() => {
    const id = selectedId.value;
    if (!id) return new Map<string, number>();
    const result = new Map<string, number>();
    for (const [k, v] of telemetry.value) {
        if (k.startsWith(`${id}:`)) result.set(k.slice(id.length + 1), v);
    }
    return result;
});

const stats = computed(() => [
    { label: 'Total',  value: nodeList.value.length },
    { label: 'Online', value: nodeList.value.filter(n => n.status === 'online').length },
    { label: 'Offline',value: nodeList.value.filter(n => n.status === 'offline').length },
    { label: 'Drones', value: nodeList.value.filter(n => n.type === 'drone').length },
]);

function nodeInitials(type: string): string {
    const map: Record<string, string> = { drone:'DR', robot:'RB', edge:'ED', server:'SV', sensor:'SN', camera:'CM', vehicle:'VH', unknown:'??' };
    return map[type] ?? '??';
}
function relTime(ts: number): string {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 5) return 'just now';
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
}
function battClass(pct: number): string {
    if (pct > 50) return 'good';
    if (pct > 20) return 'warn';
    return 'crit';
}
</script>

<style scoped>
.fl { display:flex; flex-direction:column; height:100%; overflow:hidden; }
.fl-stats { display:flex; gap:1px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.fl-stat { flex:1; display:flex; flex-direction:column; align-items:center; padding:6px 8px; background:rgba(255,255,255,0.02); }
.fl-stat-val { font-size:16px; font-weight:700; font-family:monospace; color:#e6edf3; }
.fl-stat-lbl { font-size:10px; color:rgba(255,255,255,0.35); }
.fl-body { display:flex; flex:1; overflow:hidden; }
.fl-roster { width:260px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; overflow:hidden; }
.fl-filters { display:flex; flex-wrap:wrap; gap:3px; padding:6px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.fl-filter { padding:2px 8px; border-radius:4px; font-size:10px; font-weight:500; cursor:pointer; border:1px solid rgba(255,255,255,0.08); background:transparent; color:rgba(255,255,255,0.4); transition:all .12s; text-transform:capitalize; }
.fl-filter:hover { color:rgba(255,255,255,0.7); }
.fl-filter.active { background:#4a9eff; color:#000; border-color:#4a9eff; }
.fl-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; gap:6px; color:rgba(255,255,255,0.3); font-size:11px; padding:16px; text-align:center; }
.fl-empty-icon { font-size:24px; opacity:0.3; }
.fl-muted { color:rgba(255,255,255,0.35); font-size:11px; }
.fl-mono { font-family:monospace; font-size:11px; color:#e6edf3; }
.fl-node-card { display:flex; flex-direction:column; gap:4px; padding:8px 10px; border-left:2px solid transparent; background:transparent; cursor:pointer; text-align:left; width:100%; transition:all .12s; border-bottom:1px solid rgba(255,255,255,0.04); }
.fl-node-card:hover { background:rgba(255,255,255,0.03); }
.fl-node-card.selected { background:rgba(74,158,255,0.07); border-left-color:#4a9eff; }
.fl-node-row { display:flex; align-items:center; gap:8px; }
.fl-type-badge { width:26px; height:26px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; flex-shrink:0; background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.5); }
.fl-type-badge.drone { background:rgba(74,158,255,0.18); color:#4a9eff; }
.fl-type-badge.robot { background:rgba(168,85,247,0.18); color:#c084fc; }
.fl-type-badge.edge  { background:rgba(20,184,166,0.18); color:#2dd4bf; }
.fl-type-badge.server{ background:rgba(234,179,8,0.18); color:#fbbf24; }
.fl-type-badge.sensor{ background:rgba(239,68,68,0.18); color:#f87171; }
.fl-type-badge.camera{ background:rgba(99,102,241,0.18); color:#818cf8; }
.fl-type-badge.vehicle{ background:rgba(34,197,94,0.18); color:#22c55e; }
.fl-type-badge.lg { width:36px; height:36px; font-size:12px; border-radius:8px; }
.fl-node-info { flex:1; min-width:0; }
.fl-node-name { font-size:12px; font-weight:600; color:#e6edf3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.fl-node-sub { font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.fl-node-right { display:flex; align-items:center; gap:5px; flex-shrink:0; }
.fl-status-dot { width:7px; height:7px; border-radius:50%; background:#555; }
.fl-status-dot.online { background:#22c55e; box-shadow:0 0 4px #22c55e; }
.fl-status-dot.degraded { background:#f59e0b; }
.fl-status-dot.offline { background:#555; }
.fl-status-dot.maintenance { background:#818cf8; }
.fl-battery { font-family:monospace; font-size:10px; }
.fl-caps { display:flex; flex-wrap:wrap; gap:3px; }
.fl-cap { font-size:10px; padding:1px 5px; border-radius:3px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.5); }
.fl-cap.muted { opacity:0.6; }

/* Detail */
.fl-detail { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.fl-detail-hd { display:flex; align-items:center; gap:10px; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.fl-detail-name { font-size:13px; font-weight:700; color:#e6edf3; }
.fl-status-pill { margin-left:auto; padding:3px 10px; border-radius:10px; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); }
.fl-status-pill.online { background:rgba(34,197,94,0.12); border-color:rgba(34,197,94,0.25); color:#22c55e; }
.fl-status-pill.degraded { background:rgba(245,158,11,0.12); border-color:rgba(245,158,11,0.25); color:#f59e0b; }
.fl-status-pill.offline { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.35); }
.fl-detail-body { flex:1; overflow-y:auto; padding:12px 14px; display:flex; flex-direction:column; gap:14px; }
.fl-section-title { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:rgba(255,255,255,0.3); margin-bottom:6px; }
.fl-kv-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:6px; }
.fl-kv { display:flex; flex-direction:column; gap:2px; }
.fl-batt-row { display:flex; align-items:center; gap:8px; }
.fl-batt-bar { flex:1; height:6px; border-radius:3px; background:rgba(255,255,255,0.08); overflow:hidden; }
.fl-batt-fill { height:100%; border-radius:3px; transition:width .3s; background:#555; }
.fl-batt-fill.good { background:#22c55e; }
.fl-batt-fill.warn { background:#f59e0b; }
.fl-batt-fill.crit { background:#f85149; }
.fl-caps-wrap { display:flex; flex-wrap:wrap; gap:4px; }
.fl-detail-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:8px; }
</style>
