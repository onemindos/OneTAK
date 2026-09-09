<template>
    <div class='conn-root'>
        <div class='conn-toolbar'>
            <Link2
                :size='14'
                class='conn-icon'
            />
            <span class='conn-title'>Connections</span>
            <div class='conn-input-wrap'>
                <Search
                    :size='12'
                    class='conn-search-icon'
                />
                <input
                    v-model='filter'
                    class='conn-search'
                    placeholder='filter by name, IP, account…'
                >
            </div>
            <div class='conn-spacer' />
            <span class='conn-count'>{{ filtered.length }} / {{ connections.length }}</span>
            <button
                class='conn-btn'
                :disabled='loading'
                @click='refresh'
            >
                <RefreshCw
                    :size='12'
                    :class='{ spin: loading }'
                />
            </button>
        </div>

        <div
            v-if='error'
            class='conn-error'
        >
            <AlertCircle :size='13' /> {{ error }}
        </div>

        <div
            v-if='!nc'
            class='conn-empty'
        >
            <Link2
                :size='28'
                style='opacity:0.3'
            /><p>Not connected to NATS.</p>
        </div>

        <div
            v-else
            class='conn-table-wrap'
        >
            <table class='conn-table'>
                <thead>
                    <tr>
                        <th />
                        <th @click='sortBy("name")'>
                            Name
                        </th>
                        <th @click='sortBy("ip")'>
                            Client IP
                        </th>
                        <th @click='sortBy("account")'>
                            Account
                        </th>
                        <th @click='sortBy("subscriptions")'>
                            Subs
                        </th>
                        <th @click='sortBy("msgsIn")'>
                            In
                        </th>
                        <th @click='sortBy("msgsOut")'>
                            Out
                        </th>
                        <th @click='sortBy("bytesOut")'>
                            Data
                        </th>
                        <th>Lang</th>
                        <th>RTT</th>
                    </tr>
                </thead>
                <tbody>
                    <template
                        v-for='conn in filtered'
                        :key='conn.cid'
                    >
                        <tr
                            class='conn-row'
                            :class='{ expanded: expandedCid === conn.cid }'
                            @click='toggleExpand(conn.cid)'
                        >
                            <td class='conn-expand-cell'>
                                <ChevronRight
                                    :size='11'
                                    :class='{ rotated: expandedCid === conn.cid }'
                                />
                            </td>
                            <td class='mono'>
                                {{ conn.name || `cid:${conn.cid}` }}
                            </td>
                            <td class='mono muted'>
                                {{ conn.ip }}:{{ conn.port }}
                            </td>
                            <td class='muted'>
                                {{ conn.account }}
                            </td>
                            <td class='mono'>
                                {{ conn.subscriptions }}
                            </td>
                            <td class='mono'>
                                {{ formatNum(conn.msgsIn) }}
                            </td>
                            <td class='mono'>
                                {{ formatNum(conn.msgsOut) }}
                            </td>
                            <td class='mono'>
                                {{ formatBytes(conn.bytesIn + conn.bytesOut) }}
                            </td>
                            <td><span class='conn-badge'>{{ conn.lang }}</span></td>
                            <td class='mono muted'>
                                {{ conn.rtt ?? '—' }}
                            </td>
                        </tr>
                        <tr
                            v-if='expandedCid === conn.cid'
                            class='conn-detail-row'
                        >
                            <td colspan='10'>
                                <div class='conn-detail'>
                                    <div class='conn-detail-meta'>
                                        <span>version: <b>{{ conn.version }}</b></span>
                                        <span>uptime: <b>{{ conn.uptime ?? '—' }}</b></span>
                                        <span>subscriptions: <b>{{ conn.subscriptions }}</b></span>
                                    </div>
                                    <div
                                        v-if='conn.subs?.length'
                                        class='conn-subs'
                                    >
                                        <span class='conn-subs-label'>Subscriptions:</span>
                                        <code
                                            v-for='s in conn.subs'
                                            :key='s'
                                        >{{ s }}</code>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </template>
                    <tr v-if='!filtered.length && !loading'>
                        <td
                            colspan='10'
                            class='conn-empty-row'
                        >
                            No connections match filter.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, onMounted } from 'vue';
import { Link2, RefreshCw, AlertCircle, Search, ChevronRight } from 'lucide-vue-next';
import { createInbox } from 'nats.ws';
import { useNatsStore } from '../stores/nats.store';

interface ConnectionInfo {
    cid: number; name: string; ip: string; port: number;
    account: string; subscriptions: number;
    msgsIn: number; msgsOut: number; bytesIn: number; bytesOut: number;
    lang: string; version: string; rtt?: string; uptime?: string; subs?: string[];
}

const { nc, sc } = useNatsStore();
const connections = ref<ConnectionInfo[]>([]);
const loading     = ref(false);
const error       = ref<string | null>(null);
const filter      = ref('');
const sortCol     = ref<keyof ConnectionInfo>('name');
const sortAsc     = ref(true);
const expandedCid = ref<number | null>(null);

const filtered = computed(() => {
    const q = filter.value.toLowerCase();
    let list = connections.value;
    if (q) list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        c.ip.toLowerCase().includes(q) ||
        (c.account || '').toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => {
        const av = a[sortCol.value] ?? '';
        const bv = b[sortCol.value] ?? '';
        return sortAsc.value
            ? String(av).localeCompare(String(bv), undefined, { numeric: true })
            : String(bv).localeCompare(String(av), undefined, { numeric: true });
    });
});

function sortBy(col: keyof ConnectionInfo) {
    if (sortCol.value === col) { sortAsc.value = !sortAsc.value; }
    else { sortCol.value = col; sortAsc.value = true; }
}

