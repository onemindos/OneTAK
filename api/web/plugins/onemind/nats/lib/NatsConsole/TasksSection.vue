<template>
    <div class="ts">
        <!-- Header -->
        <div class="ts-header">
            <span class="ts-title">Tasks</span>
            <span class="ts-badge">{{ taskList.length }}</span>
            <span
                v-if="taskList.length === 0"
                class="ts-muted"
            >Listening on ent.task.&gt; …</span>
            <div class="ts-tabs">
                <button
                    v-for="tab in TABS"
                    :key="tab.id"
                    class="ts-tab"
                    :class="{ active: activeTab === tab.id }"
                    @click="activeTab = tab.id"
                >
                    {{ tab.label }}
                </button>
            </div>
            <button
                class="ts-new-btn"
                @click="showCreate = true"
            >
                <Plus :size="12" /> New Task
            </button>
        </div>

        <!-- Board view -->
        <div
            v-if='activeTab === "board"'
            class="ts-board"
        >
            <div
                v-for="col in COLUMNS"
                :key="col.id"
                class="ts-col"
            >
                <div class="ts-col-hd">
                    <span
                        class="ts-col-title"
                        :class="col.id"
                    >{{ col.label }}</span>
                    <span class="ts-col-count ts-muted">{{ byStatus[col.id].length }}</span>
                </div>
                <div class="ts-col-body">
                    <div
                        v-for="task in byStatus[col.id]"
                        :key="task.id"
                        class="ts-task-card"
                        :class="{ selected: selectedId === task.id }"
                        @click="selectedId = selectedId === task.id ? null : task.id"
                    >
                        <div class="ts-task-hd">
                            <span class="ts-task-title">{{ task.title }}</span>
                            <span
                                class="ts-prio"
                                :class="task.priority"
                            >{{ task.priority[0].toUpperCase() }}</span>
                        </div>
                        <div
                            v-if="task.description"
                            class="ts-task-desc ts-muted"
                        >
                            {{ task.description }}
                        </div>
                        <div class="ts-task-meta">
                            <span
                                v-if="task.assigneeId"
                                class="ts-assignee ts-mono ts-muted"
                            >@{{ task.assigneeId }}</span>
                            <span
                                v-if="task.dueAt"
                                class="ts-due ts-mono ts-muted"
                                :class="{ overdue: isOverdue(task.dueAt) }"
                            >{{ fmtDue(task.dueAt) }}</span>
                            <span
                                v-if="task.tags.length > 0"
                                class="ts-tag ts-muted"
                            >{{ task.tags[0] }}</span>
                        </div>
                        <!-- Move buttons appear on selected -->
                        <div
                            v-if="selectedId === task.id"
                            class="ts-move-row"
                        >
                            <button
                                v-for="col2 in COLUMNS.filter(c => c.id !== task.status)"
                                :key="col2.id"
                                class="ts-move-btn"
                                :class="col2.id"
                                @click.stop="moveTask(task.id, col2.id)"
                            >
                                → {{ col2.label }}
                            </button>
                        </div>
                    </div>
                    <div
                        v-if="byStatus[col.id].length === 0"
                        class="ts-col-empty"
                    >
                        <span class="ts-muted">—</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Inbox view (all tasks, sorted by due date) -->
        <div
            v-if='activeTab === "inbox"'
            class="ts-inbox"
        >
            <div
                v-if="taskList.length === 0"
                class="ts-empty"
            >
                <span class="ts-empty-icon">📋</span>
                <span class="ts-muted">No tasks yet</span>
            </div>
            <div
                v-for="task in sortedTasks"
                :key="task.id"
                class="ts-inbox-row"
                :class="{ selected: selectedId === task.id }"
                @click="selectedId = selectedId === task.id ? null : task.id"
            >
                <div class="ts-inbox-left">
                    <div
                        class="ts-prio-dot"
                        :class="task.priority"
                    />
                    <div>
                        <div class="ts-inbox-title">
                            {{ task.title }}
                        </div>
                        <div
                            v-if="task.description"
                            class="ts-inbox-desc ts-muted"
                        >
                            {{ task.description }}
                        </div>
                    </div>
                </div>
                <div class="ts-inbox-right">
                    <span
                        class="ts-status-chip"
                        :class="task.status"
                    >{{ task.status.replace("_", " ") }}</span>
                    <span
                        v-if="task.dueAt"
                        class="ts-due ts-mono ts-muted"
                        :class="{ overdue: isOverdue(task.dueAt) }"
                    >{{ fmtDue(task.dueAt) }}</span>
                </div>
            </div>
        </div>

        <!-- Create modal -->
        <div
            v-if="showCreate"
            class="ts-modal-overlay"
            @click.self="showCreate = false"
        >
            <div class="ts-modal">
                <div class="ts-modal-hd">
                    <span class="ts-modal-title">New Task</span>
                    <button
                        class="ts-modal-close"
                        @click="showCreate = false"
                    >
                        <X :size="14" />
                    </button>
                </div>
                <div class="ts-modal-body">
                    <label class="ts-field-lbl">Title</label>
                    <input
                        v-model="newTask.title"
                        class="ts-input"
                        placeholder="Task title"
                    >
                    <label class="ts-field-lbl">Description</label>
                    <textarea
                        v-model="newTask.description"
                        class="ts-input ts-textarea"
                        placeholder="Optional description"
                        rows="2"
                    />
                    <label class="ts-field-lbl">Priority</label>
                    <div class="ts-prio-row">
                        <button
                            v-for="p in PRIORITIES"
                            :key="p"
                            class="ts-prio-btn"
                            :class="[p, { active: newTask.priority === p }]"
                            @click="newTask.priority = p"
                        >
                            {{ p }}
                        </button>
                    </div>
                    <label class="ts-field-lbl">Assignee (optional)</label>
                    <input
                        v-model="newTask.assigneeId"
                        class="ts-input"
                        placeholder="e.g. agent-id or user@email"
                    >
                </div>
                <div class="ts-modal-footer">
                    <button
                        class="ts-cancel-btn"
                        @click="showCreate = false"
                    >
                        Cancel
                    </button>
                    <button
                        class="ts-submit-btn"
                        :disabled="!newTask.title.trim()"
                        @click="createTask"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, reactive, watch, onUnmounted } from 'vue';
