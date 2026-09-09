<template>
    <div
        ref="rootEl"
        class="vc"
        tabindex="0"
        @keydown="onKeyDown"
        @keyup="onKeyUp"
    >
        <!-- Header -->
        <div class="vc-hd">
            <Mic
                :size="13"
                :class='isListening ? "vc-listening-icon" : "vc-acc"'
            />
            <div>
                <div class="vc-title">
                    VOICE INTERFACE
                </div>
                <div
                    class="vc-mono vc-dim"
                    style="font-size:9px"
                >
                    PUSH-TO-TALK • SPACE BAR OR HOLD BUTTON
                </div>
            </div>
            <div
                class="vc-status-pill"
                :class="statusClass"
            >
                {{ statusLabel }}
            </div>
        </div>

        <!-- Not supported -->
        <div
            v-if="!isSupported"
            class="vc-unsupported"
        >
            <MicOff
                :size="28"
                style="opacity:0.3"
            />
            <span class="vc-mono">SPEECH RECOGNITION NOT SUPPORTED IN THIS BROWSER</span>
            <span
                class="vc-dim vc-mono"
                style="font-size:10px"
            >Try Chrome or Edge</span>
        </div>

        <template v-else>
            <!-- Agent selector -->
            <div class="vc-agent-row">
                <div class="vc-agent-label vc-mono vc-dim">
                    TARGET AGENT
                </div>
                <select
                    v-model="selectedAgentId"
                    class="vc-agent-select"
                >
                    <option value="">
                        -- Select agent --
                    </option>
                    <option
                        v-for="agent in agents"
                        :key="agent.id"
                        :value="agent.id"
                    >
                        {{ agent.name }} ({{ agent.type }})
                    </option>
                </select>
                <div
                    v-if="selectedAgent"
                    class="vc-agent-status"
                    :class="selectedAgent.status"
                >
                    <div
                        class="vc-dot"
                        :class="selectedAgent.status"
                    />
                    <span
                        class="vc-mono"
                        style="font-size:10px"
                    >{{ selectedAgent.status.toUpperCase() }}</span>
                </div>
            </div>

            <!-- PTT button -->
            <div class="vc-ptt-area">
                <div
                    class="vc-ptt-wrap"
                    :class="{ listening: isListening }"
                >
                    <div
                        v-if="isListening"
                        class="vc-pulse-ring"
                    />
                    <div
                        v-if="isListening"
                        class="vc-pulse-ring delay1"
                    />
                    <button
                        class="vc-ptt-btn"
                        :class="{ listening: isListening, processing: isProcessing }"
                        :disabled="isProcessing"
                        @mousedown="startListening"
                        @mouseup="stopListening"
                        @mouseleave="isListening ? stopListening() : null"
                        @touchstart.prevent="startListening"
                        @touchend.prevent="stopListening"
                    >
                        <Loader2
                            v-if="isProcessing"
                            :size="28"
                            class="vc-spin"
                        />
                        <MicOff
                            v-else-if="!isListening"
                            :size="28"
                        />
                        <Mic
                            v-else
                            :size="28"
                        />
                    </button>
                </div>
                <div class="vc-ptt-hint vc-mono vc-dim">
                    {{ isListening ? 'RELEASE TO SEND' : isProcessing ? 'PROCESSING…' : 'HOLD SPACE OR BUTTON TO SPEAK' }}
                </div>
            </div>

            <!-- Live transcript -->
            <div
                v-if="interimTranscript || isListening"
                class="vc-interim"
                :class="{ active: isListening }"
            >
                <div
                    v-if="isListening && !interimTranscript"
                    class="vc-interim-dots"
                >
                    <span /><span /><span />
                </div>
                <span v-if="interimTranscript">{{ interimTranscript }}</span>
            </div>

            <!-- Error -->
            <div
                v-if="speechError"
                class="vc-error"
            >
                <AlertTriangle :size="11" /> {{ speechError }}
            </div>

            <!-- Transcript feed -->
            <div
                ref="feedEl"
                class="vc-feed"
            >
                <div
                    v-if="entries.length === 0"
                    class="vc-empty"
                >
                    <Mic
                        :size="20"
                        style="opacity:0.15"
                    />
                    <span
                        class="vc-mono vc-dim"
                        style="font-size:10px"
                    >NO VOICE EXCHANGES YET</span>
                    <span
                        class="vc-mono vc-dim"
                        style="font-size:9px"
                    >HOLD SPACE TO BEGIN</span>
                </div>
                <div
                    v-for="entry in entries"
                    :key="entry.id"
                    class="vc-entry"
                    :class="entry.role"
                >
                    <div class="vc-entry-meta">
                        <component
                            :is='entry.role === "user" ? Mic : Bot'
                            :size="10"
                        />
                        <span
                            class="vc-mono"
                            style="font-size:9px"
                        >{{ entry.role === 'user' ? 'OPERATOR' : 'AGENT' }}</span>
                        <span
                            class="vc-mono vc-dim"
                            style="font-size:9px;margin-left:auto"
                        >{{ fmtTime(entry.timestamp) }}</span>
                    </div>
                    <div class="vc-entry-text">
                        {{ entry.content }}
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { Mic, MicOff, Bot, Loader2, AlertTriangle } from 'lucide-vue-next';
import { useAgents } from '../composables/useAgents';
import { useBridge } from '../composables/useBridge';

