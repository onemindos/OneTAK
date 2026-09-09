<template>
    <div class="rp">
        <div class="rp-header">
            <Clock
                :size="14"
                class="rp-accent"
            />
            <span class="rp-title">Replay</span>
            <span class="rp-sub">Replay messages from JetStream history</span>
        </div>

        <div class="rp-controls">
            <div class="rp-row">
                <div class="rp-field">
                    <label class="rp-lbl">Subject filter</label>
                    <input
                        v-model="subject"
                        class="rp-input"
                        type="text"
                        placeholder="e.g. tel.drone.> or evt.mission.*"
                    >
                </div>
                <button
                    class="rp-btn"
                    :disabled="!nc || isReplaying"
                    @click="handleReplay"
                >
                    <Square
                        v-if="isReplaying"
                        :size="13"
                    />
                    <Play
                        v-else
                        :size="13"
                    />
                    {{ isReplaying ? 'Replaying…' : 'Replay' }}
                </button>
            </div>

            <div class="rp-presets">
                <button
                    v-for="p in PRESETS"
                    :key="p.seconds"
                    class="rp-preset"
                    :class="{ active: selectedPreset === p.seconds }"
                    @click="selectedPreset = p.seconds"
                >
                    {{ p.label }}
                </button>
            </div>
        </div>

        <div class="rp-results">
            <div
                v-if="messages.length === 0"
                class="rp-empty"
            >
                <SkipForward
                    :size="22"
                    class="rp-empty-icon"
                />
                <span>{{ nc ? 'Select a time range and subject to replay messages from JetStream.' : 'Connect to NATS first.' }}</span>
            </div>
            <template v-else>
                <div class="rp-results-hd">
                    <span class="rp-badge">{{ messages.length }} messages</span>
                    <span class="rp-muted">from {{ PRESETS.find(p => p.seconds === selectedPreset)?.label ?? '?' }}</span>
                </div>
                <div
                    v-for="msg in messages"
                    :key="msg.id"
                    class="rp-msg"
                >
                    <span class="rp-mono rp-time">{{ fmtTime(msg.timestamp) }}</span>
                    <span class="rp-mono rp-subj">{{ msg.subject }}</span>
                    <span class="rp-mono rp-data">{{ msg.data.length > 120 ? msg.data.slice(0, 120) + '…' : msg.data }}</span>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { Clock, Play, Square, SkipForward } from 'lucide-vue-next';
import { useNatsStore } from '../stores/nats.store';

interface ReplayMsg { id: string; subject: string; data: string; size: number; timestamp: Date; }

const PRESETS = [
    { label: 'Last 5 min',   seconds: 300   },
    { label: 'Last 30 min',  seconds: 1800  },
    { label: 'Last 1 hour',  seconds: 3600  },
    { label: 'Last 24 hours', seconds: 86400 },
];

const { nc } = useNatsStore();
const subject        = ref('>');
const selectedPreset = ref(300);
const isReplaying    = ref(false);
const messages       = ref<ReplayMsg[]>([]);

async function handleReplay() {
    const conn = nc.value;
    if (!conn || isReplaying.value) return;

    isReplaying.value = true;
    messages.value    = [];

    try {
        const js          = conn.jetstream();
        const startTime   = new Date(Date.now() - selectedPreset.value * 1000);
        const consumer    = await js.consumers.get('EVENTS', {
            opt_start_time:  startTime.toISOString(),
            deliver_policy:  'by_start_time',
            filter_subject:  subject.value === '>' ? undefined : subject.value,
        } as never);

        const iter    = await consumer.fetch({ max_messages: 500, expires: 10_000 });
        const decoder = new TextDecoder();
        const batch: ReplayMsg[] = [];

        for await (const msg of iter) {
            batch.push({
                id:        `replay-${batch.length}`,
                subject:   msg.subject,
                data:      decoder.decode(msg.data),
                size:      msg.data.length,
                timestamp: new Date(msg.info.timestampNanos / 1_000_000),
            });
            msg.ack();
        }
        messages.value = batch;
    } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        messages.value = [{
            id: 'error', subject: 'system.error', size: 0, timestamp: new Date(),
            data: `Replay failed: ${errMsg}. Stream may not exist or subject filter is invalid.`,
        }];
    } finally {
        isReplaying.value = false;
    }
}

function fmtTime(d: Date): string { return d.toLocaleTimeString(); }
</script>

<style scoped>
.rp { display:flex; flex-direction:column; gap:12px; padding:14px; height:100%; overflow:hidden; }
.rp-header { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.rp-accent { color:#4a9eff; }
.rp-title { font-size:13px; font-weight:700; color:#e6edf3; }
.rp-sub { font-size:11px; color:rgba(255,255,255,0.35); }
.rp-controls { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:10px; flex-shrink:0; }
.rp-row { display:flex; gap:10px; align-items:flex-end; }
.rp-field { flex:1; display:flex; flex-direction:column; gap:4px; }
.rp-lbl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:rgba(255,255,255,0.4); }
.rp-input { height:32px; padding:0 10px; border-radius:6px; font-size:12px; font-family:monospace; outline:none; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.12); color:#e6edf3; width:100%; }
.rp-input:focus { border-color:rgba(74,158,255,0.5); }
.rp-btn { display:flex; align-items:center; gap:6px; padding:0 14px; height:32px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; background:#4a9eff; color:#000; border:none; white-space:nowrap; transition:opacity .15s; }
.rp-btn:disabled { opacity:0.4; cursor:not-allowed; }
.rp-btn:not(:disabled):hover { opacity:0.85; }
.rp-presets { display:flex; gap:6px; flex-wrap:wrap; }
.rp-preset { padding:4px 10px; border-radius:5px; font-size:11px; font-weight:500; cursor:pointer; background:transparent; color:rgba(255,255,255,0.4); border:1px solid rgba(255,255,255,0.1); transition:all .12s; }
.rp-preset:hover { border-color:rgba(255,255,255,0.25); color:rgba(255,255,255,0.7); }
.rp-preset.active { background:#4a9eff; color:#000; border-color:#4a9eff; }
.rp-results { flex:1; overflow:auto; border:1px solid rgba(255,255,255,0.07); border-radius:8px; }
.rp-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; color:rgba(255,255,255,0.3); font-size:12px; }
.rp-empty-icon { opacity:0.2; }
.rp-results-hd { display:flex; align-items:center; gap:10px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); position:sticky; top:0; }
.rp-badge { font-size:11px; font-weight:600; background:rgba(74,158,255,0.15); color:#4a9eff; border:1px solid rgba(74,158,255,0.25); padding:2px 8px; border-radius:4px; }
.rp-muted { font-size:11px; color:rgba(255,255,255,0.35); }
.rp-msg { display:flex; align-items:flex-start; gap:10px; padding:7px 12px; border-bottom:1px solid rgba(255,255,255,0.04); }
.rp-msg:last-child { border-bottom:none; }
.rp-mono { font-size:11px; font-family:monospace; padding-top:1px; }
.rp-time { color:rgba(255,255,255,0.35); width:72px; flex-shrink:0; }
.rp-subj { color:#4a9eff; width:180px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rp-data { flex:1; color:rgba(255,255,255,0.5); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
</style>