import { Plus, X } from 'lucide-vue-next';
import { useNatsStore } from '../stores/nats.store';
import type { Subscription } from 'nats.ws';

type TaskStatus   = 'backlog' | 'in_progress' | 'review' | 'done' | 'cancelled';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

interface Task {
    id: string; title: string; description?: string; status: TaskStatus;
    priority: TaskPriority; assigneeId?: string; missionId?: string;
    dueAt?: number; createdAt: number; updatedAt: number; tags: string[];
}

const COLUMNS: Array<{ id: TaskStatus; label: string }> = [
    { id: 'backlog',    label: 'Backlog' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'review',     label: 'Review' },
    { id: 'done',       label: 'Done' },
];
const TABS: Array<{ id: 'board' | 'inbox'; label: string }> = [
    { id: 'board', label: 'Board' },
    { id: 'inbox', label: 'Inbox' },
];
const PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
const STATUS_VALUES: TaskStatus[] = ['backlog', 'in_progress', 'review', 'done', 'cancelled'];

const { nc, sc } = useNatsStore();
const tasks       = ref<Map<string, Task>>(new Map());
const selectedId  = ref<string | null>(null);
const activeTab   = ref<'board' | 'inbox'>('board');
const showCreate  = ref(false);
const newTask     = reactive({ title: '', description: '', priority: 'medium' as TaskPriority, assigneeId: '' });

let subs: Subscription[] = [];

function parseTask(raw: unknown): Task | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.title !== 'string') return null;
    return {
        id: r.id, title: r.title,
        description: typeof r.description === 'string' ? r.description : undefined,
        status: STATUS_VALUES.includes(r.status as TaskStatus) ? (r.status as TaskStatus) : 'backlog',
        priority: ['critical','high','medium','low'].includes(r.priority as string) ? (r.priority as TaskPriority) : 'medium',
        assigneeId: typeof r.assigneeId === 'string' ? r.assigneeId : undefined,
        missionId: typeof r.missionId === 'string' ? r.missionId : undefined,
        dueAt: typeof r.dueAt === 'number' ? r.dueAt : undefined,
        createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
        updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : Date.now(),
        tags: Array.isArray(r.tags) ? (r.tags as string[]).filter(t => typeof t === 'string') : [],
    };
}

watch(nc, (conn) => {
    for (const s of subs) s.unsubscribe();
    subs = [];
    tasks.value = new Map();
    if (!conn) return;
    for (const subj of ['ent.task.>', 'evt.task.>']) {
        try {
            const sub = conn.subscribe(subj);
            subs.push(sub);
            (async () => {
                for await (const msg of sub) {
                    try {
                        const raw = JSON.parse(sc.decode(msg.data)) as Record<string, unknown>;
                        const task = parseTask(raw.task ?? raw);
                        if (task) {
                            const next = new Map(tasks.value);
                            next.set(task.id, { ...next.get(task.id), ...task });
                            tasks.value = next;
                        }
                    } catch { /* ignore */ }
                }
            })().catch(() => {});
        } catch { /* ignore */ }
    }
}, { immediate: true });

onUnmounted(() => { for (const s of subs) s.unsubscribe(); });

