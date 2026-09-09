<template>
    <div class='streams-root'>
        <div class='streams-toolbar'>
            <Layers
                :size='14'
                class='streams-icon'
            />
            <span class='streams-title'>Streams</span>
            <div class='conn-spacer' />
            <span class='streams-count'>{{ streams.length }} streams</span>
            <button
                class='streams-btn'
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
            class='streams-error'
        >
            <AlertCircle :size='13' /> {{ error }}
        </div>
        <div
            v-if='!nc'
            class='streams-empty'
        >
            <Layers
                :size='28'
                style='opacity:0.3'
            /><p>Not connected.</p>
        </div>

        <div
            v-else
            class='streams-list'
        >
            <div
                v-for='s in streams'
                :key='s.config.name'
                class='stream-item'
            >
                <div
                    class='sr-header'
                    @click='toggleExpand(s.config.name)'
                >
                    <ChevronRight
                        :size='12'
                        :class='{ rotated: expandedStream === s.config.name }'
                    />
                    <span class='sr-name'>{{ s.config.name }}</span>
                    <span
                        class='sr-badge'
                        :class='s.config.retention'
                    >{{ s.config.retention }}</span>
                    <span class='sr-metric'>{{ s.state.messages.toLocaleString() }} msgs</span>
                    <span class='sr-metric'>{{ formatBytes(s.state.bytes) }}</span>
                    <span class='sr-metric'>{{ s.state.consumer_count }} consumers</span>
                    <button
                        class='sr-purge'
                        @click.stop='requestPurge(s.config.name)'
                    >
                        <Eraser :size='11' />
                    </button>
                </div>
                <div
                    v-if='expandedStream === s.config.name'
                    class='sr-detail'
                >
                    <div class='sr-subjects'>
                        <span class='sr-label'>Subjects:</span>
                        <code
                            v-for='sub in s.config.subjects'
                            :key='sub'
                        >{{ sub }}</code>
                    </div>
                    <div class='sr-info-row'>
                        <span>storage: <b>{{ s.config.storage }}</b></span>
                        <span>replicas: <b>{{ s.config.num_replicas }}</b></span>
                        <span>max age: <b>{{ formatTTL(s.config.max_age) }}</b></span>
                        <span>first seq: <b>{{ s.state.first_seq }}</b></span>
                        <span>last seq: <b>{{ s.state.last_seq }}</b></span>
                    </div>
                    <div
                        v-if='consumers.length'
                        class='sr-consumers'
                    >
                        <div class='sr-label'>
                            Consumers
                        </div>
                        <div
                            v-for='c in consumers'
                            :key='c.name'
                            class='sr-consumer'
                        >
                            <span class='sr-consumer-name'>{{ c.name }}</span>
                            <span class='sr-consumer-metric'>{{ c.num_pending }} pending</span>
                            <span class='sr-consumer-metric'>{{ c.num_ack_pending }} unacked</span>
                            <span class='sr-consumer-metric muted'>{{ c.delivered.consumer_seq }} delivered</span>
                        </div>
                    </div>
                    <div
                        v-if='loadingConsumers'
                        class='sr-loading-consumers'
                    >
                        Loading consumers…
                    </div>
                </div>
            </div>
            <div
                v-if='!streams.length && !loading'
                class='streams-empty-inline'
            >
                No JetStream streams found.
            </div>
        </div>

        <!-- Purge confirm -->
        <div
            v-if='purgeTarget'
            class='streams-modal-bg'
            @click='purgeTarget = null'
        >
            <div
                class='streams-modal'
                @click.stop
            >
                <p>Purge all messages from <b>{{ purgeTarget }}</b>?</p>
                <div class='streams-modal-actions'>
                    <button
                        class='streams-btn'
                        @click='purgeTarget = null'
                    >
                        Cancel
                    </button>
                    <button
                        class='streams-btn streams-btn-danger'
                        :disabled='purging'
                        @click='doPurge'
                    >
                        {{ purging ? 'Purging…' : 'Purge' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue';
import { Layers, RefreshCw, AlertCircle, ChevronRight, Eraser } from 'lucide-vue-next';
import type { ConsumerInfo } from 'nats.ws';
import { useNatsStore } from '../stores/nats.store';

interface StreamConfig {
    name: string; subjects: string[];
    retention: 'limits' | 'workqueue' | 'interest';
    storage: 'file' | 'memory';
    num_replicas: number; max_age: number;
}
interface StreamState {
    messages: number; bytes: number;
    first_seq: number; last_seq: number;
    consumer_count: number;
}
interface StreamInfo { config: StreamConfig; state: StreamState }

const { nc } = useNatsStore();
const streams         = ref<StreamInfo[]>([]);
const loading         = ref(false);
const error           = ref<string | null>(null);
const expandedStream  = ref<string | null>(null);
const consumers       = ref<ConsumerInfo[]>([]);
const loadingConsumers = ref(false);
const purgeTarget     = ref<string | null>(null);
const purging         = ref(false);

async function refresh() {
    if (!nc.value) return;
    loading.value = true; error.value = null;
    try {
        const enc = new TextEncoder();
        const dec = new TextDecoder();
        const namesMsg = await nc.value.request(
            '$JS.API.STREAM.NAMES',
            enc.encode(JSON.stringify({ offset: 0 })),
            { timeout: 5000 }
        );
        const namesResp = JSON.parse(dec.decode(namesMsg.data));
        if (namesResp.error) throw new Error(namesResp.error.description);
        const names: string[] = namesResp.streams ?? [];

        const infos = await Promise.allSettled(
            names.slice(0, 20).map(async name => {
                const m = await nc.value!.request(
                    `$JS.API.STREAM.INFO.${name}`,
                    enc.encode('{}'),
                    { timeout: 3000 }
                );
                return JSON.parse(dec.decode(m.data)) as StreamInfo;
            })
        );
        streams.value = infos
            .filter((r): r is PromiseFulfilledResult<StreamInfo> => r.status === 'fulfilled')
            .map(r => r.value);
    } catch (e) {
        error.value = e instanceof Error ? e.message : String(e);
    } finally {
        loading.value = false;
    }
}

async function toggleExpand(name: string) {
    if (expandedStream.value === name) { expandedStream.value = null; return; }
    expandedStream.value = name;
    consumers.value = [];
    if (!nc.value) return;
    loadingConsumers.value = true;
    try {
        const enc = new TextEncoder();
        const dec = new TextDecoder();
        const msg = await nc.value.request(
            `$JS.API.CONSUMER.NAMES.${name}`,
            enc.encode('{}'),
            { timeout: 3000 }
        );
        const resp = JSON.parse(dec.decode(msg.data));
        const names: string[] = resp.consumers ?? [];
        const infos = await Promise.allSettled(
            names.slice(0, 10).map(async cname => {
                const m = await nc.value!.request(
                    `$JS.API.CONSUMER.INFO.${name}.${cname}`,
                    enc.encode('{}'),
                    { timeout: 2000 }
                );
                return JSON.parse(dec.decode(m.data));
            })
        );
        consumers.value = infos
            .filter((r): r is PromiseFulfilledResult<ConsumerInfo> => r.status === 'fulfilled')
            .map(r => r.value);
    } catch { // ignore
        consumers.value = [];
    } finally { loadingConsumers.value = false; }
}

function requestPurge(name: string) { purgeTarget.value = name; }

async function doPurge() {
    if (!purgeTarget.value || !nc.value) return;
    purging.value = true;
    try {
        const enc = new TextEncoder();
        await nc.value.request(
            `$JS.API.STREAM.PURGE.${purgeTarget.value}`,
            enc.encode('{}'),
            { timeout: 5000 }
        );
        purgeTarget.value = null;
        await refresh();
    } catch { // ignore
    }
    purging.value = false;
}

function formatBytes(n: number) {
    if (n < 1024) return `${n}B`;
    if (n < 1024*1024) return `${(n/1024).toFixed(1)}KB`;
    if (n < 1024*1024*1024) return `${(n/1024/1024).toFixed(1)}MB`;
    return `${(n/1024/1024/1024).toFixed(1)}GB`;
}
function formatTTL(ns: number) {
    if (!ns) return 'forever';
    const s = ns / 1e9;
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.round(s/60)}m`;
    if (s < 86400) return `${Math.round(s/3600)}h`;
    return `${Math.round(s/86400)}d`;
}

onMounted(refresh);
</script>

<style scoped>
.streams-root { display:flex; flex-direction:column; height:100%; overflow:hidden; background:var(--cloudtak-panel-bg,rgba(13,17,23,0.98)); color:#e6edf3; font-size:12px; position:relative; }
.streams-toolbar { display:flex; align-items:center; gap:7px; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.streams-icon { color:#4a9eff; }
.streams-title { font-weight:700; font-size:13px; }
.conn-spacer { flex:1; }
.streams-count { font-size:11px; color:rgba(255,255,255,0.3); }
.streams-btn { display:flex; align-items:center; gap:5px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:5px; color:rgba(255,255,255,0.5); padding:3px 9px; font-size:11px; cursor:pointer; }
.streams-btn:hover:not(:disabled) { color:#e6edf3; background:rgba(255,255,255,0.1); }
.streams-btn:disabled { opacity:0.4; cursor:default; }
.streams-btn-danger { color:#f85149; border-color:rgba(248,81,73,0.35); }
.streams-error { margin:8px 12px; padding:6px 10px; background:rgba(248,81,73,0.1); border:1px solid rgba(248,81,73,0.25); border-radius:6px; color:#f85149; font-size:11px; display:flex; align-items:center; gap:6px; }
.streams-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:rgba(255,255,255,0.3); }
.streams-empty-inline { text-align:center; padding:24px; color:rgba(255,255,255,0.25); }
.streams-list { flex:1; overflow-y:auto; }
.stream-item { border-bottom:1px solid rgba(255,255,255,0.05); }
.sr-header { display:flex; align-items:center; gap:8px; padding:7px 12px; cursor:pointer; }
.sr-header:hover { background:rgba(255,255,255,0.03); }
.sr-header svg.rotated { transform:rotate(90deg); }
.sr-name { font-weight:700; font-family:monospace; font-size:12px; color:#e6edf3; }
.sr-badge { font-size:9px; font-weight:700; padding:1px 5px; border-radius:3px; }
.sr-badge.limits   { background:rgba(148,163,184,0.12); color:#94a3b8; }
.sr-badge.workqueue{ background:rgba(74,158,255,0.12); color:#4a9eff; }
.sr-badge.interest { background:rgba(245,158,11,0.12); color:#f59e0b; }
.sr-metric { font-size:11px; color:rgba(255,255,255,0.4); margin-left:auto; }
.sr-metric + .sr-metric { margin-left:8px; }
.sr-purge { background:none; border:none; color:rgba(255,255,255,0.2); cursor:pointer; padding:2px; margin-left:6px; }
.sr-purge:hover { color:#f85149; }
.sr-detail { padding:8px 12px 10px 32px; display:flex; flex-direction:column; gap:6px; background:rgba(0,0,0,0.2); }
.sr-label { font-size:10px; color:rgba(255,255,255,0.3); text-transform:uppercase; }
.sr-subjects { display:flex; flex-wrap:wrap; gap:4px; align-items:center; }
.sr-subjects code { font-size:10px; font-family:monospace; background:rgba(255,255,255,0.06); padding:1px 6px; border-radius:3px; color:#60a5fa; }
.sr-info-row { display:flex; gap:14px; font-size:11px; color:rgba(255,255,255,0.4); flex-wrap:wrap; }
.sr-info-row b { color:rgba(255,255,255,0.7); }
.sr-consumers { display:flex; flex-direction:column; gap:4px; }
.sr-consumer { display:flex; gap:12px; font-size:11px; font-family:monospace; color:rgba(255,255,255,0.5); padding:3px 6px; background:rgba(255,255,255,0.03); border-radius:4px; }
.sr-consumer-name { color:#a78bfa; }
.muted { color:rgba(255,255,255,0.25); }
.sr-loading-consumers { font-size:11px; color:rgba(255,255,255,0.25); font-style:italic; }
.streams-modal-bg { position:absolute; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:50; }
.streams-modal { background:#161b22; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:16px 20px; display:flex; flex-direction:column; gap:12px; max-width:300px; }
.streams-modal-actions { display:flex; gap:8px; justify-content:flex-end; }
@keyframes spin { to { transform:rotate(360deg); } }
.spin { animation:spin 1s linear infinite; }
</style>
