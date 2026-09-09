<template>
    <div class='kv-root'>
        <!-- Header -->
        <div class='kv-toolbar'>
            <Archive
                :size='14'
                class='kv-icon'
            />
            <span class='kv-title'>KV Buckets</span>
            <div class='conn-spacer' />
            <span class='kv-count'>{{ buckets.length }} buckets</span>
            <button
                class='kv-btn'
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
            class='kv-error'
        >
            <AlertCircle :size='13' /> {{ error }}
        </div>
        <div
            v-if='!nc'
            class='kv-empty'
        >
            <Archive
                :size='28'
                style='opacity:0.3'
            /><p>Not connected.</p>
        </div>

        <!-- Bucket list -->
        <div
            v-else-if='!browserBucket'
            class='kv-bucket-list'
        >
            <div
                v-for='b in buckets'
                :key='b.name'
                class='bucket-row'
                @click='openBrowser(b.name)'
            >
                <Key
                    :size='12'
                    style='color:#f59e0b;flex-shrink:0'
                />
                <span class='bucket-name'>{{ b.name.replace('KV_','') }}</span>
                <span class='bucket-metric'>{{ b.keys }} keys</span>
                <span class='bucket-metric'>{{ formatBytes(b.bytes) }}</span>
                <span class='bucket-metric'>TTL {{ formatTTL(b.ttl) }}</span>
                <span class='bucket-metric'>×{{ b.replicas }} replicas</span>
                <ChevronRight
                    :size='12'
                    style='color:rgba(255,255,255,0.25);margin-left:auto'
                />
            </div>
            <div
                v-if='!buckets.length && !loading'
                class='kv-empty-inline'
            >
                No KV buckets found.<br>
                <span style='font-size:10px'>KV buckets appear as streams named KV_*</span>
            </div>
        </div>

        <!-- Key browser -->
        <div
            v-else
            class='kv-browser'
        >
            <div class='browser-header'>
                <button
                    class='kv-btn'
                    @click='browserBucket = null'
                >
                    <ArrowLeft :size='12' /> Back
                </button>
                <span class='browser-title'>{{ browserBucket.replace('KV_','') }}</span>
                <div class='conn-spacer' />
                <button
                    class='kv-btn'
                    :disabled='loadingKeys'
                    @click='loadKeys'
                >
                    <RefreshCw
                        :size='12'
                        :class='{ spin: loadingKeys }'
                    />
                </button>
            </div>

            <div class='browser-toolbar'>
                <input
                    v-model='keyFilter'
                    class='kv-input'
                    placeholder='filter keys…'
                >
            </div>

            <div class='browser-body'>
                <!-- Key list -->
                <div class='key-list'>
                    <div
                        v-for='k in filteredKeys'
                        :key='k'
                        class='key-row'
                        :class='{ active: selectedKey === k }'
                        @click='selectKey(k)'
                    >
                        <span class='key-name'>{{ k }}</span>
                    </div>
                    <div
                        v-if='!filteredKeys.length && !loadingKeys'
                        class='kv-empty-inline'
                    >
                        No keys.
                    </div>
                </div>

                <!-- Value pane -->
                <div class='value-pane'>
                    <template v-if='selectedKey'>
                        <div class='val-toolbar'>
                            <span class='val-key-label'>{{ selectedKey }}</span>
                            <button
                                class='kv-btn danger'
                                :disabled='deleting'
                                @click='deleteKey(selectedKey)'
                            >
                                <Trash2 :size='11' /> {{ deleting ? '…' : 'Delete' }}
                            </button>
                        </div>
                        <pre class='val-body'>{{ keyValue ?? '…' }}</pre>
                    </template>
                    <div
                        v-else
                        class='val-placeholder'
                    >
                        Select a key to view its value.
                    </div>
                </div>
            </div>

            <!-- Put new key -->
            <div class='put-form'>
                <input
                    v-model='putKey'
                    placeholder='key'
                    class='kv-input kv-input-sm'
                >
                <input
                    v-model='putValue'
                    placeholder='value (JSON or string)'
                    class='kv-input kv-input-sm'
                    style='flex:2'
                >
                <button
                    class='kv-btn'
                    :disabled='!putKey || putting'
                    @click='putKV'
                >
                    <Plus :size='11' /> {{ putting ? '…' : 'Set' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, onMounted } from 'vue';
import { Archive, RefreshCw, AlertCircle, ChevronRight, Key, Plus, Trash2, ArrowLeft } from 'lucide-vue-next';
import { useNatsStore } from '../stores/nats.store';

interface KVBucket {
    name: string; keys: number; bytes: number;
    ttl: number; replicas: number;
}

const { nc } = useNatsStore();

const buckets   = ref<KVBucket[]>([]);
const loading   = ref(false);
const error     = ref<string | null>(null);

const browserBucket  = ref<string | null>(null);
const keys           = ref<string[]>([]);
const loadingKeys    = ref(false);
const selectedKey    = ref<string | null>(null);
const keyValue       = ref<string | null>(null);
const keyFilter      = ref('');
const putKey         = ref('');
const putValue       = ref('');
const putting        = ref(false);
const deleting       = ref(false);

const filteredKeys = computed(() => {
    const q = keyFilter.value.toLowerCase();
    return q ? keys.value.filter(k => k.toLowerCase().includes(q)) : keys.value;
});

async function refresh() {
    if (!nc.value) return;
    loading.value = true; error.value = null;
    try {
        const enc = new TextEncoder();
        const dec = new TextDecoder();
        const namesMsg = await nc.value.request(
            '$JS.API.STREAM.NAMES',
            enc.encode(JSON.stringify({ subject: '$KV.>' })),
            { timeout: 5000 }
        );
        const resp = JSON.parse(dec.decode(namesMsg.data));
        if (resp.error) { buckets.value = []; return; }
        const names: string[] = resp.streams ?? [];
        const infos = await Promise.allSettled(
            names.slice(0, 20).map(async name => {
                const m = await nc.value!.request(
                    `$JS.API.STREAM.INFO.${name}`,
                    enc.encode('{}'),
                    { timeout: 3000 }
                );
                const info = JSON.parse(dec.decode(m.data));
                return {
                    name,
                    keys:     info.state?.messages ?? 0,
                    bytes:    info.state?.bytes ?? 0,
                    ttl:      info.config?.max_age ?? 0,
                    replicas: info.config?.num_replicas ?? 1,
                } as KVBucket;
            })
        );
        buckets.value = infos
            .filter((r): r is PromiseFulfilledResult<KVBucket> => r.status === 'fulfilled')
            .map(r => r.value);
    } catch (e) {
        error.value = e instanceof Error ? e.message : String(e);
    } finally { loading.value = false; }
}

async function openBrowser(name: string) {
    browserBucket.value = name;
    selectedKey.value   = null;
    keyValue.value      = null;
    keyFilter.value     = '';
    await loadKeys();
}

async function loadKeys() {
    if (!browserBucket.value || !nc.value) return;
    loadingKeys.value = true;
    try {
        const js = nc.value.jetstream();
        const kv = await js.views.kv(browserBucket.value);
        const iter = await kv.keys();
        const result: string[] = [];
        for await (const k of iter) result.push(k);
        keys.value = result.sort();
    } catch { // ignore
        keys.value = [];
    }
    finally { loadingKeys.value = false; }
}

async function selectKey(key: string) {
    if (!browserBucket.value || !nc.value) return;
    selectedKey.value = key;
    keyValue.value    = null;
    try {
        const js  = nc.value.jetstream();
        const kv  = await js.views.kv(browserBucket.value);
        const entry = await kv.get(key);
        if (entry?.value) {
            const text = new TextDecoder().decode(entry.value);
            try { keyValue.value = JSON.stringify(JSON.parse(text), null, 2); }
            catch { // ignore
                keyValue.value = text;
            }
        } else {
            keyValue.value = '(empty)';
        }
    } catch (e) {
        keyValue.value = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
}

async function putKV() {
    if (!browserBucket.value || !nc.value || !putKey.value.trim()) return;
    putting.value = true;
    try {
        const js  = nc.value.jetstream();
        const kv  = await js.views.kv(browserBucket.value);
        await kv.put(putKey.value.trim(), new TextEncoder().encode(putValue.value));
        putKey.value   = '';
        putValue.value = '';
        await loadKeys();
    } catch { // ignore
    }
    finally { putting.value = false; }
}

async function deleteKey(key: string) {
    if (!browserBucket.value || !nc.value) return;
    deleting.value = true;
    try {
        const js = nc.value.jetstream();
        const kv = await js.views.kv(browserBucket.value);
        await kv.delete(key);
        selectedKey.value = null;
        keyValue.value    = null;
        await loadKeys();
    } catch { // ignore
    }
    finally { deleting.value = false; }
}

function formatBytes(n: number) {
    if (n < 1024) return `${n}B`;
    if (n < 1024*1024) return `${(n/1024).toFixed(1)}KB`;
    return `${(n/1024/1024).toFixed(1)}MB`;
}
function formatTTL(ns: number) {
    if (!ns) return 'none';
    const s = ns / 1e9;
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.round(s/60)}m`;
    if (s < 86400) return `${Math.round(s/3600)}h`;
    return `${Math.round(s/86400)}d`;
}

onMounted(refresh);
</script>

<style scoped>
.kv-root { display:flex; flex-direction:column; height:100%; overflow:hidden; background:var(--cloudtak-panel-bg,rgba(13,17,23,0.98)); color:#e6edf3; font-size:12px; }
.kv-toolbar { display:flex; align-items:center; gap:7px; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.kv-icon { color:#f59e0b; }
.kv-title { font-weight:700; font-size:13px; }
.conn-spacer { flex:1; }
.kv-count { font-size:11px; color:rgba(255,255,255,0.3); }
.kv-btn { display:flex; align-items:center; gap:4px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:5px; color:rgba(255,255,255,0.5); padding:3px 8px; font-size:11px; cursor:pointer; }
.kv-btn:hover:not(:disabled) { color:#e6edf3; }
.kv-btn:disabled { opacity:0.4; cursor:default; }
.kv-btn.danger { color:#f85149; }
.kv-error { margin:8px 12px; padding:6px 10px; background:rgba(248,81,73,0.1); border:1px solid rgba(248,81,73,0.25); border-radius:6px; color:#f85149; font-size:11px; display:flex; align-items:center; gap:6px; }
.kv-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:rgba(255,255,255,0.3); }
.kv-empty-inline { text-align:center; padding:24px; color:rgba(255,255,255,0.25); }
.kv-bucket-list { flex:1; overflow-y:auto; }
.bucket-row { display:flex; align-items:center; gap:10px; padding:8px 12px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); }
.bucket-row:hover { background:rgba(255,255,255,0.03); }
.bucket-name { font-weight:700; font-family:monospace; font-size:12px; }
.bucket-metric { font-size:11px; color:rgba(255,255,255,0.35); }
.kv-browser { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.browser-header { display:flex; align-items:center; gap:8px; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.browser-title { font-weight:700; font-size:13px; font-family:monospace; }
.browser-toolbar { padding:8px 12px 6px; border-bottom:1px solid rgba(255,255,255,0.05); }
.kv-input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:5px; color:#e6edf3; padding:4px 8px; font-size:11px; outline:none; }
.kv-input:focus { border-color:#4a9eff; }
.kv-input-sm { flex:1; }
.browser-body { flex:1; display:flex; overflow:hidden; }
.key-list { width:180px; border-right:1px solid rgba(255,255,255,0.07); overflow-y:auto; flex-shrink:0; }
.key-row { padding:5px 10px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.03); }
.key-row:hover { background:rgba(255,255,255,0.04); }
.key-row.active { background:rgba(74,158,255,0.08); }
.key-name { font-family:monospace; font-size:11px; color:rgba(255,255,255,0.6); }
.value-pane { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.val-toolbar { display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.07); }
.val-key-label { font-family:monospace; font-size:11px; color:#a78bfa; flex:1; }
.val-body { flex:1; overflow:auto; padding:10px 12px; font-family:monospace; font-size:11px; color:rgba(255,255,255,0.7); white-space:pre-wrap; word-break:break-all; }
.val-placeholder { flex:1; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.2); }
.put-form { display:flex; gap:6px; padding:8px 12px; border-top:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
@keyframes spin { to { transform:rotate(360deg); } }
.spin { animation:spin 1s linear infinite; }
</style>
