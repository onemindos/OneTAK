<template>
    <div class="tm">
        <!-- Tab bar -->
        <div class="tm-tabs">
            <button
                v-for="tab in TABS"
                :key="tab.id"
                class="tm-tab"
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id"
            >
                <component
                    :is="tab.icon"
                    :size="11"
                />
                {{ tab.label }}
            </button>
            <div class="tm-spacer" />
            <div class="tm-conn">
                <div
                    class="tm-conn-dot"
                    :class="{ ok: tmReachable }"
                />
                <span
                    class="tm-mono"
                    :class='tmReachable ? "tm-green" : "tm-dim"'
                    style="font-size:9px"
                >
                    {{ tmReachable ? 'TIMEMACHINE ONLINE' : 'OFFLINE' }}
                </span>
            </div>
        </div>

        <div class="tm-body">
            <!-- ── QUERY ─────────────────────────────────────────────────────── -->
            <template v-if='activeTab === "query"'>
                <div class="tm-query-panel">
                    <!-- Editor area -->
                    <div class="tm-editor-wrap">
                        <div class="tm-editor-hd">
                            <Database
                                :size="11"
                                class="tm-acc"
                            />
                            <span class="tm-section-label">SQL QUERY</span>
                            <div class="tm-presets">
                                <button
                                    v-for="p in PRESETS"
                                    :key="p.name"
                                    class="tm-preset-chip"
                                    :title="p.sql"
                                    @click="loadPreset(p)"
                                >
                                    {{ p.name }}
                                </button>
                            </div>
                        </div>
                        <textarea
                            v-model="sql"
                            class="tm-textarea tm-mono"
                            rows="6"
                            placeholder="SELECT * FROM entity_events ORDER BY timestamp DESC LIMIT 100"
                            spellcheck="false"
                            @keydown="onSqlKey"
                        />
                        <div class="tm-run-bar">
                            <button
                                class="tm-run-btn"
                                :disabled="queryLoading || !sql.trim()"
                                @click="runQuery"
                            >
                                <Loader2
                                    v-if="queryLoading"
                                    :size="12"
                                    class="tm-spin"
                                />
                                <Play
                                    v-else
                                    :size="12"
                                />
                                {{ queryLoading ? 'RUNNING…' : 'RUN' }}
                            </button>
                            <span
                                class="tm-mono tm-dim"
                                style="font-size:9px"
                            >CMD+ENTER</span>
                            <template v-if="queryResult">
                                <span class="tm-stat"><span class="tm-green tm-mono">{{ queryResult.rows.toLocaleString() }}</span> rows</span>
                                <span class="tm-stat">elapsed: <span class="tm-green tm-mono">{{ fmtElapsed(queryResult.elapsed) }}</span></span>
                            </template>
                            <span
                                v-if="queryError"
                                class="tm-err tm-mono"
                            >{{ queryError }}</span>
                            <div
                                v-if="queryResult"
                                class="tm-view-toggle"
                            >
                                <button
                                    class="tm-view-btn"
                                    :class='{ active: viewMode === "table" }'
                                    @click='viewMode = "table"'
                                >
                                    <Table2 :size="11" /> TABLE
                                </button>
                                <button
                                    class="tm-view-btn"
                                    :class='{ active: viewMode === "raw" }'
                                    @click='viewMode = "raw"'
                                >
                                    <Code :size="11" /> RAW
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Results -->
                    <div
                        v-if="queryResult"
                        class="tm-results"
                    >
                        <!-- Table view -->
                        <div
                            v-if='viewMode === "table"'
                            class="tm-table-wrap"
                        >
                            <table class="tm-table">
                                <thead>
                                    <tr>
                                        <th
                                            v-for="col in queryColumns"
                                            :key="col"
                                            class="tm-th"
                                            @click="setSortCol(col)"
                                        >
                                            {{ col }}
                                            <span
                                                v-if="sortCol === col"
                                                class="tm-sort-arrow"
                                            >{{ sortDir === "asc" ? "↑" : "↓" }}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="(row, ri) in sortedRows"
                                        :key="ri"
                                        class="tm-tr"
                                    >
                                        <td
                                            v-for="col in queryColumns"
                                            :key="col"
                                            class="tm-td tm-mono"
                                        >
                                            {{ fmtCell(row[col]) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <!-- Raw JSON view -->
                        <pre
                            v-else
                            class="tm-raw tm-mono"
                        >{{ JSON.stringify(queryResult.data, null, 2) }}</pre>
                    </div>
                    <div
                        v-else-if="!queryLoading"
                        class="tm-empty"
                    >
                        <Database
                            :size="22"
                            class="tm-empty-icon"
                        />
                        <span>WRITE A QUERY AND HIT RUN</span>
                        <span class="tm-dim tm-mono">timemachine.onemindos.dev</span>
                    </div>
                </div>
            </template>

            <!-- ── SCHEMA ─────────────────────────────────────────────────────── -->
            <template v-if='activeTab === "schema"'>
                <div class="tm-schema-panel">
                    <!-- Table list -->
                    <div class="tm-schema-left">
                        <div class="tm-schema-hd">
                            <Layers
                                :size="11"
                                class="tm-acc"
                            />
                            <span class="tm-section-label">TABLES</span>
                            <span class="tm-badge">{{ schemaTables.length }}</span>
                            <button
                                class="tm-icon-btn"
                                :disabled="schemaLoading"
                                title="Refresh"
                                @click="loadTables"
                            >
                                <RefreshCw
                                    :size="11"
                                    :class='{ "tm-spin": schemaLoading }'
                                />
                            </button>
                        </div>
                        <div class="tm-schema-search-wrap">
                            <Search
                                :size="10"
                                class="tm-search-icon"
                            />
                            <input
                                v-model="tableSearch"
                                class="tm-search"
                                placeholder="Filter tables…"
                            >
                        </div>
                        <div
                            v-if="schemaError"
                            class="tm-schema-err tm-mono"
                        >
                            {{ schemaError }}
                        </div>
                        <div class="tm-table-list">
                            <button
                                v-for="table in filteredTables"
                                :key="table"
                                class="tm-table-btn"
                                :class="{ active: selectedTable === table }"
                                @click="selectTable(table)"
                            >
                                <Table2
                                    :size="10"
                                    style="flex-shrink:0"
                                />
                                <span class="tm-mono">{{ table }}</span>
                            </button>
                            <div
                                v-if="filteredTables.length === 0 && !schemaLoading"
                                class="tm-dim tm-mono"
                                style="padding:12px;font-size:10px"
                            >
                                {{ schemaTables.length === 0 ? 'No tables loaded' : 'No match' }}
                            </div>
                        </div>
                    </div>

                    <!-- Column detail -->
                    <div class="tm-schema-right">
                        <template v-if="selectedTable">
                            <div class="tm-schema-hd">
                                <Database
                                    :size="11"
                                    class="tm-acc"
                                />
                                <span class="tm-section-label tm-mono">{{ selectedTable }}</span>
                                <span
                                    v-if="selectedRowCount !== null"
                                    class="tm-badge"
                                >{{ selectedRowCount.toLocaleString() }} rows</span>
                                <button
                                    class="tm-icon-btn"
                                    title="Query this table"
                                    @click="queryFromTable(selectedTable)"
                                >
                                    <Play :size="11" />
                                </button>
                            </div>
                            <div
                                v-if="columnsLoading"
                                class="tm-empty"
                            >
                                <Loader2
                                    :size="16"
                                    class="tm-spin tm-acc"
                                />
                            </div>
                            <div
                                v-else-if="selectedColumns.length > 0"
                                class="tm-col-list"
                            >
                                <div class="tm-col-hdr">
                                    <span>COLUMN</span><span>TYPE</span>
                                </div>
                                <div
                                    v-for="col in selectedColumns"
                                    :key="col.name"
                                    class="tm-col-row"
                                >
                                    <span class="tm-mono">{{ col.name }}</span>
                                    <span class="tm-mono tm-type">{{ col.type }}</span>
                                </div>
                            </div>
                        </template>
                        <div
                            v-else
                            class="tm-empty"
                        >
                            <Layers
                                :size="20"
                                class="tm-empty-icon"
                            />
                            <span>SELECT A TABLE</span>
                        </div>
                    </div>
                </div>
            </template>

            <!-- ── HISTORY ────────────────────────────────────────────────────── -->
            <template v-if='activeTab === "history"'>
                <div class="tm-panel-hd">
                    <Clock
                        :size="13"
                        class="tm-acc"
                    />
                    <span class="tm-section-label">QUERY HISTORY</span>
                    <span class="tm-badge">{{ history.length }}</span>
                    <button
                        v-if="history.length > 0"
                        class="tm-icon-btn"
                        title="Clear history"
                        @click="clearHistory"
                    >
                        <Trash2 :size="11" />
                    </button>
                </div>
                <div class="tm-list">
                    <div
                        v-if="history.length === 0"
                        class="tm-empty"
                    >
                        <Clock
                            :size="22"
                            class="tm-empty-icon"
                        />
                        <span>NO QUERY HISTORY</span>
                        <span class="tm-dim tm-mono">Run queries to build history</span>
                    </div>
                    <div
                        v-for="(entry, idx) in history"
                        :key="entry.id"
                        class="tm-hist-row"
                    >
                        <div class="tm-hist-meta">
                            <span
                                class="tm-mono tm-dim"
                                style="font-size:9px"
                            >{{ timeAgo(entry.timestamp) }}</span>
                            <template v-if="entry.rowCount !== undefined">
                                <span
                                    class="tm-mono"
                                    style="font-size:9px;color:#22c55e"
                                >{{ entry.rowCount.toLocaleString() }} rows</span>
                            </template>
                            <template v-if="entry.elapsed !== undefined">
                                <span
                                    class="tm-mono tm-dim"
                                    style="font-size:9px"
                                >{{ fmtElapsed(entry.elapsed) }}</span>
                            </template>
                        </div>
                        <button
                            class="tm-hist-sql tm-mono"
                            :title="entry.sql"
                            @click="loadHistoryEntry(entry)"
                        >
                            {{ truncate(entry.sql, 160) }}
                        </button>
                        <button
                            class="tm-hist-del"
                            title="Delete"
                            @click="deleteHistory(idx)"
                        >
                            <Trash2 :size="10" />
                        </button>
                    </div>
                </div>
            </template>

            <!-- ── TIMELINE ───────────────────────────────────────────────────── -->
            <template v-if='activeTab === "timeline"'>
                <div class="tm-panel-hd">
                    <Clock
                        :size="13"
                        class="tm-acc"
                    />
                    <span class="tm-section-label">ENTITY TIMELINE</span>
                    <span
                        class="tm-mono tm-dim"
                        style="font-size:9px"
                    >Replay entity state via NATS ent.{type}.{id}.replay</span>
                </div>

                <!-- Controls -->
                <div class="tm-tl-controls">
                    <div class="tm-tl-row">
                        <div class="tm-field">
                            <label class="tm-label">ENTITY TYPE</label>
                            <input
                                v-model="tlEntityType"
                                class="tm-input tm-mono"
                                placeholder="drone / node / mission…"
                            >
                        </div>
                        <div class="tm-field">
                            <label class="tm-label">ENTITY ID</label>
                            <input
                                v-model="tlEntityId"
                                class="tm-input tm-mono"
                                placeholder="entity-uuid"
                            >
                        </div>
                    </div>
                    <div class="tm-tl-row">
                        <div class="tm-field">
                            <label class="tm-label">START</label>
                            <input
                                v-model="tlStart"
                                class="tm-input tm-mono"
                                type="datetime-local"
                            >
                        </div>
                        <div class="tm-field">
                            <label class="tm-label">END</label>
                            <input
                                v-model="tlEnd"
                                class="tm-input tm-mono"
                                type="datetime-local"
                            >
                        </div>
                        <button
                            class="tm-fetch-btn"
                            :disabled="tlLoading || !tlEntityId.trim()"
                            @click="fetchTimeline"
                        >
                            <Loader2
                                v-if="tlLoading"
                                :size="11"
                                class="tm-spin"
                            />
                            <Download
                                v-else
                                :size="11"
                            />
                            FETCH
                        </button>
                    </div>
                    <div
                        v-if="tlError"
                        class="tm-err tm-mono"
                    >
                        {{ tlError }}
                    </div>
                </div>

                <!-- Playback bar -->
                <div
                    v-if="tlEntries.length > 0"
                    class="tm-tl-playbar"
                >
                    <button
                        class="tm-play-btn"
                        title="Rewind"
                        @click="tlSeek(0)"
                    >
                        <SkipBack :size="12" />
                    </button>
                    <button
                        class="tm-play-btn primary"
                        @click="togglePlay"
                    >
                        <Pause
                            v-if="tlPlaying"
                            :size="12"
                        />
                        <Play
                            v-else
                            :size="12"
                        />
                    </button>
                    <input
                        class="tm-scrubber"
                        type="range"
                        min="0"
                        :max="tlEntries.length - 1"
                        :value="tlIdx"
                        @input="tlSeek(Number(($event.target as HTMLInputElement).value))"
                    >
                    <span
                        class="tm-mono"
                        style="font-size:10px"
                    >{{ tlIdx + 1 }} / {{ tlEntries.length }}</span>
                    <div class="tm-speed-btns">
                        <button
                            v-for="s in [1, 2, 5]"
                            :key="s"
                            class="tm-speed-btn"
                            :class="{ active: tlSpeed === s }"
                            @click="tlSpeed = s"
                        >
                            {{ s }}×
                        </button>
                    </div>
                    <div class="tm-nats-status">
                        <div
                            class="tm-conn-dot"
                            :class="{ ok: !!nc }"
                        />
                        <span
                            class="tm-mono"
                            style="font-size:9px;"
                            :class='nc ? "tm-green" : "tm-dim"'
                        >{{ nc ? 'NATS OK' : 'NO NATS' }}</span>
                    </div>
                </div>

                <!-- Current frame -->
                <div
                    v-if="tlEntries.length > 0"
                    class="tm-tl-frame"
                >
                    <div class="tm-frame-hd">
                        <span
                            class="tm-mono"
                            style="color:#f59e0b;font-size:10px"
                        >{{ tlEntries[tlIdx]?.timestamp ?? '' }}</span>
                        <span
                            class="tm-mono tm-dim"
                            style="font-size:9px"
                        >{{ tlEntityType }}.{{ tlEntityId }}</span>
                        <span
                            v-if="tlPublished > 0"
                            class="tm-mono"
                            style="font-size:9px;color:#22c55e"
                        >{{ tlPublished }} published</span>
                    </div>
                    <pre class="tm-frame-data tm-mono">{{ JSON.stringify(tlEntries[tlIdx]?.state ?? {}, null, 2) }}</pre>
                </div>

                <!-- Frame list -->
                <div
                    v-if="tlEntries.length > 0"
                    ref="tlListEl"
                    class="tm-tl-list"
                >
                    <div
                        v-for="(entry, i) in tlEntries"
                        :key="i"
                        class="tm-tl-item"
                        :class="{ active: i === tlIdx }"
                        @click="tlSeek(i)"
                    >
                        <div
                            class="tm-tl-dot"
                            :class="{ active: i === tlIdx }"
                        />
                        <span
                            class="tm-mono"
                            style="font-size:10px"
                        >{{ entry.timestamp }}</span>
                        <span
                            class="tm-mono tm-dim"
                            style="font-size:9px"
                        >{{ previewState(entry.state) }}</span>
                    </div>
                </div>

                <div
                    v-else-if="!tlLoading"
                    class="tm-empty"
                >
                    <Clock
                        :size="22"
                        class="tm-empty-icon"
                    />
                    <span>ENTER ENTITY TYPE + ID AND FETCH</span>
                    <span class="tm-dim tm-mono">Re-publishes frames to ent.{type}.{id}.replay</span>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, watch, onUnmounted } from 'vue';
import {
    Play, Pause, SkipBack, Database, Layers, Clock, Trash2, Search,
    RefreshCw, Table2, Download, Code, Loader2,
} from 'lucide-vue-next';
import { useNatsStore } from '../stores/nats.store';

// ── Types ────────────────────────────────────────────────────────────────────

interface QueryResult { data: Record<string, unknown>[]; rows: number; elapsed: number; }
interface Column      { name: string; type: string; }
interface HistoryEntry { id: string; sql: string; timestamp: number; rowCount?: number; elapsed?: number; }
interface TimelineEntry { entity_id: string; entity_type: string; timestamp: string; state: Record<string, unknown>; }

// ── Constants ────────────────────────────────────────────────────────────────

const TM_URL = 'https://timemachine.onemindos.dev';
const HISTORY_KEY = 'tm-query-history';
const MAX_HISTORY = 50;

const TABS = [
    { id: 'query',    label: 'Query',    icon: Play    },
    { id: 'schema',   label: 'Schema',   icon: Layers  },
    { id: 'history',  label: 'History',  icon: Clock   },
    { id: 'timeline', label: 'Timeline', icon: Database },
] as const;

const PRESETS = [
    { name: 'Entity history', sql: "SELECT * FROM entity_events WHERE timestamp > now() - INTERVAL 1 HOUR ORDER BY timestamp DESC LIMIT 1000" },
    { name: 'Agent activity',  sql: "SELECT agent_id, count() as msgs, max(timestamp) as last_seen FROM agent_events WHERE timestamp > today() GROUP BY agent_id ORDER BY msgs DESC" },
    { name: 'Top subjects',    sql: "SELECT subject, count() as count FROM nats_events WHERE timestamp > now() - INTERVAL 24 HOUR GROUP BY subject ORDER BY count DESC LIMIT 50" },
    { name: 'Telemetry',       sql: "SELECT node_id, avg(value) as avg_val, max(timestamp) as last_seen FROM telemetry WHERE timestamp > now() - INTERVAL 1 HOUR GROUP BY node_id ORDER BY last_seen DESC" },
    { name: 'Detections',      sql: "SELECT domain, type, count() as detections FROM detections WHERE timestamp > today() GROUP BY domain, type ORDER BY detections DESC" },
];

// ── Store ────────────────────────────────────────────────────────────────────

const { nc, sc } = useNatsStore();

// ── Global state ─────────────────────────────────────────────────────────────

const activeTab    = ref<'query' | 'schema' | 'history' | 'timeline'>('query');
const tmReachable  = ref(false);

// ── Query tab ────────────────────────────────────────────────────────────────

const sql          = ref(PRESETS[0].sql);
const queryResult  = ref<QueryResult | null>(null);
const queryLoading = ref(false);
const queryError   = ref<string | null>(null);
const viewMode     = ref<'table' | 'raw'>('table');
const sortCol      = ref<string | null>(null);
const sortDir      = ref<'asc' | 'desc'>('asc');

const queryColumns = computed(() => {
    if (!queryResult.value || queryResult.value.data.length === 0) return [];
    return Object.keys(queryResult.value.data[0]);
});

const sortedRows = computed(() => {
    if (!queryResult.value) return [];
    const rows = [...queryResult.value.data];
    if (!sortCol.value) return rows;
    const col = sortCol.value;
    const dir = sortDir.value === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
        const av = a[col]; const bv = b[col];
        if (av == null && bv == null) return 0;
        if (av == null) return dir;
        if (bv == null) return -dir;
        return String(av) < String(bv) ? -dir : String(av) > String(bv) ? dir : 0;
    });
});

