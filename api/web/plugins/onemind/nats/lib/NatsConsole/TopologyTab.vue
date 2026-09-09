<template>
    <div class='topology-root'>
        <div class='topo-toolbar'>
            <Network
                :size='14'
                class='topo-icon'
            />
            <span class='topo-title'>Topology</span>
            <div class='topo-spacer' />
            <button
                class='topo-btn'
                :disabled='loading'
                @click='refresh'
            >
                <RefreshCw
                    :size='12'
                    :class='{ spin: loading }'
                />
                Refresh
            </button>
        </div>

        <div
            v-if='error'
            class='topo-error'
        >
            <AlertCircle :size='13' /> {{ error }}
        </div>

        <!-- Server cards -->
        <div
            v-if='servers.length'
            class='topo-cards'
        >
            <div
                v-for='s in servers'
                :key='s.id'
                class='topo-card'
                :class='{ primary: s.isPrimary }'
            >
                <div class='topo-card-header'>
                    <span class='topo-card-name'>{{ s.name }}</span>
                    <span
                        v-if='s.isPrimary'
                        class='topo-primary-badge'
                    >PRIMARY</span>
                    <span class='topo-card-version'>v{{ s.version }}</span>
                </div>
                <div class='topo-card-meta'>
                    <span class='topo-meta-item'>
                        <Link2 :size='10' /> {{ s.cluster }}
                    </span>
                    <span class='topo-meta-item'>
                        <Users :size='10' /> {{ s.connections }} conns
                    </span>
                    <span class='topo-meta-item'>
                        <GitBranch :size='10' /> {{ s.routes }} routes
                    </span>
                    <span class='topo-meta-item'>
                        <Leaf :size='10' /> {{ s.leafNodes }} leaf
                    </span>
                </div>
                <div class='topo-card-stats'>
                    <div class='topo-stat'>
                        <ArrowDown
                            :size='10'
                            class='stat-in'
                        />
                        <span>{{ formatNum(s.msgsIn) }}</span>
                    </div>
                    <div class='topo-stat'>
                        <ArrowUp
                            :size='10'
                            class='stat-out'
                        />
                        <span>{{ formatNum(s.msgsOut) }}</span>
                    </div>
                    <div class='topo-stat host'>
                        <span>{{ s.host }}:{{ s.port }}</span>
                    </div>
                </div>
                <!-- Route peers -->
                <div
                    v-if='s.peers.length'
                    class='topo-peers'
                >
                    <span class='topo-peers-label'>Routes to:</span>
                    <span
                        v-for='peer in s.peers'
                        :key='peer'
                        class='topo-peer-tag'
                    >{{ peer }}</span>
                </div>
            </div>
        </div>

        <div
            v-else-if='!loading'
            class='topo-empty'
        >
            <Network
                :size='28'
                style='opacity:0.3'
            />
            <p>
                No servers discovered.<br>
                Check that <code>nats-mon.onemindos.dev</code> is reachable.
            </p>
        </div>

        <div
            v-if='loading && !servers.length'
            class='topo-loading'
        >
            <RefreshCw
                :size='20'
                class='spin'
                style='opacity:0.4'
            />
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue';
import { Network, RefreshCw, AlertCircle, Link2, Users, ArrowDown, ArrowUp, GitBranch, Leaf } from 'lucide-vue-next';

const MON_BASE = 'https://nats-mon.onemindos.dev';

interface ServerNode {
    id: string; name: string; host: string; port: number;
    version: string; cluster: string; connections: number;
    routes: number; leafNodes: number; msgsIn: number; msgsOut: number;
    isPrimary: boolean; peers: string[];
}

const servers  = ref<ServerNode[]>([]);
const loading  = ref(false);
const error    = ref<string | null>(null);

