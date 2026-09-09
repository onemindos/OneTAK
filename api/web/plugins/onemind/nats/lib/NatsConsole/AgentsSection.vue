<template>
    <div class="ag">
        <!-- ── Top bar ──────────────────────────────────────────────────────── -->
        <div class="ag-bar">
            <div class="ag-status-row">
                <div
                    class="ag-dot"
                    :class="bridgeStatus"
                />
                <span class="ag-bar-label">{{ bridgeStatusLabel }}</span>
                <span
                    v-if="natsServer"
                    class="ag-muted ag-mono"
                >· {{ natsServer }}</span>
            </div>
            <span class="ag-muted ag-mono">{{ agentList.length }} agent{{ agentList.length !== 1 ? 's' : '' }}</span>
            <div class="ag-tabs">
                <button
                    v-for="t in INNER_TABS"
                    :key="t.id"
                    class="ag-tab"
                    :class="{ active: innerTab === t.id }"
                    @click="innerTab = t.id"
                >
                    <component
                        :is="t.icon"
                        :size="10"
                    />{{ t.label }}
                </button>
            </div>
            <button
                class="ag-btn"
                title="Re-discover agents"
                @click="bridge.discover()"
            >
                <RefreshCw :size="11" />Refresh
            </button>
        </div>

        <!-- ── CHAT TAB ──────────────────────────────────────────────────────── -->
        <div
            v-if='innerTab === "chat"'
            class="ag-body"
        >
            <!-- Roster -->
            <div class="ag-roster">
                <div class="ag-roster-hd">
                    <label class="ag-chk-label">
                        <input
                            type="checkbox"
                            :checked="allSelected"
                            @change="toggleSelectAll"
                        >
                        <span
                            class="ag-muted ag-mono"
                            style="font-size:9px"
                        >ALL</span>
                    </label>
                </div>
                <div
                    v-if="agentList.length === 0"
                    class="ag-empty"
                >
                    <span class="ag-empty-icon">{{ bridgeStatus === 'connected' ? '📡' : '🔌' }}</span>
                    <span>{{ bridgeStatus === 'connected' ? 'No agents discovered' : bridgeStatusLabel }}</span>
                    <span
                        v-if='bridgeStatus === "connected"'
                        class="ag-muted"
                    >Agents publish on agents.hb.*.*.*</span>
                </div>
                <button
                    v-for="a in agentList"
                    :key="a.instanceId"
                    class="ag-card"
                    :class="{ selected: selectedId === a.instanceId }"
                    @click="selectAgent(a.instanceId)"
                >
                    <div class="ag-card-top">
                        <input
                            type="checkbox"
                            :checked="selectedIds.has(a.instanceId)"
                            @click.stop
                            @change="toggleSelect(a.instanceId)"
                        >
                        <div
                            class="ag-type-badge"
                            :style="{ background: agentColor(a.agent).bg, color: agentColor(a.agent).fg }"
                        >
                            {{ agentInitials(a.agent) }}
                        </div>
                        <div class="ag-card-info">
                            <div class="ag-card-name">
                                {{ a.name || a.agent }}
                            </div>
                            <div class="ag-muted ag-card-sub">
                                {{ a.agent }}<span v-if="a.owner"> · {{ a.owner }}</span>
                            </div>
                        </div>
                        <div
                            class="ag-hb-dot"
                            :class="heartbeatClass(a.instanceId)"
                        />
                    </div>
                    <div
                        v-if="a.description"
                        class="ag-card-desc"
                    >
                        {{ a.description }}
                    </div>
                </button>
            </div>

            <!-- Chat panel -->
            <div class="ag-chat">
                <template v-if="selectedAgent">
                    <div class="ag-chat-hd">
                        <div
                            class="ag-type-badge sm"
                            :style="{ background: agentColor(selectedAgent.agent).bg, color: agentColor(selectedAgent.agent).fg }"
                        >
                            {{ agentInitials(selectedAgent.agent) }}
                        </div>
                        <div>
                            <div class="ag-chat-name">
                                {{ selectedAgent.name || selectedAgent.agent }}
                            </div>
                            <div class="ag-muted">
                                {{ selectedAgent.description || selectedAgent.agent }}
                            </div>
                        </div>
                    </div>
                    <div
                        ref="messagesEl"
                        class="ag-messages"
                    >
                        <div
                            v-if="messages.length === 0"
                            class="ag-chat-empty"
                        >
                            <span class="ag-muted">Send a message to start a conversation</span>
                        </div>
                        <div
                            v-for="(msg, i) in messages"
                            :key="i"
                            class="ag-msg"
                            :class="msg.role"
                        >
                            <div
                                v-if='msg.role === "user"'
                                class="ag-msg-bubble user"
                            >
                                {{ msg.text }}
                            </div>
                            <template v-else-if='msg.role === "assistant"'>
                                <div class="ag-msg-bubble assistant">
                                    <span
                                        v-if="msg.text"
                                        class="ag-msg-text"
                                    >{{ msg.text }}</span>
                                    <span
                                        v-if="!msg.done && !msg.text"
                                        class="ag-typing"
                                    ><span /><span /><span /></span>
                                    <span
                                        v-if="!msg.done && msg.text"
                                        class="ag-cursor"
                                    />
                                </div>
                                <div
                                    v-if="msg.toolName"
                                    class="ag-tool"
                                >
                                    <Wrench :size="10" />{{ msg.toolName }}
                                </div>
                                <div
                                    v-if="msg.cost"
                                    class="ag-cost ag-muted"
                                >
                                    ${{ msg.cost.toFixed(4) }}
                                </div>
                            </template>
                            <div
                                v-else-if='msg.role === "error"'
                                class="ag-msg-bubble error"
                            >
                                {{ msg.text }}
                            </div>
                            <div
                                v-else-if='msg.role === "status"'
                                class="ag-status-msg ag-muted"
                            >
                                {{ msg.text }}
                            </div>
                        </div>
                    </div>
                    <!-- Broadcast bar (when multiple selected) -->
                    <div
                        v-if="selectedIds.size >= 2"
                        class="ag-broadcast-bar"
                    >
                        <span
                            class="ag-mono"
                            style="font-size:10px;color:#f59e0b;flex-shrink:0"
                        >{{ selectedIds.size }} agents</span>
                        <input
                            v-model="broadcastText"
                            class="ag-broadcast-input"
                            placeholder="Broadcast to all selected…"
                            @keydown.enter.exact.prevent="sendBroadcast"
                        >
                        <button
                            class="ag-broadcast-btn"
                            :disabled="!broadcastText.trim() || isBroadcasting"
                            @click="sendBroadcast"
                        >
                            <Antenna :size="11" />SEND
                        </button>
                    </div>
                    <div class="ag-input-area">
                        <textarea
                            ref="inputEl"
                            v-model="inputText"
                            class="ag-input"
                            placeholder="Message the agent… (Enter to send, Shift+Enter for newline)"
                            :disabled="isStreaming"
                            rows="3"
                            @keydown="onKeydown"
                        />
                        <div class="ag-input-actions">
                            <button
                                v-if="isStreaming"
                                class="ag-stop-btn"
                                @click="cancelPrompt"
                            >
                                <StopCircle :size="13" />Stop
                            </button>
                            <button
                                v-else
                                class="ag-send-btn"
                                :disabled="!inputText.trim()"
                                @click="sendMessage"
                            >
                                <Send :size="13" />Send
                            </button>
                        </div>
                    </div>
                </template>
                <div
                    v-else
                    class="ag-chat-placeholder"
                >
                    <span class="ag-ph-icon">💬</span>
                    <span class="ag-muted">Select an agent to start a conversation</span>
                </div>
            </div>
        </div>

        <!-- ── CONTROLLER TAB ─────────────────────────────────────────────────── -->
        <div
            v-else-if='innerTab === "controller"'
            class="ag-ctrl"
        >
            <div class="ag-ctrl-hd">
                <Terminal
                    :size="13"
                    style="color:#4a9eff"
                />
                <span class="ag-ctrl-title">SESSION CONTROLLER</span>
                <span
                    class="ag-muted ag-mono"
                    style="font-size:9px"
                >Requires a controller agent to be connected</span>
                <select
                    v-model="controllerInstanceId"
                    class="ag-ctrl-select"
                >
                    <option value="">
                        Select controller…
                    </option>
                    <option
                        v-for="a in agentList"
                        :key="a.instanceId"
                        :value="a.instanceId"
                    >
                        {{ a.name || a.agent }}
                    </option>
                </select>
                <button
                    class="ag-btn"
                    :disabled="!controllerInstanceId"
                    @click="listAll"
                >
                    <RefreshCw :size="11" />Refresh
                </button>
            </div>

            <div class="ag-ctrl-body">
                <!-- Claude Code Sessions -->
                <div class="ag-ctrl-section">
                    <div class="ag-ctrl-section-hd">
                        <Code2
                            :size="12"
                            style="color:#818cf8"
                        />
                        <span class="ag-ctrl-sec-title">CLAUDE CODE SESSIONS</span>
                        <span class="ag-badge">{{ ccSessions.length }}</span>
                        <button
                            class="ag-spawn-btn"
                            :disabled="!controllerInstanceId"
                            @click="showCcSpawn = !showCcSpawn"
                        >
                            <Plus :size="11" />Spawn
                        </button>
                    </div>
                    <div
                        v-if="showCcSpawn"
                        class="ag-spawn-form"
                    >
                        <input
                            v-model="ccSpec.cwd"
                            class="ag-spawn-input"
                            placeholder="Working directory (cwd)"
                        >
                        <input
                            v-model="ccSpec.model"
                            class="ag-spawn-input"
                            placeholder="Model (e.g. claude-opus-5)"
                        >
                        <input
                            v-model="ccSpec.permission_mode"
                            class="ag-spawn-input"
                            placeholder="Permission mode (bypassPermissions)"
                        >
                        <div class="ag-spawn-actions">
                            <button
                                class="ag-spawn-go"
                                :disabled="!ccSpec.cwd"
                                @click="spawnCc"
                            >
                                <Zap :size="11" />Spawn Session
                            </button>
                        </div>
                    </div>
                    <div
                        v-if="ccSessions.length === 0"
                        class="ag-ctrl-empty ag-muted ag-mono"
                    >
                        No active sessions
                    </div>
                    <div
                        v-for="sess in ccSessions"
                        :key="sess.session_id"
                        class="ag-sess"
                    >
                        <div class="ag-sess-top">
                            <div
                                class="ag-sess-dot"
                                :class='sess.active_request ? "busy" : "idle"'
                            />
                            <span
                                class="ag-mono"
                                style="font-size:10px;color:#e6edf3"
                            >{{ sess.session_id.slice(0,12) }}…</span>
                            <span
                                class="ag-muted ag-mono"
                                style="font-size:9px"
                            >{{ sess.cwd }}</span>
                            <span
                                v-if="sess.total_cost_usd > 0"
                                class="ag-muted ag-mono"
                                style="font-size:9px;margin-left:auto"
                            >${{ sess.total_cost_usd.toFixed(3) }}</span>
                        </div>
                        <div class="ag-sess-meta">
                            <span
                                class="ag-chip"
                                :class='sess.active_request ? "busy" : "idle"'
                            >{{ sess.active_request ? 'ACTIVE' : 'IDLE' }}</span>
                            <span
                                class="ag-muted ag-mono"
                                style="font-size:9px"
                            >{{ sess.model }}</span>
                            <span
                                class="ag-muted ag-mono"
                                style="font-size:9px"
                            >{{ sess.turn_count }} turns</span>
                            <span
                                class="ag-muted ag-mono"
                                style="font-size:9px"
                            >{{ fmtLife(sess.remaining_lifetime_s) }} left</span>
                        </div>
                        <button
                            class="ag-stop-small"
                            @click="stopCc(sess.session_id)"
                        >
                            <Square :size="9" />Stop
                        </button>
                    </div>
                </div>

                <!-- Python Exec Sessions -->
                <div class="ag-ctrl-section">
                    <div class="ag-ctrl-section-hd">
                        <Cpu
                            :size="12"
                            style="color:#2dd4bf"
                        />
                        <span class="ag-ctrl-sec-title">PYTHON EXEC SESSIONS</span>
                        <span class="ag-badge">{{ piSessions.length }}</span>
                        <button
                            class="ag-spawn-btn"
                            :disabled="!controllerInstanceId"
                            @click="showPiSpawn = !showPiSpawn"
                        >
                            <Plus :size="11" />Spawn
                        </button>
                    </div>
                    <div
                        v-if="showPiSpawn"
                        class="ag-spawn-form"
                    >
                        <input
                            v-model="piSpec.cwd"
                            class="ag-spawn-input"
                            placeholder="Working directory (cwd)"
                        >
                        <input
                            v-model="piSpec.model"
                            class="ag-spawn-input"
                            placeholder="Model (optional)"
                        >
                        <div class="ag-spawn-actions">
                            <button
                                class="ag-spawn-go"
                                :disabled="!piSpec.cwd"
                                @click="spawnPi"
                            >
                                <Zap :size="11" />Spawn Session
                            </button>
                        </div>
                    </div>
                    <div
                        v-if="piSessions.length === 0"
                        class="ag-ctrl-empty ag-muted ag-mono"
                    >
                        No active sessions
                    </div>
                    <div
                        v-for="sess in piSessions"
                        :key="sess.session_id"
                        class="ag-sess"
                    >
                        <div class="ag-sess-top">
                            <div
                                class="ag-sess-dot"
                                :class='sess.active_request ? "busy" : "idle"'
                            />
                            <span
                                class="ag-mono"
                                style="font-size:10px;color:#e6edf3"
                            >{{ sess.session_id.slice(0,12) }}…</span>
                            <span
                                class="ag-muted ag-mono"
                                style="font-size:9px"
                            >{{ sess.cwd }}</span>
                        </div>
                        <div class="ag-sess-meta">
                            <span
                                class="ag-chip"
                                :class='sess.active_request ? "busy" : "idle"'
                            >{{ sess.active_request ? 'ACTIVE' : 'IDLE' }}</span>
                            <span
                                class="ag-muted ag-mono"
                                style="font-size:9px"
                            >{{ fmtLife(sess.remaining_lifetime_s) }} left</span>
                            <span
                                v-if="sess.queued_requests > 0"
                                class="ag-muted ag-mono"
                                style="font-size:9px"
                            >{{ sess.queued_requests }} queued</span>
                        </div>
                        <button
                            class="ag-stop-small"
                            @click="stopPi(sess.session_id)"
                        >
                            <Square :size="9" />Stop
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── WIRE TAB ───────────────────────────────────────────────────────── -->
        <div
            v-else-if='innerTab === "wire"'
            class="ag-wire"
        >
            <div class="ag-wire-hd">
                <Radio
                    :size="13"
                    class="ag-acc"
                />
                <span class="ag-ctrl-title">WIRE TRAFFIC</span>
                <select
                    v-model="wireAgentId"
                    class="ag-ctrl-select"
                >
                    <option value="">
                        Select agent…
                    </option>
                    <option
                        v-for="a in agentList"
                        :key="a.instanceId"
                        :value="a.instanceId"
                    >
                        {{ a.name || a.agent }}
                    </option>
                </select>
                <span class="ag-badge">{{ wireLog.length }}</span>
                <button
                    class="ag-btn"
                    @click="wireLog = []"
                >
                    <Trash2 :size="11" />Clear
                </button>
            </div>
            <div class="ag-wire-cols ag-muted ag-mono">
                <span>TIME</span><span>SUBJECT</span><span>DATA</span>
            </div>
            <div
                ref="wireEl"
                class="ag-wire-log"
            >
                <div
                    v-if="wireLog.length === 0"
                    class="ag-ctrl-empty ag-muted ag-mono"
                >
                    {{ wireAgentId ? 'Listening on agents.' + wireAgentId + '.>' : 'Select an agent to monitor its NATS traffic' }}
                </div>
                <div
                    v-for="(row, i) in wireLog"
                    :key="i"
                    class="ag-wire-row"
                >
                    <span class="ag-mono ag-dim">{{ row.time }}</span>
                    <span class="ag-mono ag-wire-subj">{{ row.subject }}</span>
                    <span class="ag-mono ag-dim">{{ row.preview }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
    RefreshCw, Send, StopCircle, Wrench, MessageSquare, Terminal, Radio,
    Code2, Cpu, Plus, Zap, Square, Trash2, Antenna,
} from 'lucide-vue-next';
import { useBridge } from '../composables/useBridge';
import { useNatsStore } from '../stores/nats.store';
import type { Subscription } from 'nats.ws';