function setSortCol(col: string) {
    if (sortCol.value === col) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
    else { sortCol.value = col; sortDir.value = 'asc'; }
}

async function runQuery() {
    const q = sql.value.trim();
    if (!q || queryLoading.value) return;
    queryLoading.value = true;
    queryError.value = null;
    queryResult.value = null;
    sortCol.value = null;
    const t0 = performance.now();
    try {
        const res = await fetch(`${TM_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql: q }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json() as QueryResult;
        const elapsed = data.elapsed ?? Math.round(performance.now() - t0);
        queryResult.value = { ...data, elapsed };
        tmReachable.value = true;
        saveHistory(q, data.rows, elapsed);
    } catch (e) {
        queryError.value = e instanceof Error ? e.message : String(e);
        if (String(e).includes('fetch')) tmReachable.value = false;
    } finally {
        queryLoading.value = false;
    }
}

function loadPreset(p: typeof PRESETS[number]) { sql.value = p.sql; }
function onSqlKey(e: KeyboardEvent) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void runQuery(); } }
function fmtCell(v: unknown): string {
    if (v == null) return 'NULL';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

// ── Schema tab ───────────────────────────────────────────────────────────────

const schemaTables    = ref<string[]>([]);
const schemaLoading   = ref(false);
const schemaError     = ref<string | null>(null);
const selectedTable   = ref<string | null>(null);
const selectedColumns = ref<Column[]>([]);
const selectedRowCount = ref<number | null>(null);
const columnsLoading  = ref(false);
const tableSearch     = ref('');

const filteredTables = computed(() =>
    tableSearch.value ? schemaTables.value.filter(t => t.toLowerCase().includes(tableSearch.value.toLowerCase())) : schemaTables.value
);

async function loadTables() {
    schemaLoading.value = true;
    schemaError.value = null;
    try {
        const res = await fetch(`${TM_URL}/tables`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json() as { tables: string[] };
        schemaTables.value = data.tables ?? [];
        tmReachable.value = true;
    } catch (e) {
        schemaError.value = e instanceof Error ? e.message : String(e);
    } finally {
        schemaLoading.value = false;
    }
}

async function selectTable(name: string) {
    selectedTable.value = name;
    selectedColumns.value = [];
    selectedRowCount.value = null;
    columnsLoading.value = true;
    try {
        const [schRes, cntRes] = await Promise.all([
            fetch(`${TM_URL}/schema/${encodeURIComponent(name)}`),
            runQueryRaw(`SELECT count() as cnt FROM ${name}`),
        ]);
        if (schRes.ok) {
            const d = await schRes.json() as { columns: Column[] };
            selectedColumns.value = d.columns ?? [];
        }
        if (cntRes?.data?.[0]) selectedRowCount.value = Number(cntRes.data[0]['cnt'] ?? 0);
    } catch { /* ignore */ } finally {
        columnsLoading.value = false;
    }
}

function queryFromTable(name: string) {
    sql.value = `SELECT * FROM ${name} ORDER BY timestamp DESC LIMIT 100`;
    activeTab.value = 'query';
}

async function runQueryRaw(q: string): Promise<QueryResult | null> {
    try {
        const res = await fetch(`${TM_URL}/query`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql: q }),
        });
        if (!res.ok) return null;
        return res.json() as Promise<QueryResult>;
    } catch { return null; }
}

// Auto-load schema tables when tab is opened
watch(activeTab, (tab) => {
    if (tab === 'schema' && schemaTables.value.length === 0) void loadTables();
});

// ── History tab ──────────────────────────────────────────────────────────────

function loadHistoryRaw(): HistoryEntry[] {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as HistoryEntry[]; }
    catch { return []; }
}

const history = ref<HistoryEntry[]>(loadHistoryRaw());

function saveHistory(q: string, rowCount?: number, elapsed?: number) {
    const entry: HistoryEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, sql: q, timestamp: Date.now(), rowCount, elapsed };
    const next = [entry, ...history.value].slice(0, MAX_HISTORY);
    history.value = next;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function loadHistoryEntry(entry: HistoryEntry) { sql.value = entry.sql; activeTab.value = 'query'; }

function deleteHistory(idx: number) {
    history.value = history.value.filter((_, i) => i !== idx);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value));
}

function clearHistory() {
    history.value = [];
    localStorage.removeItem(HISTORY_KEY);
}

// ── Timeline tab ─────────────────────────────────────────────────────────────

const tlEntityType = ref('drone');
const tlEntityId   = ref('');
const tlStart      = ref((() => { const d = new Date(); d.setHours(d.getHours() - 24); return d.toISOString().slice(0, 16); })());
const tlEnd        = ref(new Date().toISOString().slice(0, 16));
const tlEntries    = ref<TimelineEntry[]>([]);
const tlLoading    = ref(false);
const tlError      = ref<string | null>(null);
const tlIdx        = ref(0);
const tlPlaying    = ref(false);
const tlSpeed      = ref(1);
const tlPublished  = ref(0);
const tlListEl     = ref<HTMLElement | null>(null);
let tlTimer: ReturnType<typeof setInterval> | null = null;

async function fetchTimeline() {
    const eid = tlEntityId.value.trim();
    if (!eid || tlLoading.value) return;
    tlLoading.value = true;
    tlError.value = null;
    tlEntries.value = [];
    tlIdx.value = 0;
    tlPlaying.value = false;
    clearTlTimer();
    try {
        const s = tlStart.value + ':00';
        const e = tlEnd.value + ':00';
        const q = `SELECT * FROM entity_events WHERE entity_id = '${eid.replace(/'/g, "''")}' AND timestamp >= '${s}' AND timestamp <= '${e}' ORDER BY timestamp ASC LIMIT 1000`;
        const res = await runQueryRaw(q);
        if (!res) throw new Error('Query failed');
        const entries: TimelineEntry[] = res.data.map(row => ({
            entity_id: String(row['entity_id'] ?? eid),
            entity_type: String(row['entity_type'] ?? tlEntityType.value),
            timestamp: String(row['timestamp'] ?? ''),
            state: row,
        }));
        tlEntries.value = entries;
        tmReachable.value = true;
    } catch (err) {
        tlError.value = err instanceof Error ? err.message : String(err);
    } finally {
        tlLoading.value = false;
    }
}