const taskList   = computed(() => [...tasks.value.values()]);
const sortedTasks = computed(() => [...taskList.value].sort((a, b) => {
    if (a.dueAt && b.dueAt) return a.dueAt - b.dueAt;
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return b.createdAt - a.createdAt;
}));
const byStatus   = computed<Record<TaskStatus, Task[]>>(() => {
    const r: Record<TaskStatus, Task[]> = { backlog:[], in_progress:[], review:[], done:[], cancelled:[] };
    for (const t of taskList.value) r[t.status].push(t);
    return r;
});

function moveTask(id: string, status: TaskStatus) {
    const task = tasks.value.get(id);
    if (!task) return;
    const updated = { ...task, status, updatedAt: Date.now() };
    const next = new Map(tasks.value);
    next.set(id, updated);
    tasks.value = next;
    selectedId.value = null;
    const conn = nc.value;
    if (conn) conn.publish(`cmd.task.${id}.move`, new TextEncoder().encode(JSON.stringify({ status })));
}

function createTask() {
    if (!newTask.title.trim()) return;
    const id = `task-${Date.now()}`;
    const task: Task = {
        id, title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        status: 'backlog', priority: newTask.priority,
        assigneeId: newTask.assigneeId.trim() || undefined,
        createdAt: Date.now(), updatedAt: Date.now(), tags: [],
    };
    const conn = nc.value;
    if (conn) conn.publish(`ent.task.${id}`, new TextEncoder().encode(JSON.stringify(task)));
    const next = new Map(tasks.value);
    next.set(id, task);
    tasks.value = next;
    newTask.title = ''; newTask.description = ''; newTask.priority = 'medium'; newTask.assigneeId = '';
    showCreate.value = false;
}