// ── Bridge ────────────────────────────────────────────────────────────────────

const bridge = useBridge();
const { status: bridgeStatus, natsServer, agents } = bridge;

// ── Inner tabs ────────────────────────────────────────────────────────────────

const INNER_TABS = [
    { id: 'chat',       label: 'Chat',       icon: MessageSquare },
    { id: 'controller', label: 'Controller', icon: Terminal      },
    { id: 'wire',       label: 'Wire',       icon: Radio         },
] as const;

type InnerTab = typeof INNER_TABS[number]['id'];
const innerTab = ref<InnerTab>('chat');

// ── Chat state ────────────────────────────────────────────────────────────────

const selectedId   = ref<string | null>(null);
const inputText    = ref('');
const messagesEl   = ref<HTMLElement | null>(null);
const inputEl      = ref<HTMLTextAreaElement | null>(null);
const isStreaming   = ref(false);
let currentReqId: string | null = null;

interface ChatMsg {
    role: 'user' | 'assistant' | 'error' | 'status';
    text: string; done?: boolean; toolName?: string; cost?: number;
}

const chatHistory = ref<Map<string, ChatMsg[]>>(new Map());

const agentList     = computed(() => [...agents.value.values()]);
const selectedAgent = computed(() => selectedId.value ? agents.value.get(selectedId.value) ?? null : null);
const messages      = computed(() => selectedId.value ? (chatHistory.value.get(selectedId.value) ?? []) : []);