function toggleExpand(cid: number) {
    expandedCid.value = expandedCid.value === cid ? null : cid;
}

async function refresh() {
    if (!nc.value) return;
    loading.value = true; error.value = null;
    try {
        const inbox = createInbox();
        const results: ConnectionInfo[] = [];
        const sub = nc.value.subscribe(inbox, { max: 10, timeout: 3000 });
        nc.value.publish('$SYS.REQ.SERVER.PING', new Uint8Array(), { reply: inbox });

        for await (const msg of sub) {
            try {
                const data = JSON.parse(sc.decode(msg.data)) as Record<string, unknown>;
                const conns = (data.connz as Record<string,unknown>) ?? {};
                const list  = (conns.connections as Array<Record<string,unknown>>) ?? [];
                for (const c of list) {
                    results.push({
                        cid:           (c.cid as number) ?? 0,
                        name:          (c.name as string) ?? '',
                        ip:            (c.ip as string) ?? '?',
                        port:          (c.port as number) ?? 0,
                        account:       (c.account as string) ?? '',
                        subscriptions: (c.subscriptions as number) ?? 0,
                        msgsIn:        (c.in_msgs as number) ?? 0,
                        msgsOut:       (c.out_msgs as number) ?? 0,
                        bytesIn:       (c.in_bytes as number) ?? 0,
                        bytesOut:      (c.out_bytes as number) ?? 0,
                        lang:          (c.lang as string) ?? '?',
                        version:       (c.version as string) ?? '?',
                        rtt:           (c.rtt as string),
                        uptime:        (c.uptime as string),
                        subs:          (c.subscriptions_list as string[]),
                    });
                }
            } catch { /* skip malformed */ }
        }
        connections.value = results;
    } catch (e) {
        error.value = e instanceof Error ? e.message : String(e);
    } finally {
        loading.value = false;
    }
}

function formatBytes(n: number) {
    if (n < 1024) return `${n}B`;
    if (n < 1024*1024) return `${(n/1024).toFixed(1)}KB`;
    return `${(n/1024/1024).toFixed(1)}MB`;
}
function formatNum(n: number) {
    if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`;
    return String(n);
}

onMounted(refresh);
</script>

<style scoped>
.conn-root { display:flex; flex-direction:column; height:100%; overflow:hidden; background:var(--cloudtak-panel-bg,rgba(13,17,23,0.98)); color:#e6edf3; font-size:12px; }
.conn-toolbar { display:flex; align-items:center; gap:7px; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; flex-wrap:wrap; }
.conn-icon { color:#4a9eff; }
.conn-title { font-weight:700; font-size:13px; }
.conn-input-wrap { position:relative; flex:1; min-width:160px; }
.conn-search-icon { position:absolute; left:8px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.25); pointer-events:none; }
.conn-search { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:5px; color:#e6edf3; padding:4px 8px 4px 28px; font-size:11px; outline:none; }
.conn-search:focus { border-color:#4a9eff; }
.conn-spacer { flex:1; }
.conn-count { font-size:11px; color:rgba(255,255,255,0.3); }
.conn-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:5px; color:rgba(255,255,255,0.5); padding:4px 8px; cursor:pointer; display:flex; align-items:center; }
.conn-btn:disabled { opacity:0.4; cursor:default; }
.conn-error { margin:8px 12px; padding:6px 10px; background:rgba(248,81,73,0.1); border:1px solid rgba(248,81,73,0.25); border-radius:6px; color:#f85149; font-size:11px; display:flex; align-items:center; gap:6px; }
.conn-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:rgba(255,255,255,0.3); }
.conn-table-wrap { flex:1; overflow:auto; }
.conn-table { width:100%; border-collapse:collapse; font-size:11px; }
.conn-table th { padding:6px 10px; text-align:left; color:rgba(255,255,255,0.35); font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid rgba(255,255,255,0.07); cursor:pointer; white-space:nowrap; position:sticky; top:0; background:rgba(13,17,23,0.95); }
.conn-table th:hover { color:rgba(255,255,255,0.7); }
.conn-row td { padding:5px 10px; border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; }
.conn-row:hover td { background:rgba(255,255,255,0.03); }
.conn-row.expanded td { background:rgba(74,158,255,0.05); }
.conn-expand-cell { width:20px; }
.conn-expand-cell svg { color:rgba(255,255,255,0.3); transition:transform .15s; }
.conn-expand-cell svg.rotated { transform:rotate(90deg); }
.mono { font-family:monospace; }
.muted { color:rgba(255,255,255,0.4); }
.conn-badge { background:rgba(255,255,255,0.07); border-radius:3px; padding:1px 5px; font-size:10px; font-family:monospace; }
.conn-detail-row td { background:rgba(0,0,0,0.2); padding:0; }
.conn-detail { padding:8px 40px 10px; display:flex; flex-direction:column; gap:6px; }
.conn-detail-meta { display:flex; gap:16px; font-size:11px; color:rgba(255,255,255,0.4); }
.conn-detail-meta b { color:rgba(255,255,255,0.7); }
.conn-subs { display:flex; flex-wrap:wrap; gap:4px; align-items:center; }
.conn-subs-label { font-size:10px; color:rgba(255,255,255,0.3); margin-right:4px; }
.conn-subs code { font-size:10px; font-family:monospace; background:rgba(255,255,255,0.05); padding:1px 6px; border-radius:3px; color:rgba(255,255,255,0.55); }
.conn-empty-row { text-align:center; padding:24px; color:rgba(255,255,255,0.25); }
@keyframes spin { to { transform:rotate(360deg); } }
.spin { animation:spin 1s linear infinite; }
</style>