async function refresh() {
    loading.value = true;
    error.value   = null;
    try {
        const [varzRes, routezRes] = await Promise.all([
            fetch(`${MON_BASE}/varz`),
            fetch(`${MON_BASE}/routez?detail=1`),
        ]);
        if (!varzRes.ok) throw new Error(`varz ${varzRes.status}`);
        const varz:   Record<string, unknown> = await varzRes.json();
        const routez: Record<string, unknown> = routezRes.ok ? await routezRes.json() : {};
        const cluster = (varz.cluster_name as string) ?? 'nats';
        const routes  = (routez.routes as Array<Record<string,unknown>>) ?? [];

        const primary: ServerNode = {
            id:          (varz.server_id as string) ?? 'primary',
            name:        (varz.server_name as string) ?? 'nats-0',
            host:        (varz.host as string) ?? '0.0.0.0',
            port:        (varz.port as number) ?? 4222,
            version:     (varz.version as string) ?? '?',
            cluster,
            connections: (varz.connections as number) ?? 0,
            routes:      (varz.routes as number) ?? 0,
            leafNodes:   (varz.leafnodes as number) ?? 0,
            msgsIn:      (varz.in_msgs as number) ?? 0,
            msgsOut:     (varz.out_msgs as number) ?? 0,
            isPrimary:   true,
            peers:       routes.map(r => (r.remote_name as string) ?? String(r.remote_id)).slice(0, 8),
        };

        const peers: ServerNode[] = routes.map((r) => ({
            id:          (r.remote_id as string) ?? String(Math.random()),
            name:        (r.remote_name as string) ?? 'unknown',
            host:        (r.ip as string) ?? '?',
            port:        4222,
            version:     (r.version as string) ?? '?',
            cluster,
            connections: 0, routes: 0, leafNodes: 0,
            msgsIn:      (r.in_msgs as number) ?? 0,
            msgsOut:     (r.out_msgs as number) ?? 0,
            isPrimary:   false,
            peers:       [primary.name],
        }));

        servers.value = [primary, ...peers];
    } catch (e) {
        error.value = e instanceof Error ? e.message : String(e);
    } finally {
        loading.value = false;
    }
}

function formatNum(n: number): string {
    if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`;
    return String(n);
}

onMounted(refresh);
</script>

<style scoped>
.topology-root {
    display: flex; flex-direction: column; height: 100%; overflow-y: auto;
    background: var(--cloudtak-panel-bg, rgba(13,17,23,0.98));
    color: #e6edf3; font-size: 12px;
}
.topo-toolbar {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
}
.topo-icon { color: #4a9eff; }
.topo-title { font-weight: 700; font-size: 13px; }
.topo-spacer { flex: 1; }
.topo-btn {
    display: flex; align-items: center; gap: 5px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 5px; color: rgba(255,255,255,0.5); padding: 3px 9px;
    font-size: 11px; cursor: pointer;
}
.topo-btn:hover { color: #e6edf3; background: rgba(255,255,255,0.1); }
.topo-btn:disabled { opacity: 0.4; cursor: default; }

.topo-error {
    margin: 10px 12px; padding: 8px 10px;
    background: rgba(248,81,73,0.1); border: 1px solid rgba(248,81,73,0.25);
    border-radius: 6px; color: #f85149; font-size: 11px;
    display: flex; align-items: center; gap: 6px;
}

.topo-cards { display: flex; flex-direction: column; gap: 8px; padding: 12px; }
.topo-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 7px;
}
.topo-card.primary { border-color: rgba(74,158,255,0.3); background: rgba(74,158,255,0.05); }

.topo-card-header { display: flex; align-items: center; gap: 8px; }
.topo-card-name { font-weight: 700; font-size: 13px; font-family: monospace; }
.topo-primary-badge {
    font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px;
    background: rgba(74,158,255,0.15); color: #4a9eff;
}
.topo-card-version { font-size: 10px; color: rgba(255,255,255,0.3); margin-left: auto; }

.topo-card-meta { display: flex; gap: 10px; flex-wrap: wrap; }
.topo-meta-item { display: flex; align-items: center; gap: 3px; font-size: 11px; color: rgba(255,255,255,0.45); }

.topo-card-stats { display: flex; gap: 12px; align-items: center; }
.topo-stat { display: flex; align-items: center; gap: 3px; font-size: 11px; font-family: monospace; color: rgba(255,255,255,0.5); }
.stat-in  { color: #22c55e; }
.stat-out { color: #60a5fa; }
.topo-stat.host { margin-left: auto; color: rgba(255,255,255,0.2); font-size: 10px; }

.topo-peers { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.topo-peers-label { font-size: 10px; color: rgba(255,255,255,0.25); }
.topo-peer-tag {
    font-size: 10px; font-family: monospace; padding: 1px 6px; border-radius: 3px;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);
}

.topo-empty, .topo-loading {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; color: rgba(255,255,255,0.3); text-align: center; padding: 40px;
}
.topo-empty code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 3px; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