// ── Multi-select + broadcast ──────────────────────────────────────────────────

const selectedIds    = ref<Set<string>>(new Set());
const broadcastText  = ref('');
const isBroadcasting = ref(false);

const allSelected = computed(() => agentList.value.length > 0 && agentList.value.every(a => selectedIds.value.has(a.instanceId)));

function toggleSelect(id: string) {
    const next = new Set(selectedIds.value);
    if (next.has(id)) next.delete(id); else next.add(id);
    selectedIds.value = next;
}

function toggleSelectAll() {
    if (allSelected.value) {
        selectedIds.value = new Set();
    } else {
        selectedIds.value = new Set(agentList.value.map(a => a.instanceId));
    }
}

function sendBroadcast() {
    const text = broadcastText.value.trim();
    if (!text || isBroadcasting.value) return;
    isBroadcasting.value = true;
    broadcastText.value = '';
    const ids = [...selectedIds.value];
    ids.forEach(id => {
        bridge.prompt(id, text, (ev) => {
            if (ev.kind === 'done' || ev.kind === 'error') {
                if (ids.indexOf(id) === ids.length - 1) isBroadcasting.value = false;
            }
        });
    });
}

// ── Agent display helpers ────────────────────────────────────────────────────

const lastHeartbeat = ref<Map<string, number>>(new Map());

