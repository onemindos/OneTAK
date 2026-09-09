<template>
    <div class='pub-root'>
        <div class='pub-toolbar'>
            <Send
                :size='14'
                class='pub-icon'
            />
            <span class='pub-title'>Publish / Request</span>
            <div class='conn-spacer' />
            <!-- mode toggle -->
            <div class='mode-toggle'>
                <button
                    :class='{ active: mode === "publish" }'
                    @click='mode = "publish"'
                >
                    Publish
                </button>
                <button
                    :class='{ active: mode === "request" }'
                    @click='mode = "request"'
                >
                    Request
                </button>
            </div>
        </div>

        <div
            v-if='!nc'
            class='pub-empty'
        >
            <Send
                :size='28'
                style='opacity:0.3'
            /><p>Not connected.</p>
        </div>

        <div
            v-else
            class='pub-body'
        >
            <!-- subject input -->
            <div class='pub-field'>
                <label class='pub-label'>Subject</label>
                <div class='subject-row'>
                    <input
                        v-model='subject'
                        class='pub-input mono'
                        placeholder='svc.orp.query'
                    >
                    <button
                        class='pub-btn icon-btn'
                        title='Suggestions'
                        @click='showSuggestions = !showSuggestions'
                    >
                        <Zap :size='12' />
                    </button>
                </div>
                <div
                    v-if='showSuggestions'
                    class='suggestions'
                >
                    <button
                        v-for='s in suggestions'
                        :key='s'
                        class='suggestion'
                        @click='subject = s; showSuggestions = false'
                    >
                        {{ s }}
                    </button>
                </div>
            </div>

            <!-- payload -->
            <div class='pub-field'>
                <label class='pub-label'>
                    Payload
                    <span class='pub-size'>{{ payloadBytes }} bytes</span>
                </label>
                <textarea
                    v-model='payload'
                    class='pub-textarea mono'
                    rows='6'
                    placeholder='{"key": "value"}'
                />
            </div>

            <!-- headers -->
            <div class='pub-field'>
                <label class='pub-label'>Headers</label>
                <div class='headers-list'>
                    <div
                        v-for='h in headerPairs'
                        :key='h.id'
                        class='header-pair'
                    >
                        <input
                            v-model='h.key'
                            class='pub-input mono hdr-key'
                            placeholder='Key'
                        >
                        <input
                            v-model='h.value'
                            class='pub-input mono hdr-val'
                            placeholder='Value'
                        >
                        <button
                            class='pub-btn icon-btn'
                            @click='removeHeader(h.id)'
                        >
                            <Trash2 :size='11' />
                        </button>
                    </div>
                    <button
                        class='pub-btn hdr-add'
                        @click='addHeader'
                    >
                        <Plus :size='11' /> Add header
                    </button>
                </div>
            </div>

            <!-- send -->
            <button
                class='pub-btn send-btn'
                :disabled='!subject.trim() || sending'
                @click='send'
            >
                <Send :size='12' />
                {{ sending ? 'Sending…' : mode === 'request' ? 'Send Request' : 'Publish' }}
            </button>

            <!-- result -->
            <div
                v-if='result'
                class='pub-result'
                :class='{ err: !result.ok }'
            >
                <template v-if='result.ok'>
                    <div class='result-ok-line'>
                        <Check :size='12' />
                        {{ result.data }}
                    </div>
                    <div
                        v-if='result.inbox'
                        class='result-inbox mono'
                    >
                        Inbox: {{ result.inbox }}
                    </div>
                    <div
                        v-if='result.reply'
                        class='result-reply'
                    >
                        <div
                            class='pub-label'
                            style='margin-top:8px'
                        >
                            Reply
                        </div>
                        <pre class='reply-body mono'>{{ result.reply }}</pre>
                    </div>
                </template>
                <template v-else>
                    <div class='result-err-line'>
                        <AlertCircle :size='12' /> {{ result.error }}
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed } from 'vue';
import { Send, Plus, Trash2, AlertCircle, Check, Zap } from 'lucide-vue-next';
import { headers as natsHeaders, createInbox } from 'nats.ws';
import { useNatsStore } from '../stores/nats.store';

type Mode = 'publish' | 'request';
interface HeaderPair { id: string; key: string; value: string }

const { nc, sc } = useNatsStore();

const mode      = ref<Mode>('publish');
const subject   = ref('');
const payload   = ref('{\n  \n}');
const headerPairs = ref<HeaderPair[]>([]);
const sending   = ref(false);
const result    = ref<{ ok: boolean; data?: string; error?: string; inbox?: string; reply?: string } | null>(null);
const showSuggestions = ref(false);

const suggestions = [
    'svc.orp.query',
    'svc.legacy.prompt',
    'cmd.drone.x47.intercept',
    'tak.cot.inject',
    'evt.mission.started',
];

const payloadBytes = computed(() => new TextEncoder().encode(payload.value).byteLength);

function addHeader() { headerPairs.value.push({ id: String(Date.now()), key: '', value: '' }); }
function removeHeader(id: string) { headerPairs.value = headerPairs.value.filter(h => h.id !== id); }