function clearTlTimer() {
    if (tlTimer) { clearInterval(tlTimer); tlTimer = null; }
}

function togglePlay() {
    if (tlPlaying.value) { clearTlTimer(); tlPlaying.value = false; return; }
    if (tlIdx.value >= tlEntries.value.length - 1) tlIdx.value = 0;
    tlPlaying.value = true;
    const interval = Math.max(100, 500 / tlSpeed.value);
    tlTimer = setInterval(() => {
        if (tlIdx.value >= tlEntries.value.length - 1) { clearTlTimer(); tlPlaying.value = false; return; }
        tlIdx.value++;
        publishFrame();
        scrollTlList();
    }, interval);
}

watch(tlSpeed, () => { if (tlPlaying.value) { clearTlTimer(); if (tlPlaying.value) { togglePlay(); } } });

function tlSeek(idx: number) {
    clearTlTimer(); tlPlaying.value = false;
    tlIdx.value = Math.max(0, Math.min(idx, tlEntries.value.length - 1));
    publishFrame();
}

function publishFrame() {
    const entry = tlEntries.value[tlIdx.value];
    if (!entry || !nc.value) return;
    try {
        const subject = `ent.${entry.entity_type || tlEntityType.value}.${entry.entity_id || tlEntityId.value}.replay`;
        nc.value.publish(subject, sc.encode(JSON.stringify(entry.state)));
        tlPublished.value++;
    } catch { /* ignore */ }
}