const bridgeStatusLabel = computed(() => {
    const m: Record<string, string> = { connected:'Connected', connecting:'Connecting…', disconnected:'Disconnected', error:'Bridge error' };
    return m[bridgeStatus.value] ?? bridgeStatus.value;
});

function heartbeatClass(id: string): string {
    const ts = lastHeartbeat.value.get(id);
    if (!ts) return '';
    return Date.now() - ts < 30_000 ? 'alive' : 'stale';
}

const AGENT_COLORS: Array<{ bg: string; fg: string }> = [
    { bg: 'rgba(99,102,241,0.18)',  fg: '#818cf8' },
    { bg: 'rgba(20,184,166,0.18)',  fg: '#2dd4bf' },
    { bg: 'rgba(234,179,8,0.18)',   fg: '#fbbf24' },
    { bg: 'rgba(239,68,68,0.18)',   fg: '#f87171' },
    { bg: 'rgba(74,158,255,0.18)',  fg: '#4a9eff' },
    { bg: 'rgba(168,85,247,0.18)',  fg: '#c084fc' },
];

function agentColor(agent: string): { bg: string; fg: string } {
    let h = 0;
    for (let i = 0; i < agent.length; i++) h = (h * 31 + agent.charCodeAt(i)) & 0xffffffff;
    return AGENT_COLORS[Math.abs(h) % AGENT_COLORS.length];
}