function isOverdue(dueAt: number): boolean { return dueAt < Date.now(); }
function fmtDue(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>

<style scoped>
.ts { display:flex; flex-direction:column; height:100%; overflow:hidden; }
.ts-header { display:flex; align-items:center; gap:8px; padding:7px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); }
.ts-title { font-size:12px; font-weight:600; color:rgba(255,255,255,0.6); }
.ts-badge { font-size:10px; padding:2px 7px; border-radius:4px; background:rgba(74,158,255,0.15); color:#4a9eff; border:1px solid rgba(74,158,255,0.25); font-weight:600; }
.ts-muted { color:rgba(255,255,255,0.35); font-size:11px; }
.ts-mono { font-family:monospace; }
.ts-tabs { margin-left:auto; display:flex; gap:2px; }
.ts-tab { padding:3px 10px; border-radius:4px; font-size:11px; font-weight:500; cursor:pointer; border:none; background:transparent; color:rgba(255,255,255,0.4); transition:all .12s; }
.ts-tab:hover { color:rgba(255,255,255,0.7); }
.ts-tab.active { background:#4a9eff; color:#000; }
.ts-new-btn { display:flex; align-items:center; gap:4px; padding:3px 10px; border-radius:5px; font-size:11px; font-weight:600; cursor:pointer; background:#4a9eff; color:#000; border:none; white-space:nowrap; }

/* Board */
.ts-board { display:flex; flex:1; gap:1px; overflow:hidden; background:rgba(255,255,255,0.03); }
.ts-col { flex:1; display:flex; flex-direction:column; overflow:hidden; background:rgba(13,17,23,0.98); border-right:1px solid rgba(255,255,255,0.05); }
.ts-col:last-child { border-right:none; }
.ts-col-hd { display:flex; align-items:center; gap:6px; padding:8px 10px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.ts-col-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:rgba(255,255,255,0.4); }
.ts-col-title.in_progress { color:#4a9eff; }
.ts-col-title.review { color:#f59e0b; }
.ts-col-title.done { color:#22c55e; }
.ts-col-count { font-size:10px; font-family:monospace; }
.ts-col-body { flex:1; overflow-y:auto; padding:6px; display:flex; flex-direction:column; gap:4px; }
.ts-col-empty { display:flex; align-items:center; justify-content:center; padding:16px; }
.ts-task-card { display:flex; flex-direction:column; gap:5px; padding:8px 10px; border-radius:7px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; text-align:left; width:100%; transition:all .12s; }
.ts-task-card:hover { background:rgba(255,255,255,0.06); }
.ts-task-card.selected { background:rgba(74,158,255,0.07); border-color:rgba(74,158,255,0.2); }
.ts-task-hd { display:flex; align-items:flex-start; gap:6px; }
.ts-task-title { font-size:12px; font-weight:500; color:#e6edf3; flex:1; line-height:1.3; }
.ts-prio { width:16px; height:16px; border-radius:3px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; }
.ts-prio.critical { background:rgba(248,81,73,0.2); color:#f85149; }
.ts-prio.high { background:rgba(245,158,11,0.2); color:#f59e0b; }
.ts-prio.medium { background:rgba(74,158,255,0.2); color:#4a9eff; }
.ts-prio.low { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.4); }
.ts-task-desc { font-size:10px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.ts-task-meta { display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
.ts-assignee { font-size:10px; }
.ts-due { font-size:10px; }
.ts-due.overdue { color:#f85149 !important; }
.ts-tag { font-size:10px; padding:1px 5px; border-radius:3px; background:rgba(255,255,255,0.05); }
.ts-move-row { display:flex; gap:3px; flex-wrap:wrap; margin-top:2px; }
.ts-move-btn { padding:2px 7px; border-radius:3px; font-size:10px; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.5); transition:all .12s; white-space:nowrap; }
.ts-move-btn:hover { background:rgba(255,255,255,0.1); color:#e6edf3; }
.ts-move-btn.done { border-color:rgba(34,197,94,0.3); color:#22c55e; }
.ts-move-btn.in_progress { border-color:rgba(74,158,255,0.3); color:#4a9eff; }
.ts-move-btn.review { border-color:rgba(245,158,11,0.3); color:#f59e0b; }

/* Inbox */
.ts-inbox { flex:1; overflow-y:auto; }
.ts-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:8px; }
.ts-empty-icon { font-size:28px; opacity:0.25; }
.ts-inbox-row { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background .12s; }
.ts-inbox-row:hover { background:rgba(255,255,255,0.03); }
.ts-inbox-row.selected { background:rgba(74,158,255,0.07); }
.ts-inbox-left { display:flex; align-items:flex-start; gap:8px; flex:1; min-width:0; }
.ts-prio-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:3px; }
.ts-prio-dot.critical { background:#f85149; }
.ts-prio-dot.high { background:#f59e0b; }
.ts-prio-dot.medium { background:#4a9eff; }
.ts-prio-dot.low { background:#555; }
.ts-inbox-title { font-size:12px; font-weight:500; color:#e6edf3; }
.ts-inbox-desc { font-size:11px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:300px; }
.ts-inbox-right { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
.ts-status-chip { font-size:10px; padding:2px 7px; border-radius:4px; font-weight:500; text-transform:capitalize; background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.4); }
.ts-status-chip.in_progress { background:rgba(74,158,255,0.12); color:#4a9eff; }
.ts-status-chip.review { background:rgba(245,158,11,0.12); color:#f59e0b; }
.ts-status-chip.done { background:rgba(34,197,94,0.12); color:#22c55e; }
.ts-status-chip.cancelled { opacity:0.5; text-decoration:line-through; }

/* Modal */
.ts-modal-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:100; }
.ts-modal { background:#0d1117; border:1px solid rgba(255,255,255,0.12); border-radius:10px; width:360px; display:flex; flex-direction:column; }
.ts-modal-hd { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.07); }
.ts-modal-title { font-size:13px; font-weight:700; color:#e6edf3; }
.ts-modal-close { background:none; border:none; color:rgba(255,255,255,0.4); cursor:pointer; display:flex; padding:2px; border-radius:4px; }
.ts-modal-close:hover { color:#e6edf3; }
.ts-modal-body { padding:14px; display:flex; flex-direction:column; gap:8px; }
.ts-field-lbl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:rgba(255,255,255,0.4); }
.ts-input { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#e6edf3; font-size:12px; padding:7px 10px; outline:none; width:100%; font-family:inherit; }
.ts-input:focus { border-color:rgba(74,158,255,0.4); }
.ts-textarea { resize:none; }
.ts-prio-row { display:flex; gap:5px; }
.ts-prio-btn { flex:1; padding:5px; border-radius:5px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.4); text-transform:capitalize; transition:all .12s; }
.ts-prio-btn.critical.active { background:rgba(248,81,73,0.2); border-color:#f85149; color:#f85149; }
.ts-prio-btn.high.active     { background:rgba(245,158,11,0.2); border-color:#f59e0b; color:#f59e0b; }
.ts-prio-btn.medium.active   { background:rgba(74,158,255,0.2); border-color:#4a9eff; color:#4a9eff; }
.ts-prio-btn.low.active      { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); color:#e6edf3; }
.ts-modal-footer { display:flex; justify-content:flex-end; gap:8px; padding:10px 14px; border-top:1px solid rgba(255,255,255,0.07); }
.ts-cancel-btn { padding:5px 14px; border-radius:5px; font-size:12px; cursor:pointer; background:transparent; border:1px solid rgba(255,255,255,0.12); color:rgba(255,255,255,0.5); }
.ts-submit-btn { padding:5px 14px; border-radius:5px; font-size:12px; font-weight:600; cursor:pointer; background:#4a9eff; border:none; color:#000; transition:opacity .15s; }
.ts-submit-btn:disabled { opacity:0.35; cursor:not-allowed; }
</style>