function scrollTlList() {
    if (!tlListEl.value) return;
    const items = tlListEl.value.querySelectorAll('.tm-tl-item');
    items[tlIdx.value]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function previewState(state: Record<string, unknown>): string {
    const keys = Object.keys(state).filter(k => k !== 'timestamp');
    const preview = keys.slice(0, 3).map(k => `${k}=${String(state[k]).slice(0, 15)}`).join(' ');
    return preview.slice(0, 60);
}

onUnmounted(() => { clearTlTimer(); });

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtElapsed(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(3)}s`;
}
function timeAgo(ts: number): string {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
}
function truncate(s: string, len: number): string {
    const flat = s.replace(/\s+/g, ' ').trim();
    return flat.length > len ? flat.slice(0, len) + '…' : flat;
}
</script>

<style scoped>
.tm { display:flex; flex-direction:column; height:100%; overflow:hidden; }
.tm-tabs { display:flex; align-items:center; gap:1px; padding:0 8px; border-bottom:1px solid rgba(255,255,255,0.07); min-height:34px; flex-shrink:0; overflow-x:auto; background:rgba(255,255,255,0.01); }
.tm-tabs::-webkit-scrollbar { height:0; }
.tm-tab { display:flex; align-items:center; gap:5px; padding:5px 10px; background:none; border:none; border-bottom:2px solid transparent; margin-bottom:-1px; color:rgba(255,255,255,0.4); font-size:11px; font-weight:500; cursor:pointer; white-space:nowrap; transition:color .12s; }
.tm-tab:hover { color:rgba(255,255,255,0.7); }
.tm-tab.active { color:#4a9eff; border-bottom-color:#4a9eff; }
.tm-spacer { flex:1; }
.tm-conn { display:flex; align-items:center; gap:5px; padding:0 4px; }
.tm-conn-dot { width:6px; height:6px; border-radius:50%; background:#444; flex-shrink:0; }
.tm-conn-dot.ok { background:#22c55e; box-shadow:0 0 4px #22c55e; }
.tm-body { flex:1; overflow:hidden; display:flex; flex-direction:column; }
.tm-acc  { color:#4a9eff; }
.tm-dim  { color:rgba(255,255,255,0.3); }
.tm-green { color:#22c55e; }
.tm-mono { font-family:monospace; font-size:11px; }
.tm-badge { font-size:10px; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.45); font-family:monospace; }
.tm-section-label { font-size:10px; font-weight:700; font-family:monospace; letter-spacing:0.07em; color:#e6edf3; }
.tm-icon-btn { background:none; border:none; color:rgba(255,255,255,0.35); cursor:pointer; padding:3px; border-radius:4px; display:flex; transition:all .12s; }
.tm-icon-btn:hover:not(:disabled) { color:#e6edf3; background:rgba(255,255,255,0.07); }
.tm-icon-btn:disabled { opacity:0.3; cursor:not-allowed; }
.tm-list { flex:1; overflow-y:auto; }
.tm-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:8px; color:rgba(255,255,255,0.3); font-size:11px; font-family:monospace; letter-spacing:0.06em; }
.tm-empty-icon { opacity:0.2; }
.tm-err { color:#f85149; font-size:10px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tm-panel-hd { display:flex; align-items:center; gap:8px; padding:7px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); }
.tm-stat { font-family:monospace; font-size:10px; color:rgba(255,255,255,0.4); }
@keyframes spin { to { transform:rotate(360deg); } }
.tm-spin { animation:spin 1s linear infinite; }

/* Query */
.tm-query-panel { flex:1; overflow:hidden; display:flex; flex-direction:column; }
.tm-editor-wrap { flex-shrink:0; }
.tm-editor-hd { display:flex; align-items:center; gap:7px; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); }
.tm-presets { display:flex; gap:3px; flex-wrap:wrap; }
.tm-preset-chip { padding:2px 7px; border-radius:4px; font-size:9px; font-family:monospace; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.4); transition:all .12s; letter-spacing:0.04em; }
.tm-preset-chip:hover { background:rgba(74,158,255,0.08); border-color:rgba(74,158,255,0.3); color:#4a9eff; }
.tm-textarea { width:100%; resize:none; background:rgba(0,0,0,0.3); border:none; border-bottom:1px solid rgba(255,255,255,0.07); color:#e6edf3; font-size:11px; padding:10px 12px; outline:none; line-height:1.6; }
.tm-textarea:focus { background:rgba(0,0,0,0.4); }
.tm-run-bar { display:flex; align-items:center; gap:10px; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); }
.tm-run-btn { display:flex; align-items:center; gap:5px; padding:5px 14px; border-radius:5px; font-size:11px; font-family:monospace; font-weight:700; letter-spacing:0.07em; cursor:pointer; background:rgba(74,158,255,0.12); border:1px solid rgba(74,158,255,0.3); color:#4a9eff; transition:all .12s; }
.tm-run-btn:disabled { opacity:0.35; cursor:not-allowed; }
.tm-run-btn:not(:disabled):hover { background:rgba(74,158,255,0.2); }
.tm-view-toggle { display:flex; gap:2px; margin-left:auto; }
.tm-view-btn { display:flex; align-items:center; gap:4px; padding:3px 8px; border-radius:4px; font-size:10px; font-family:monospace; cursor:pointer; border:1px solid rgba(255,255,255,0.08); background:transparent; color:rgba(255,255,255,0.4); transition:all .12s; }
.tm-view-btn.active { background:rgba(74,158,255,0.1); border-color:rgba(74,158,255,0.3); color:#4a9eff; }
.tm-results { flex:1; overflow:hidden; display:flex; flex-direction:column; }
.tm-table-wrap { flex:1; overflow:auto; }
.tm-table { border-collapse:collapse; width:100%; min-width:max-content; }
.tm-th { padding:6px 10px; font-size:10px; font-family:monospace; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:rgba(255,255,255,0.4); text-align:left; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.07); cursor:pointer; white-space:nowrap; user-select:none; }
.tm-th:hover { color:#e6edf3; }
.tm-sort-arrow { color:#4a9eff; margin-left:3px; }
.tm-tr:hover { background:rgba(255,255,255,0.02); }
.tm-td { padding:5px 10px; font-size:11px; font-family:monospace; color:#e6edf3; border-bottom:1px solid rgba(255,255,255,0.04); white-space:nowrap; max-width:300px; overflow:hidden; text-overflow:ellipsis; }
.tm-raw { flex:1; overflow:auto; padding:12px; font-size:10px; font-family:monospace; color:#e6edf3; line-height:1.5; margin:0; }

/* Schema */
.tm-schema-panel { flex:1; overflow:hidden; display:flex; }
.tm-schema-left { width:200px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; }
.tm-schema-right { flex:1; overflow:hidden; display:flex; flex-direction:column; }
.tm-schema-hd { display:flex; align-items:center; gap:6px; padding:7px 10px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); }
.tm-schema-search-wrap { position:relative; flex-shrink:0; padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.07); }
.tm-search-icon { position:absolute; left:15px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.3); }
.tm-search { width:100%; padding:4px 8px 4px 24px; border-radius:4px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); color:#e6edf3; font-size:11px; font-family:monospace; outline:none; }
.tm-search:focus { border-color:rgba(74,158,255,0.3); }
.tm-schema-err { padding:8px; font-size:10px; color:#f85149; font-family:monospace; }
.tm-table-list { flex:1; overflow-y:auto; }
.tm-table-btn { display:flex; align-items:center; gap:6px; width:100%; padding:6px 10px; background:transparent; border:none; cursor:pointer; text-align:left; color:rgba(255,255,255,0.5); font-size:11px; transition:all .1s; }
.tm-table-btn:hover { background:rgba(255,255,255,0.03); color:#e6edf3; }
.tm-table-btn.active { background:rgba(74,158,255,0.07); color:#4a9eff; border-left:2px solid #4a9eff; }
.tm-col-hdr { display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:5px 12px; border-bottom:1px solid rgba(255,255,255,0.07); font-size:9px; font-family:monospace; text-transform:uppercase; letter-spacing:0.07em; color:rgba(255,255,255,0.25); flex-shrink:0; }
.tm-col-list { flex:1; overflow-y:auto; }
.tm-col-row { display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:6px 12px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:11px; }
.tm-col-row:hover { background:rgba(255,255,255,0.02); }
.tm-type { color:rgba(255,255,255,0.35); font-size:10px; }

/* History */
.tm-hist-row { display:flex; align-items:flex-start; gap:8px; padding:7px 12px; border-bottom:1px solid rgba(255,255,255,0.05); transition:background .1s; }
.tm-hist-row:hover { background:rgba(255,255,255,0.02); }
.tm-hist-meta { display:flex; flex-direction:column; gap:2px; flex-shrink:0; min-width:80px; }
.tm-hist-sql { flex:1; background:none; border:none; cursor:pointer; text-align:left; font-size:10px; font-family:monospace; color:rgba(255,255,255,0.55); line-height:1.5; padding:0; transition:color .1s; }
.tm-hist-sql:hover { color:#e6edf3; }
.tm-hist-del { background:none; border:none; color:rgba(255,255,255,0.2); cursor:pointer; padding:2px; border-radius:3px; flex-shrink:0; transition:color .1s; display:flex; }
.tm-hist-del:hover { color:#f85149; }

/* Timeline */
.tm-tl-controls { flex-shrink:0; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; gap:8px; background:rgba(255,255,255,0.01); }
.tm-tl-row { display:flex; gap:8px; align-items:flex-end; }
.tm-field { display:flex; flex-direction:column; gap:3px; flex:1; }
.tm-label { font-size:9px; font-family:monospace; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.3); }
.tm-input { padding:5px 8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:5px; color:#e6edf3; font-size:11px; font-family:monospace; outline:none; }
.tm-input:focus { border-color:rgba(74,158,255,0.4); }
.tm-fetch-btn { display:flex; align-items:center; gap:5px; padding:5px 14px; border-radius:5px; font-size:11px; font-family:monospace; font-weight:700; letter-spacing:0.07em; cursor:pointer; background:rgba(74,158,255,0.1); border:1px solid rgba(74,158,255,0.25); color:#4a9eff; transition:all .12s; flex-shrink:0; height:32px; }
.tm-fetch-btn:disabled { opacity:0.35; cursor:not-allowed; }
.tm-fetch-btn:not(:disabled):hover { background:rgba(74,158,255,0.2); }
.tm-tl-playbar { display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); }
.tm-play-btn { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:5px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.6); cursor:pointer; transition:all .12s; flex-shrink:0; }
.tm-play-btn.primary { background:rgba(74,158,255,0.12); border-color:rgba(74,158,255,0.3); color:#4a9eff; }
.tm-play-btn:hover { background:rgba(255,255,255,0.1); color:#e6edf3; }
.tm-scrubber { flex:1; accent-color:#4a9eff; height:4px; cursor:pointer; }
.tm-speed-btns { display:flex; gap:2px; }
.tm-speed-btn { padding:2px 7px; border-radius:3px; font-size:10px; font-family:monospace; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.4); transition:all .12s; }
.tm-speed-btn.active { background:rgba(74,158,255,0.1); border-color:rgba(74,158,255,0.3); color:#4a9eff; }
.tm-nats-status { display:flex; align-items:center; gap:4px; }
.tm-tl-frame { flex-shrink:0; border-bottom:1px solid rgba(255,255,255,0.07); }
.tm-frame-hd { display:flex; align-items:center; gap:10px; padding:5px 12px; background:rgba(255,255,255,0.02); }
.tm-frame-data { max-height:140px; overflow-y:auto; margin:0; padding:8px 12px; font-size:10px; color:#e6edf3; line-height:1.5; background:rgba(0,0,0,0.25); }
.tm-tl-list { flex:1; overflow-y:auto; }
.tm-tl-item { display:flex; align-items:center; gap:8px; padding:5px 12px; border-bottom:1px solid rgba(255,255,255,0.03); cursor:pointer; transition:background .1s; }
.tm-tl-item:hover { background:rgba(255,255,255,0.03); }
.tm-tl-item.active { background:rgba(74,158,255,0.05); }
.tm-tl-dot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.15); flex-shrink:0; }
.tm-tl-dot.active { background:#4a9eff; box-shadow:0 0 5px #4a9eff; }
</style>