function agentInitials(agent: string): string {
    const parts = agent.replace(/[-_]/g, ' ').split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return agent.slice(0, 2).toUpperCase();
}

function selectAgent(id: string) {
    selectedId.value = id;
    if (!chatHistory.value.has(id)) chatHistory.value = new Map(chatHistory.value).set(id, []);
    nextTick(() => scrollToBottom());
}

function scrollToBottom() {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
}

function pushMsg(agentId: string, msg: ChatMsg) {
    const next = new Map(chatHistory.value);
    const list = [...(next.get(agentId) ?? [])];
    list.push(msg);
    next.set(agentId, list);
    chatHistory.value = next;
}

function updateLastMsg(agentId: string, patch: Partial<ChatMsg>) {
    const next = new Map(chatHistory.value);
    const list = [...(next.get(agentId) ?? [])];
    if (list.length > 0) list[list.length - 1] = { ...list[list.length - 1], ...patch };
    next.set(agentId, list);
    chatHistory.value = next;
}

function sendMessage() {
    const text = inputText.value.trim();
    const agentId = selectedId.value;
    if (!text || !agentId || isStreaming.value) return;
    inputText.value = '';
    pushMsg(agentId, { role: 'user', text });
    pushMsg(agentId, { role: 'assistant', text: '', done: false });
    isStreaming.value = true;
    nextTick(scrollToBottom);
    currentReqId = bridge.prompt(agentId, text, (ev) => {
        if (ev.kind === 'response') {
            updateLastMsg(agentId, { text: (messages.value[messages.value.length - 1]?.text ?? '') + (ev.text ?? '') });
            nextTick(scrollToBottom);
        } else if (ev.kind === 'tool-use') {
            updateLastMsg(agentId, { toolName: ev.toolName });
        } else if (ev.kind === 'tool-result') {
            updateLastMsg(agentId, { toolName: undefined });
        } else if (ev.kind === 'cost') {
            updateLastMsg(agentId, { cost: ev.totalCostUsd });
        } else if (ev.kind === 'done') {
            updateLastMsg(agentId, { done: true });
            isStreaming.value = false; currentReqId = null;
            nextTick(() => inputEl.value?.focus());
        } else if (ev.kind === 'error') {
            updateLastMsg(agentId, { role: 'error', text: ev.message ?? 'Unknown error', done: true });
            isStreaming.value = false; currentReqId = null;
        } else if (ev.kind === 'status') {
            pushMsg(agentId, { role: 'status', text: ev.status ?? '' });
            nextTick(scrollToBottom);
        }
    });
}

