<template>
    <div class='ms'>
        <!-- Header -->
        <div class='ms-header'>
            <span class='ms-title'>Missions</span>
            <div class='ms-badges'>
                <span
                    v-if='activeCount > 0'
                    class='ms-badge active'
                >{{ activeCount }} active</span>
                <span
                    v-if='plannedCount > 0'
                    class='ms-badge planned'
                >{{ plannedCount }} planned</span>
                <span
                    v-if='missions.size === 0'
                    class='ms-muted'
                >Listening on ent.mission.&gt; …</span>
            </div>
            <span class='ms-muted ms-mono ms-ml'>{{ missions.size }} total</span>
            <button
                class='ms-new-btn'
                @click='showCreate = true'
            >
                <Plus :size='12' /> New
            </button>
        </div>

        <div class='ms-body'>
            <!-- Left: list -->
            <div class='ms-list-panel'>
                <div class='ms-filter-tabs'>
                    <button
                        v-for='f in FILTERS'
                        :key='f.value'
                        class='ms-filter-tab'
                        :class='{ active: filter === f.value }'
                        @click='filter = f.value'
                    >
                        {{ f.label }}
                    </button>
                </div>

                <div class='ms-list'>
                    <div
                        v-if='filteredList.length === 0'
                        class='ms-empty'
                    >
                        <span class='ms-muted'>No missions{{ filter !== "all" ? ` with status "${filter}"` : "" }}</span>
                    </div>
                    <button
                        v-for='m in filteredList'
                        :key='m.id'
                        class='ms-mission-card'
                        :class='{ selected: selectedId === m.id }'
                        @click='selectedId = selectedId === m.id ? null : m.id'
                    >
                        <div class='ms-card-top'>
                            <span class='ms-mission-name'>{{ m.name }}</span>
                            <span
                                class='ms-status-dot'
                                :class='m.status'
                            />
                        </div>
                        <div class='ms-card-obj ms-muted'>
                            {{ m.objective }}
                        </div>
                        <div class='ms-card-meta'>
                            <span
                                class='ms-priority'
                                :class='m.priority'
                            >{{ m.priority }}</span>
                            <span class='ms-muted ms-mono'>{{ m.tasks.length }} task{{ m.tasks.length !== 1 ? "s" : "" }}</span>
                            <span class='ms-muted ms-mono ms-ml'>{{ relTime(m.createdAt) }}</span>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Right: detail -->
            <div class='ms-detail'>
                <template v-if='selectedMission'>
                    <div class='ms-detail-hd'>
                        <div>
                            <div class='ms-detail-name'>
                                {{ selectedMission.name }}
                            </div>
                            <div class='ms-muted'>
                                {{ selectedMission.objective }}
                            </div>
                        </div>
                        <span
                            class='ms-status-pill'
                            :class='selectedMission.status'
                        >{{ selectedMission.status }}</span>
                    </div>
                    <div class='ms-detail-body'>
                        <div class='ms-section'>
                            <div class='ms-section-title'>
                                Details
                            </div>
                            <div class='ms-kv-grid'>
                                <div class='ms-kv'>
                                    <span class='ms-muted'>Priority</span><span
                                        class='ms-priority'
                                        :class='selectedMission.priority'
                                    >{{ selectedMission.priority }}</span>
                                </div>
                                <div class='ms-kv'>
                                    <span class='ms-muted'>Created</span><span class='ms-mono'>{{ relTime(selectedMission.createdAt) }}</span>
                                </div>
                                <div
                                    v-if='selectedMission.startedAt'
                                    class='ms-kv'
                                >
                                    <span class='ms-muted'>Started</span><span class='ms-mono'>{{ relTime(selectedMission.startedAt) }}</span>
                                </div>
                                <div
                                    v-if='selectedMission.completedAt'
                                    class='ms-kv'
                                >
                                    <span class='ms-muted'>Completed</span><span class='ms-mono'>{{ relTime(selectedMission.completedAt) }}</span>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if='selectedMission.actors.length > 0'
                            class='ms-section'
                        >
                            <div class='ms-section-title'>
                                Actors
                            </div>
                            <div class='ms-actors'>
                                <span
                                    v-for='a in selectedMission.actors'
                                    :key='a'
                                    class='ms-actor'
                                >{{ a }}</span>
                            </div>
                        </div>

                        <div
                            v-if='selectedMission.tasks.length > 0'
                            class='ms-section'
                        >
                            <div class='ms-section-title'>
                                Tasks ({{ selectedMission.tasks.length }})
                            </div>
                            <div class='ms-task-list'>
                                <div
                                    v-for='t in selectedMission.tasks'
                                    :key='t.id'
                                    class='ms-task-row'
                                >
                                    <div
                                        class='ms-task-dot'
                                        :class='t.status'
                                    />
                                    <span class='ms-task-name'>{{ t.name }}</span>
                                    <span
                                        v-if='t.assignedTo'
                                        class='ms-muted ms-mono'
                                    >{{ t.assignedTo }}</span>
                                    <span class='ms-task-status ms-muted'>{{ t.status }}</span>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if='selectedMission.tags.length > 0'
                            class='ms-section'
                        >
                            <div class='ms-section-title'>
                                Tags
                            </div>
                            <div class='ms-tags'>
                                <span
                                    v-for='tag in selectedMission.tags'
                                    :key='tag'
                                    class='ms-tag'
                                >{{ tag }}</span>
                            </div>
                        </div>
                    </div>
                </template>
                <div
                    v-else
                    class='ms-detail-empty'
                >
                    <span class='ms-empty-icon'>🎯</span>
                    <span class='ms-muted'>Select a mission to view details</span>
                </div>
            </div>
        </div>

        <!-- Create modal -->
        <div
            v-if='showCreate'
            class='ms-modal-overlay'
            @click.self='showCreate = false'
        >
            <div class='ms-modal'>
                <div class='ms-modal-hd'>
                    <span class='ms-modal-title'>New Mission</span>
                    <button
                        class='ms-modal-close'
                        @click='showCreate = false'
                    >
                        <X :size='14' />
                    </button>
                </div>
                <div class='ms-modal-body'>
                    <label class='ms-field-lbl'>Name</label>
                    <input
                        v-model='newMission.name'
                        class='ms-input'
                        placeholder='Mission name'
                    >
                    <label class='ms-field-lbl'>Objective</label>
                    <textarea
                        v-model='newMission.objective'
                        class='ms-input ms-textarea'
                        placeholder='Mission objective'
                        rows='2'
                    />
                    <label class='ms-field-lbl'>Priority</label>
                    <div class='ms-priority-row'>
                        <button
                            v-for='p in PRIORITIES'
                            :key='p'
                            class='ms-priority-btn'
                            :class='[p, { active: newMission.priority === p }]'
                            @click='newMission.priority = p'
                        >
                            {{ p }}
                        </button>
                    </div>
                </div>
                <div class='ms-modal-footer'>
                    <button
                        class='ms-cancel-btn'
                        @click='showCreate = false'
                    >
                        Cancel
                    </button>
                    <button
                        class='ms-submit-btn'
                        :disabled='!newMission.name.trim()'
                        @click='createMission'
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