interface VoiceEntry { id: string; role: 'user' | 'agent'; content: string; timestamp: number; }

const { agents: agentsMap } = useAgents();
const bridge = useBridge();
const agents = computed(() => Array.from(agentsMap.value.values()));

const rootEl          = ref<HTMLElement | null>(null);
const feedEl          = ref<HTMLElement | null>(null);
const selectedAgentId = ref('');
const isListening     = ref(false);
const isProcessing    = ref(false);
const interimTranscript = ref('');
const speechError     = ref('');
const entries         = ref<VoiceEntry[]>([]);
let entryCounter      = 0;

const selectedAgent = computed(() => agents.value.find(a => a.id === selectedAgentId.value));
const isSupported   = ref(false);

// Check support
onMounted(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isSupported.value = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    bridge.start();
    // Focus to capture space bar
    rootEl.value?.focus();
});
onUnmounted(() => bridge.stop());

// Auto-select first online agent
watch(agents, (list) => {
    if (!selectedAgentId.value && list.length > 0) {
        const online = list.find(a => a.status === 'online');
        selectedAgentId.value = (online ?? list[0]).id;
    }
}, { immediate: true });

// Web Speech API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognition: any = null;
let finalTranscript = '';

function initRecognition() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return null;
    const r = new SpeechRec();
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = (e: SpeechRecognitionEvent) => {
        let interim = '';
        finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalTranscript += t;
            else interim += t;
        }
        interimTranscript.value = interim;
    };
    r.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error !== 'aborted') speechError.value = e.error;
        isListening.value = false;
    };
    r.onend = () => {
        isListening.value = false;
        interimTranscript.value = '';
        if (finalTranscript.trim()) void sendVoice(finalTranscript.trim());
        finalTranscript = '';
    };
    return r;
}

function startListening() {
    if (!isSupported.value || isListening.value || isProcessing.value) return;
    speechError.value = '';
    finalTranscript = '';
    interimTranscript.value = '';
    recognition = initRecognition();
    if (!recognition) return;
    try { recognition.start(); isListening.value = true; } catch { /* already started */ }
}
function stopListening() {
    if (!isListening.value) return;
    recognition?.stop();
    // onend fires → sends
}

async function sendVoice(text: string) {
    if (!text) return;
    entries.value = [...entries.value, { id: `u-${++entryCounter}`, role: 'user', content: text, timestamp: Date.now() }];
    await nextTick(); scrollFeed();

    if (!selectedAgentId.value) {
        entries.value = [...entries.value, { id: `e-${++entryCounter}`, role: 'agent', content: 'No agent selected.', timestamp: Date.now() }];
        return;
    }
    isProcessing.value = true;
    let response = '';
    try {
        await bridge.prompt(selectedAgentId.value, text, (event) => {
            if (event.kind === 'response' && event.text) response += event.text;
        });
        entries.value = [...entries.value, { id: `a-${++entryCounter}`, role: 'agent', content: response || '(no response)', timestamp: Date.now() }];
    } catch (e) {
        entries.value = [...entries.value, { id: `err-${++entryCounter}`, role: 'agent', content: `Error: ${e instanceof Error ? e.message : String(e)}`, timestamp: Date.now() }];
    } finally {
        isProcessing.value = false;
        await nextTick(); scrollFeed();
    }
}

function scrollFeed() { if (feedEl.value) feedEl.value.scrollTop = feedEl.value.scrollHeight; }
function fmtTime(ts: number): string { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

// Space bar PTT — only when focused on this component
function onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' && !e.repeat && !isListening.value && !isProcessing.value) {
        e.preventDefault();
        startListening();
    }
}
function onKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space' && isListening.value) {
        e.preventDefault();
        stopListening();
    }
}

const statusClass = computed(() => {
    if (isListening.value) return 'listening';
    if (isProcessing.value) return 'processing';
    return 'ready';
});
const statusLabel = computed(() => {
    if (isListening.value) return 'LISTENING';
    if (isProcessing.value) return 'PROCESSING';
    return 'READY';
});
</script>