function cancelPrompt() {
    if (currentReqId) { bridge.cancel(currentReqId); currentReqId = null; }
    if (selectedId.value) updateLastMsg(selectedId.value, { done: true });
    isStreaming.value = false;
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

// ── Controller state ──────────────────────────────────────────────────────────

interface CcSession {
    session_id: string; subject: string; cwd: string; model: string;
    active_request: boolean; remaining_lifetime_s: number;
    total_cost_usd: number; turn_count: number; queued_requests: number;
}
interface PiSession {
    session_id: string; subject: string; cwd: string; model?: string;
    active_request: boolean; remaining_lifetime_s: number; queued_requests: number;
}

const controllerInstanceId = ref('');
const ccSessions = ref<CcSession[]>([]);
const piSessions = ref<PiSession[]>([]);
const showCcSpawn = ref(false);
const showPiSpawn = ref(false);
const ccSpec = ref({ cwd: '', model: 'claude-sonnet-5', permission_mode: 'bypassPermissions' });
const piSpec = ref({ cwd: '', model: '' });

let unsubBridgeMsg: (() => void) | null = null;

function reqId() { return `ctrl-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

function listAll() {
    if (!controllerInstanceId.value) return;
    bridge.sendRaw({ kind: 'ccexec-list', id: reqId(), controllerInstanceId: controllerInstanceId.value });
    bridge.sendRaw({ kind: 'piexec-list', id: reqId(), controllerInstanceId: controllerInstanceId.value });
}

function spawnCc() {
    if (!controllerInstanceId.value || !ccSpec.value.cwd) return;
    bridge.sendRaw({
        kind: 'ccexec-spawn', id: reqId(), controllerInstanceId: controllerInstanceId.value,
        spec: { cwd: ccSpec.value.cwd, model: ccSpec.value.model || undefined, permission_mode: ccSpec.value.permission_mode || undefined },
    });
    showCcSpawn.value = false;
    ccSpec.value = { cwd: '', model: 'claude-sonnet-5', permission_mode: 'bypassPermissions' };
}

function spawnPi() {
    if (!controllerInstanceId.value || !piSpec.value.cwd) return;
    bridge.sendRaw({
        kind: 'piexec-spawn', id: reqId(), controllerInstanceId: controllerInstanceId.value,
        spec: { cwd: piSpec.value.cwd, model: piSpec.value.model || undefined },
    });
    showPiSpawn.value = false;
    piSpec.value = { cwd: '', model: '' };
}

function stopCc(sessionId: string) {
    if (!controllerInstanceId.value) return;
    bridge.sendRaw({ kind: 'ccexec-stop', id: reqId(), controllerInstanceId: controllerInstanceId.value, sessionId });
}

function stopPi(sessionId: string) {
    if (!controllerInstanceId.value) return;
    bridge.sendRaw({ kind: 'piexec-stop', id: reqId(), controllerInstanceId: controllerInstanceId.value, sessionId });
}

function fmtLife(s: number): string {
    if (s >= 3600) return `${Math.floor(s/3600)}h`;
    if (s >= 60) return `${Math.floor(s/60)}m`;
    return `${s}s`;
}

// ── Wire monitoring ───────────────────────────────────────────────────────────

interface WireRow { time: string; subject: string; preview: string; }
const wireAgentId = ref('');
const wireLog = ref<WireRow[]>([]);
const wireEl = ref<HTMLElement | null>(null);
let wireSub: Subscription | null = null;
const { nc, sc } = useNatsStore();

watch(wireAgentId, async (id) => {
    wireSub?.unsubscribe(); wireSub = null;
    wireLog.value = [];
    if (!id || !nc.value) return;
    try {
        const sub = nc.value.subscribe(`agents.${id}.>`);
        wireSub = sub;
        for await (const msg of sub) {
            const preview = sc.decode(msg.data).slice(0, 90);
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const next = [{ time, subject: msg.subject, preview }, ...wireLog.value];
            wireLog.value = next.length > 200 ? next.slice(0, 200) : next;
        }
    } catch { /* unmounted or unsub */ }
}, { immediate: true });

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
    bridge.start();
    unsubBridgeMsg = bridge.onMessage((msg) => {
        if (msg.kind === 'ccexec-listed') {
            ccSessions.value = (msg.summaries as CcSession[]) ?? [];
        } else if (msg.kind === 'piexec-listed') {
            piSessions.value = (msg.summaries as PiSession[]) ?? [];
        } else if (msg.kind === 'ccexec-spawned') {
            listAll();
        } else if (msg.kind === 'ccexec-stopped') {
            ccSessions.value = ccSessions.value.filter(s => s.session_id !== (msg.sessionId as string));
        } else if (msg.kind === 'piexec-spawned') {
            listAll();
        } else if (msg.kind === 'piexec-stopped') {
            piSessions.value = piSessions.value.filter(s => s.session_id !== (msg.sessionId as string));
        }
    });
});

watch(controllerInstanceId, (id) => { if (id) listAll(); });

onUnmounted(() => {
    bridge.stop();
    unsubBridgeMsg?.();
    wireSub?.unsubscribe();
});
</script>

<style scoped>
.ag { display:flex; flex-direction:column; height:100%; overflow:hidden; }

/* Top bar */
.ag-bar { display:flex; align-items:center; gap:8px; padding:5px 10px; flex-shrink:0; border-bottom:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); flex-wrap:nowrap; }
.ag-status-row { display:flex; align-items:center; gap:6px; }
.ag-dot { width:7px; height:7px; border-radius:50%; background:#555; flex-shrink:0; }
.ag-dot.connected { background:#22c55e; box-shadow:0 0 5px #22c55e88; }
.ag-dot.connecting { background:#f59e0b; animation:blink 1s infinite; }
.ag-dot.error { background:#f85149; }
.ag-bar-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.6); }
.ag-muted { color:rgba(255,255,255,0.35); font-size:11px; }
.ag-mono { font-family:monospace; }
.ag-acc { color:#4a9eff; }
.ag-dim { color:rgba(255,255,255,0.25); }
.ag-btn { display:flex; align-items:center; gap:4px; padding:3px 9px; border-radius:5px; font-size:11px; font-weight:500; cursor:pointer; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); transition:all .12s; white-space:nowrap; }
.ag-btn:hover:not(:disabled) { background:rgba(255,255,255,0.1); color:#e6edf3; }
.ag-btn:disabled { opacity:0.35; cursor:not-allowed; }
.ag-badge { font-size:9px; padding:1px 6px; border-radius:3px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.4); font-family:monospace; }

/* Inner tab bar */
.ag-tabs { display:flex; gap:1px; margin:0 4px; }
.ag-tab { display:flex; align-items:center; gap:4px; padding:3px 9px; border-radius:4px; font-size:10px; font-weight:500; cursor:pointer; background:transparent; border:none; color:rgba(255,255,255,0.35); transition:all .12s; }
.ag-tab:hover { color:rgba(255,255,255,0.7); }
.ag-tab.active { background:rgba(74,158,255,0.12); color:#4a9eff; }

/* CHAT body */
.ag-body { display:flex; flex:1; overflow:hidden; }
.ag-roster { width:240px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.07); overflow-y:auto; display:flex; flex-direction:column; gap:2px; padding:4px; }
.ag-roster-hd { display:flex; align-items:center; gap:6px; padding:4px 8px; border-bottom:1px solid rgba(255,255,255,0.05); flex-shrink:0; }
.ag-chk-label { display:flex; align-items:center; gap:5px; cursor:pointer; }
.ag-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; height:100%; color:rgba(255,255,255,0.3); font-size:12px; }
.ag-empty-icon { font-size:28px; opacity:0.3; }
.ag-card { display:flex; flex-direction:column; gap:5px; padding:7px 8px; border-radius:7px; border:1px solid transparent; cursor:pointer; text-align:left; background:transparent; transition:all .12s; width:100%; }
.ag-card:hover { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.07); }
.ag-card.selected { background:rgba(74,158,255,0.08); border-color:rgba(74,158,255,0.25); }
.ag-card-top { display:flex; align-items:center; gap:7px; }
.ag-type-badge { width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; }
.ag-type-badge.sm { width:24px; height:24px; font-size:9px; }
.ag-card-info { flex:1; min-width:0; }
.ag-card-name { font-size:11px; font-weight:600; color:#e6edf3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ag-card-sub { font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ag-hb-dot { width:6px; height:6px; border-radius:50%; background:#444; flex-shrink:0; }
.ag-hb-dot.alive { background:#22c55e; box-shadow:0 0 4px #22c55e; }
.ag-hb-dot.stale { background:#f59e0b; }
.ag-card-desc { font-size:10px; color:rgba(255,255,255,0.3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* Chat area */
.ag-chat { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.ag-chat-hd { display:flex; align-items:center; gap:10px; padding:8px 14px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.ag-chat-name { font-size:12px; font-weight:600; color:#e6edf3; }
.ag-messages { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
.ag-chat-empty { display:flex; align-items:center; justify-content:center; height:100%; }
.ag-msg.user { display:flex; justify-content:flex-end; }
.ag-msg.assistant,.ag-msg.error,.ag-msg.status { display:flex; flex-direction:column; align-items:flex-start; gap:3px; }
.ag-msg-bubble { max-width:85%; padding:8px 12px; border-radius:10px; font-size:12px; line-height:1.5; white-space:pre-wrap; word-break:break-word; }
.ag-msg-bubble.user { background:rgba(74,158,255,0.15); border:1px solid rgba(74,158,255,0.2); color:#e6edf3; }
.ag-msg-bubble.assistant { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); color:#e6edf3; }
.ag-msg-bubble.error { background:rgba(248,81,73,0.1); border:1px solid rgba(248,81,73,0.2); color:#f85149; }
.ag-status-msg { font-size:10px; font-style:italic; }
.ag-tool { display:flex; align-items:center; gap:4px; font-size:10px; color:rgba(255,255,255,0.4); padding:2px 6px; }
.ag-cost { font-size:10px; padding:2px 6px; font-family:monospace; }
.ag-cursor { display:inline-block; width:2px; height:13px; background:#4a9eff; margin-left:2px; animation:blink 0.8s infinite; vertical-align:middle; }
.ag-typing { display:inline-flex; gap:3px; align-items:center; padding:2px 0; }
.ag-typing span { width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,0.4); animation:bounce 1.2s infinite; }
.ag-typing span:nth-child(2) { animation-delay:.2s; }
.ag-typing span:nth-child(3) { animation-delay:.4s; }
@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

/* Broadcast bar */
.ag-broadcast-bar { display:flex; align-items:center; gap:8px; padding:6px 10px; border-top:1px solid rgba(245,158,11,0.15); background:rgba(245,158,11,0.04); flex-shrink:0; }
.ag-broadcast-input { flex:1; padding:4px 8px; border-radius:5px; background:rgba(255,255,255,0.05); border:1px solid rgba(245,158,11,0.2); color:#e6edf3; font-size:11px; outline:none; }
.ag-broadcast-btn { display:flex; align-items:center; gap:4px; padding:4px 10px; border-radius:5px; font-size:10px; font-weight:600; font-family:monospace; cursor:pointer; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); color:#f59e0b; transition:all .12s; }
.ag-broadcast-btn:disabled { opacity:0.35; cursor:not-allowed; }
.ag-broadcast-btn:not(:disabled):hover { background:rgba(245,158,11,0.18); }

/* Input */
.ag-input-area { flex-shrink:0; border-top:1px solid rgba(255,255,255,0.07); padding:10px; display:flex; gap:8px; align-items:flex-end; }
.ag-input { flex:1; resize:none; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#e6edf3; font-size:12px; padding:8px 10px; outline:none; font-family:inherit; line-height:1.5; transition:border-color .12s; }
.ag-input:focus { border-color:rgba(74,158,255,0.4); }
.ag-input:disabled { opacity:0.5; cursor:not-allowed; }
.ag-input-actions { display:flex; flex-direction:column; gap:4px; }
.ag-send-btn { display:flex; align-items:center; gap:5px; padding:6px 14px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; background:#4a9eff; color:#000; border:none; transition:opacity .15s; white-space:nowrap; }
.ag-send-btn:disabled { opacity:0.35; cursor:not-allowed; }
.ag-send-btn:not(:disabled):hover { opacity:0.85; }
.ag-stop-btn { display:flex; align-items:center; gap:5px; padding:6px 14px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; background:rgba(248,81,73,0.15); color:#f85149; border:1px solid rgba(248,81,73,0.25); transition:all .12s; white-space:nowrap; }
.ag-stop-btn:hover { background:rgba(248,81,73,0.25); }
.ag-chat-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; }
.ag-ph-icon { font-size:36px; opacity:0.2; }

/* Controller */
.ag-ctrl { display:flex; flex-direction:column; flex:1; overflow:hidden; }
.ag-ctrl-hd { display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); flex-wrap:wrap; }
.ag-ctrl-title { font-size:11px; font-weight:700; font-family:monospace; letter-spacing:0.06em; color:#e6edf3; }
.ag-ctrl-select { padding:3px 8px; border-radius:5px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#e6edf3; font-size:10px; font-family:monospace; outline:none; }
.ag-ctrl-body { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:0; }
.ag-ctrl-section { border-bottom:1px solid rgba(255,255,255,0.06); }
.ag-ctrl-section-hd { display:flex; align-items:center; gap:8px; padding:8px 12px; background:rgba(255,255,255,0.015); }
.ag-ctrl-sec-title { font-size:10px; font-weight:700; font-family:monospace; letter-spacing:0.07em; color:rgba(255,255,255,0.6); }
.ag-ctrl-empty { padding:12px; font-size:10px; }
.ag-spawn-btn { display:flex; align-items:center; gap:4px; padding:2px 8px; border-radius:4px; font-size:10px; font-family:monospace; cursor:pointer; background:rgba(74,158,255,0.08); border:1px solid rgba(74,158,255,0.2); color:#4a9eff; transition:all .12s; margin-left:auto; }
.ag-spawn-btn:disabled { opacity:0.35; cursor:not-allowed; }
.ag-spawn-btn:not(:disabled):hover { background:rgba(74,158,255,0.15); }
.ag-spawn-form { padding:8px 12px; display:flex; flex-direction:column; gap:5px; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(74,158,255,0.03); }
.ag-spawn-input { padding:5px 8px; border-radius:5px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#e6edf3; font-size:11px; font-family:monospace; outline:none; }
.ag-spawn-actions { display:flex; justify-content:flex-end; }
.ag-spawn-go { display:flex; align-items:center; gap:4px; padding:4px 12px; border-radius:5px; font-size:10px; font-weight:600; font-family:monospace; cursor:pointer; background:#4a9eff; color:#000; border:none; }
.ag-spawn-go:disabled { opacity:0.35; cursor:not-allowed; }
.ag-sess { padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.04); display:flex; flex-direction:column; gap:4px; }
.ag-sess-top { display:flex; align-items:center; gap:8px; }
.ag-sess-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.ag-sess-dot.idle { background:#22c55e; }
.ag-sess-dot.busy { background:#f59e0b; box-shadow:0 0 5px #f59e0b; animation:blink 1s infinite; }
.ag-sess-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ag-chip { font-size:9px; padding:1px 6px; border-radius:3px; font-family:monospace; font-weight:600; }
.ag-chip.idle { background:rgba(34,197,94,0.1); color:#22c55e; }
.ag-chip.busy { background:rgba(245,158,11,0.12); color:#f59e0b; }
.ag-stop-small { display:flex; align-items:center; gap:4px; padding:2px 8px; border-radius:4px; font-size:9px; font-family:monospace; cursor:pointer; background:rgba(248,81,73,0.08); border:1px solid rgba(248,81,73,0.2); color:#f85149; width:fit-content; }
.ag-stop-small:hover { background:rgba(248,81,73,0.15); }

/* Wire */
.ag-wire { display:flex; flex-direction:column; flex:1; overflow:hidden; }
.ag-wire-hd { display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); }
.ag-wire-cols { display:grid; grid-template-columns:80px 220px 1fr; gap:8px; padding:4px 12px; border-bottom:1px solid rgba(255,255,255,0.07); font-size:9px; letter-spacing:0.07em; text-transform:uppercase; flex-shrink:0; }
.ag-wire-log { flex:1; overflow-y:auto; }
.ag-wire-row { display:grid; grid-template-columns:80px 220px 1fr; gap:8px; padding:3px 12px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:10px; }
.ag-wire-row:hover { background:rgba(255,255,255,0.02); }
.ag-wire-subj { color:#4a9eff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
</style>