async function send() {
    if (!nc.value || !subject.value.trim()) return;
    sending.value = true; result.value = null;
    try {
        const enc = new TextEncoder();
        const data = enc.encode(payload.value);

        const validPairs = headerPairs.value.filter(h => h.key.trim());
        let msgHeaders: ReturnType<typeof natsHeaders> | undefined;
        if (validPairs.length) {
            msgHeaders = natsHeaders();
            for (const h of validPairs) msgHeaders.set(h.key.trim(), h.value);
        }

        if (mode.value === 'publish') {
            nc.value.publish(subject.value.trim(), data, { headers: msgHeaders });
            result.value = { ok: true, data: `Published ${payloadBytes.value} bytes to ${subject.value}` };
        } else {
            const inbox = createInbox();
            const sub   = nc.value.subscribe(inbox, { max: 1, timeout: 5000 });
            nc.value.publish(subject.value.trim(), data, { reply: inbox, headers: msgHeaders });
            let raw = '';
            for await (const m of sub) {
                raw = sc.decode(m.data);
                break;
            }
            sub.unsubscribe();
            let reply: string;
            try { reply = JSON.stringify(JSON.parse(raw), null, 2); }
            catch { // ignore parse error
                reply = raw;
            }
            result.value = {
                ok: true,
                data: `${raw.length} byte reply`,
                inbox,
                reply,
            };
        }
    } catch (e) {
        result.value = { ok: false, error: e instanceof Error ? e.message : String(e) };
    } finally { sending.value = false; }
}
</script>

<style scoped>
.pub-root { display:flex; flex-direction:column; height:100%; overflow:hidden; background:var(--cloudtak-panel-bg,rgba(13,17,23,0.98)); color:#e6edf3; font-size:12px; }
.pub-toolbar { display:flex; align-items:center; gap:7px; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.pub-icon { color:#f85149; }
.pub-title { font-weight:700; font-size:13px; }
.conn-spacer { flex:1; }
.mode-toggle { display:flex; border:1px solid rgba(255,255,255,0.12); border-radius:6px; overflow:hidden; }
.mode-toggle button { background:transparent; border:none; color:rgba(255,255,255,0.4); padding:4px 12px; font-size:11px; cursor:pointer; }
.mode-toggle button.active { background:rgba(248,81,73,0.15); color:#f85149; }
.pub-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:rgba(255,255,255,0.3); }
.pub-body { flex:1; overflow-y:auto; padding:14px 14px; display:flex; flex-direction:column; gap:14px; }
.pub-field { display:flex; flex-direction:column; gap:5px; position:relative; }
.pub-label { font-size:10px; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.06em; display:flex; justify-content:space-between; }
.pub-size { font-size:10px; color:rgba(255,255,255,0.2); }
.subject-row { display:flex; gap:5px; }
.pub-input { flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:5px; color:#e6edf3; padding:5px 8px; font-size:11px; outline:none; }
.pub-input:focus { border-color:#f85149; }
.mono { font-family:monospace; }
.icon-btn { background:none; border:1px solid rgba(255,255,255,0.1); border-radius:5px; color:rgba(255,255,255,0.4); padding:4px 7px; cursor:pointer; display:flex; align-items:center; }
.icon-btn:hover { color:#e6edf3; }
.suggestions { position:absolute; top:100%; left:0; right:0; background:#161b22; border:1px solid rgba(255,255,255,0.1); border-radius:6px; z-index:10; display:flex; flex-direction:column; gap:2px; padding:4px; }
.suggestion { background:none; border:none; color:rgba(255,255,255,0.5); padding:5px 8px; font-size:11px; font-family:monospace; cursor:pointer; border-radius:4px; text-align:left; }
.suggestion:hover { background:rgba(255,255,255,0.06); color:#e6edf3; }
.pub-textarea { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#e6edf3; padding:8px; font-size:11px; resize:vertical; outline:none; min-height:80px; }
.pub-textarea:focus { border-color:#f85149; }
.headers-list { display:flex; flex-direction:column; gap:5px; }
.header-pair { display:flex; gap:5px; }
.hdr-key { flex:1; }
.hdr-val { flex:2; }
.hdr-add { background:none; border:1px dashed rgba(255,255,255,0.15); border-radius:5px; color:rgba(255,255,255,0.3); padding:4px 8px; font-size:11px; cursor:pointer; display:flex; align-items:center; gap:5px; }
.hdr-add:hover { color:#e6edf3; border-color:rgba(255,255,255,0.3); }
.pub-btn { display:flex; align-items:center; gap:6px; background:rgba(248,81,73,0.12); border:1px solid rgba(248,81,73,0.3); border-radius:6px; color:#f85149; padding:7px 14px; font-size:12px; font-weight:600; cursor:pointer; }
.pub-btn:disabled { opacity:0.4; cursor:default; }
.pub-btn:not(.send-btn) { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); }
.send-btn { justify-content:center; }
.pub-result { background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.25); border-radius:6px; padding:10px 12px; font-size:11px; }
.pub-result.err { background:rgba(248,81,73,0.08); border-color:rgba(248,81,73,0.25); }
.result-ok-line { display:flex; align-items:center; gap:6px; color:#22c55e; }
.result-err-line { display:flex; align-items:center; gap:6px; color:#f85149; }
.result-inbox { margin-top:4px; color:rgba(255,255,255,0.3); }
.result-reply { margin-top:4px; }
.reply-body { background:rgba(255,255,255,0.04); border-radius:4px; padding:8px; font-size:11px; color:rgba(255,255,255,0.7); overflow-x:auto; white-space:pre-wrap; }
</style>