<style scoped>
.vc { display:flex; flex-direction:column; height:100%; overflow:hidden; outline:none; }
.vc-hd { display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); }
.vc-title { font-size:11px; font-weight:700; font-family:monospace; letter-spacing:0.06em; color:#e6edf3; }
.vc-acc { color:#4a9eff; }
.vc-listening-icon { color:#f85149; animation:pulse-icon 1s ease infinite; }
.vc-dim { color:rgba(255,255,255,0.3); }
.vc-mono { font-family:monospace; }
.vc-status-pill { margin-left:auto; font-size:10px; font-family:monospace; font-weight:700; padding:3px 10px; border-radius:10px; letter-spacing:0.07em; }
.vc-status-pill.ready      { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.4); }
.vc-status-pill.listening  { background:rgba(248,81,73,0.15); color:#f85149; border:1px solid rgba(248,81,73,0.3); animation:pulse-icon 1s ease infinite; }
.vc-status-pill.processing { background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3); }
.vc-unsupported { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; gap:10px; color:rgba(255,255,255,0.4); font-size:11px; font-family:monospace; }
.vc-agent-row { display:flex; align-items:center; gap:10px; padding:8px 14px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.vc-agent-label { font-size:10px; letter-spacing:0.07em; text-transform:uppercase; white-space:nowrap; }
.vc-agent-select { flex:1; padding:5px 8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:5px; color:#e6edf3; font-size:11px; font-family:monospace; outline:none; }
.vc-agent-status { display:flex; align-items:center; gap:5px; }
.vc-dot { width:7px; height:7px; border-radius:50%; background:#555; }
.vc-dot.online  { background:#22c55e; box-shadow:0 0 5px #22c55e; }
.vc-dot.idle    { background:#f59e0b; }
.vc-dot.busy    { background:#4a9eff; }
.vc-dot.offline { background:#555; }
.vc-ptt-area { display:flex; flex-direction:column; align-items:center; gap:10px; padding:20px; flex-shrink:0; }
.vc-ptt-wrap { position:relative; width:96px; height:96px; display:flex; align-items:center; justify-content:center; }
.vc-pulse-ring { position:absolute; width:96px; height:96px; border-radius:50%; border:2px solid rgba(248,81,73,0.4); animation:pulse-ring 1.5s ease-out infinite; }
.vc-pulse-ring.delay1 { animation-delay:0.5s; }
.vc-ptt-btn { width:80px; height:80px; border-radius:50%; border:2px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.5); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .12s; position:relative; z-index:1; user-select:none; }
.vc-ptt-btn:hover:not(:disabled) { background:rgba(255,255,255,0.12); color:#e6edf3; }
.vc-ptt-btn.listening { background:rgba(248,81,73,0.15); border-color:rgba(248,81,73,0.5); color:#f85149; }
.vc-ptt-btn.processing { border-color:rgba(245,158,11,0.5); color:#f59e0b; }
.vc-ptt-btn:disabled { opacity:0.6; cursor:not-allowed; }
.vc-ptt-hint { font-size:10px; font-family:monospace; color:rgba(255,255,255,0.3); text-align:center; letter-spacing:0.05em; }
.vc-interim { min-height:32px; padding:8px 14px; margin:0 14px; border-radius:7px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); font-size:12px; font-style:italic; color:rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:border-color .2s; }
.vc-interim.active { border-color:rgba(248,81,73,0.3); }
.vc-interim-dots { display:flex; gap:4px; align-items:center; }
.vc-interim-dots span { width:5px; height:5px; border-radius:50%; background:rgba(248,81,73,0.5); animation:dot-bounce 1.2s ease infinite; }
.vc-interim-dots span:nth-child(2) { animation-delay:.2s; }
.vc-interim-dots span:nth-child(3) { animation-delay:.4s; }
.vc-error { margin:6px 14px; padding:6px 10px; border-radius:5px; background:rgba(248,81,73,0.08); border:1px solid rgba(248,81,73,0.2); color:#f85149; font-size:10px; font-family:monospace; display:flex; align-items:center; gap:6px; flex-shrink:0; }
.vc-feed { flex:1; overflow-y:auto; padding:10px 14px; display:flex; flex-direction:column; gap:8px; }
.vc-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:8px; }
.vc-entry { padding:8px 11px; border-radius:8px; display:flex; flex-direction:column; gap:4px; max-width:90%; }
.vc-entry.user  { background:rgba(74,158,255,0.07); border:1px solid rgba(74,158,255,0.15); align-self:flex-end; }
.vc-entry.agent { background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.12); align-self:flex-start; }
.vc-entry-meta { display:flex; align-items:center; gap:5px; color:rgba(255,255,255,0.3); }
.vc-entry-text { font-size:12px; color:#e6edf3; line-height:1.45; }
@keyframes pulse-ring { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(1.6); opacity:0; } }
@keyframes pulse-icon { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
@keyframes dot-bounce { 0%,80%,100% { transform:scale(0.8); opacity:.5; } 40% { transform:scale(1.2); opacity:1; } }
@keyframes spin { to { transform:rotate(360deg); } }
.vc-spin { animation:spin 1s linear infinite; }
</style>