type MissionStatus = 'planned' | 'active' | 'completed' | 'aborted' | 'paused';
type TaskStatus    = 'pending' | 'active' | 'completed' | 'failed' | 'blocked';
type Priority      = 'critical' | 'high' | 'medium' | 'low';

interface MissionTask { id: string; name: string; status: TaskStatus; assignedTo?: string; }
interface Mission {
    id: string; name: string; objective: string; status: MissionStatus;
    priority: Priority; actors: string[]; tasks: MissionTask[];
    createdAt: number; startedAt?: number; completedAt?: number; tags: string[];
}

const FILTERS: Array<{ label: string; value: MissionStatus | 'all' }> = [
    { label: 'All', value: 'all' }, { label: 'Active', value: 'active' },
    { label: 'Planned', value: 'planned' }, { label: 'Completed', value: 'completed' },
    { label: 'Aborted', value: 'aborted' },
];
const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];

const { nc, sc } = useNatsStore();
const missions  = ref<Map<string, Mission>>(new Map());
const selectedId = ref<string | null>(null);
const filter    = ref<MissionStatus | 'all'>('all');
const showCreate = ref(false);
const newMission = reactive({ name: '', objective: '', priority: 'medium' as Priority });

let subs: Subscription[] = [];

watch(nc, (conn) => {
    for (const s of subs) s.unsubscribe();
    subs = [];
    missions.value = new Map();
    if (!conn) return;
    for (const subj of ['ent.mission.>', 'evt.mission.>']) {
        try {
            const sub = conn.subscribe(subj);
            subs.push(sub);
            (async () => {
                for await (const msg of sub) {
                    try {
                        const parsed = JSON.parse(sc.decode(msg.data)) as Mission;
                        if (parsed?.id) {
                            const next = new Map(missions.value);
                            next.set(parsed.id, { ...next.get(parsed.id), ...parsed });
                            missions.value = next;
                        }
                    } catch { /* ignore */ }
                }
            })().catch(() => {});
        } catch { /* ignore */ }
    }
}, { immediate: true });

onUnmounted(() => { for (const s of subs) s.unsubscribe(); });

const missionList   = computed(() => [...missions.value.values()]);
const filteredList  = computed(() =>
    filter.value === 'all' ? missionList.value : missionList.value.filter(m => m.status === filter.value)
);
const selectedMission = computed(() => selectedId.value ? missions.value.get(selectedId.value) ?? null : null);
const activeCount     = computed(() => missionList.value.filter(m => m.status === 'active').length);
const plannedCount    = computed(() => missionList.value.filter(m => m.status === 'planned').length);

function relTime(ts: number): string {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
}

function createMission() {
    const conn = nc.value;
    if (!newMission.name.trim()) return;
    const id = `mission-${Date.now()}`;
    const mission: Mission = {
        id, name: newMission.name.trim(), objective: newMission.objective.trim(),
        status: 'planned', priority: newMission.priority, actors: [], tasks: [],
        createdAt: Date.now(), tags: [],
    };
    if (conn) {
        conn.publish(`ent.mission.${id}`, new TextEncoder().encode(JSON.stringify(mission)));
    }
    const next = new Map(missions.value);
    next.set(id, mission);
    missions.value = next;
    newMission.name = ''; newMission.objective = ''; newMission.priority = 'medium';
    showCreate.value = false;
    selectedId.value = id;
}
</script>

<style scoped>
.ms { display:flex; flex-direction:column; height:100%; overflow:hidden; }
.ms-header { display:flex; align-items:center; gap:8px; padding:7px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); }
.ms-title { font-size:12px; font-weight:600; color:rgba(255,255,255,0.6); }
.ms-badges { display:flex; gap:5px; align-items:center; }
.ms-badge { font-size:10px; padding:2px 7px; border-radius:4px; font-weight:600; }
.ms-badge.active  { background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.25); }
.ms-badge.planned { background:rgba(74,158,255,0.15); color:#4a9eff; border:1px solid rgba(74,158,255,0.25); }
.ms-muted { color:rgba(255,255,255,0.35); font-size:11px; }
.ms-mono { font-family:monospace; }
.ms-ml { margin-left:auto; }
.ms-new-btn { display:flex; align-items:center; gap:4px; padding:3px 10px; border-radius:5px; font-size:11px; font-weight:600; cursor:pointer; background:#4a9eff; color:#000; border:none; }
.ms-body { display:flex; flex:1; overflow:hidden; }
.ms-list-panel { width:300px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; overflow:hidden; }
.ms-filter-tabs { display:flex; gap:2px; padding:6px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; flex-wrap:wrap; }
.ms-filter-tab { padding:3px 9px; border-radius:4px; font-size:10px; font-weight:500; cursor:pointer; border:none; background:transparent; color:rgba(255,255,255,0.4); transition:all .12s; }
.ms-filter-tab:hover { color:rgba(255,255,255,0.7); }
.ms-filter-tab.active { background:#4a9eff; color:#000; }
.ms-list { flex:1; overflow-y:auto; }
.ms-empty { padding:20px; text-align:center; }
.ms-mission-card { display:flex; flex-direction:column; gap:5px; padding:9px 12px; border-bottom:1px solid rgba(255,255,255,0.04); border-left:2px solid transparent; cursor:pointer; text-align:left; width:100%; background:transparent; transition:all .12s; }
.ms-mission-card:hover { background:rgba(255,255,255,0.03); }
.ms-mission-card.selected { background:rgba(74,158,255,0.07); border-left-color:#4a9eff; }
.ms-card-top { display:flex; align-items:center; gap:6px; }
.ms-mission-name { font-size:12px; font-weight:600; color:#e6edf3; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ms-status-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; background:#555; }
.ms-status-dot.active    { background:#22c55e; box-shadow:0 0 4px #22c55e; }
.ms-status-dot.planned   { background:#4a9eff; }
.ms-status-dot.completed { background:#818cf8; }
.ms-status-dot.aborted   { background:#f85149; }
.ms-status-dot.paused    { background:#f59e0b; }
.ms-card-obj { font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ms-card-meta { display:flex; align-items:center; gap:6px; }
.ms-priority { font-size:10px; font-weight:600; padding:1px 5px; border-radius:3px; text-transform:uppercase; }
.ms-priority.critical { background:rgba(248,81,73,0.15); color:#f85149; }
.ms-priority.high     { background:rgba(245,158,11,0.15); color:#f59e0b; }
.ms-priority.medium   { background:rgba(74,158,255,0.15); color:#4a9eff; }
.ms-priority.low      { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.4); }
/* Detail */
.ms-detail { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.ms-detail-hd { display:flex; align-items:flex-start; gap:10px; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.ms-detail-name { font-size:13px; font-weight:700; color:#e6edf3; }
.ms-status-pill { flex-shrink:0; padding:3px 10px; border-radius:10px; font-size:10px; font-weight:600; text-transform:capitalize; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.4); background:rgba(255,255,255,0.05); }
.ms-status-pill.active { background:rgba(34,197,94,0.12); border-color:rgba(34,197,94,0.25); color:#22c55e; }
.ms-status-pill.planned { background:rgba(74,158,255,0.12); border-color:rgba(74,158,255,0.25); color:#4a9eff; }
.ms-detail-body { flex:1; overflow-y:auto; padding:12px 14px; display:flex; flex-direction:column; gap:14px; }
.ms-section-title { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:rgba(255,255,255,0.3); margin-bottom:6px; }
.ms-kv-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:6px; }
.ms-kv { display:flex; flex-direction:column; gap:2px; }
.ms-actors { display:flex; flex-wrap:wrap; gap:4px; }
.ms-actor { font-size:11px; font-family:monospace; padding:2px 7px; border-radius:4px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); }
.ms-task-list { display:flex; flex-direction:column; gap:4px; }
.ms-task-row { display:flex; align-items:center; gap:7px; padding:4px 0; }
.ms-task-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; background:#555; }
.ms-task-dot.completed { background:#22c55e; } .ms-task-dot.active { background:#4a9eff; } .ms-task-dot.failed { background:#f85149; } .ms-task-dot.pending { background:#555; }
.ms-task-name { font-size:11px; color:#e6edf3; flex:1; }
.ms-task-status { font-size:10px; text-transform:capitalize; }
.ms-tags { display:flex; flex-wrap:wrap; gap:4px; }
.ms-tag { font-size:10px; padding:2px 6px; border-radius:3px; background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.45); }
.ms-detail-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:8px; }
.ms-empty-icon { font-size:28px; opacity:0.25; }
/* Modal */
.ms-modal-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:100; }
.ms-modal { background:#0d1117; border:1px solid rgba(255,255,255,0.12); border-radius:10px; width:360px; display:flex; flex-direction:column; }
.ms-modal-hd { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.07); }
.ms-modal-title { font-size:13px; font-weight:700; color:#e6edf3; }
.ms-modal-close { background:none; border:none; color:rgba(255,255,255,0.4); cursor:pointer; display:flex; padding:2px; border-radius:4px; }
.ms-modal-close:hover { color:#e6edf3; }
.ms-modal-body { padding:14px; display:flex; flex-direction:column; gap:8px; }
.ms-field-lbl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:rgba(255,255,255,0.4); }
.ms-input { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#e6edf3; font-size:12px; padding:7px 10px; outline:none; width:100%; font-family:inherit; }
.ms-input:focus { border-color:rgba(74,158,255,0.4); }
.ms-textarea { resize:none; }
.ms-priority-row { display:flex; gap:5px; }
.ms-priority-btn { flex:1; padding:5px; border-radius:5px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.4); text-transform:capitalize; transition:all .12s; }
.ms-priority-btn.critical.active { background:rgba(248,81,73,0.2); border-color:#f85149; color:#f85149; }
.ms-priority-btn.high.active     { background:rgba(245,158,11,0.2); border-color:#f59e0b; color:#f59e0b; }
.ms-priority-btn.medium.active   { background:rgba(74,158,255,0.2); border-color:#4a9eff; color:#4a9eff; }
.ms-priority-btn.low.active      { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); color:#e6edf3; }
.ms-modal-footer { display:flex; justify-content:flex-end; gap:8px; padding:10px 14px; border-top:1px solid rgba(255,255,255,0.07); }
.ms-cancel-btn { padding:5px 14px; border-radius:5px; font-size:12px; cursor:pointer; background:transparent; border:1px solid rgba(255,255,255,0.12); color:rgba(255,255,255,0.5); }
.ms-submit-btn { padding:5px 14px; border-radius:5px; font-size:12px; font-weight:600; cursor:pointer; background:#4a9eff; border:none; color:#000; transition:opacity .15s; }
.ms-submit-btn:disabled { opacity:0.35; cursor:not-allowed; }
</style>
