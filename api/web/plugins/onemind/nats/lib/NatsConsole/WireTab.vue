<template>
    <div class='wire-root'>
        <!-- ── Toolbar ──────────────────────────────────────────────────────── -->
        <div class='wire-toolbar'>
            <Radio
                :size='14'
                class='wire-icon'
            />
            <span class='wire-title'>Wire</span>
            <span class='wire-subtitle'>live NATS tap</span>

            <!-- Subject input -->
            <div class='wire-subject-row'>
                <input
                    v-model='newSubject'
                    class='wire-input'
                    placeholder='subject pattern (e.g. agents.> or >)'
                    @keydown.enter='addSubscription'
                >
                <button
                    class='wire-btn wire-btn-add'
                    :disabled='!newSubject.trim() || !nc'
                    @click='addSubscription'
                >
                    <Plus :size='13' />
                </button>
            </div>

            <!-- Active subscriptions -->
            <div
                v-if='subscriptions.length'
                class='wire-subs'
            >
                <div
                    v-for='sub in subscriptions'
                    :key='sub'
                    class='wire-sub-tag'
                >
                    <span>{{ sub }}</span>
                    <button
                        class='wire-sub-remove'
                        @click='removeSubscription(sub)'
                    >
                        <X :size='10' />
                    </button>
                </div>
            </div>

            <!-- Controls -->
            <div class='wire-controls'>
                <span class='wire-count'>{{ frames.length }} frames</span>
                <button
                    class='wire-btn'
                    :class='{ active: paused }'
                    title='Pause'
                    @click='paused = !paused'
                >
                    <Pause
                        v-if='!paused'
                        :size='13'
                    />
                    <Play
                        v-else
                        :size='13'
                    />
                </button>
                <button
                    class='wire-btn'
                    title='Clear'
                    @click='clearFrames'
                >
                    <Trash2 :size='13' />
                </button>
                <!-- Badge filter -->
                <div class='wire-badge-filter'>
                    <button
                        v-for='b in ALL_BADGES'
                        :key='b'
                        class='wire-badge-toggle'
                        :class='{ inactive: !activeBadges.has(b) }'
                        :style='{ color: BADGE_STYLE[b].color, background: activeBadges.has(b) ? BADGE_STYLE[b].bg : "transparent" }'
                        @click='toggleBadge(b)'
                    >
                        {{ b }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ── No connection notice ─────────────────────────────────────────── -->
        <div
            v-if='!nc'
            class='wire-empty'
        >
            <Radio
                :size='28'
                style='opacity:0.3'
            />
            <p>Not connected to NATS.<br>Open NATS Console settings to connect.</p>
        </div>

        <!-- ── No subscriptions notice ─────────────────────────────────────── -->
        <div
            v-else-if='!subscriptions.length'
            class='wire-empty'
        >
            <Radio
                :size='28'
                style='opacity:0.3'
            />
            <p>
                Add a subject pattern above to start tapping.<br>
                Try <code>></code> for everything or <code>agents.></code> for agents.
            </p>
        </div>

        <!-- ── Frame list ───────────────────────────────────────────────────── -->
        <div
            v-else
            ref='framesEl'
            class='wire-frames'
        >
            <WireFrame
                v-for='frame in filteredFrames'
                :key='frame.id'
                :frame='frame'
            />
            <div
                v-if='!filteredFrames.length'
                class='wire-empty-small'
            >
                No frames matching current badge filter.
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, watch, nextTick } from 'vue';
import { Radio, Trash2, Pause, Play, Plus, X } from 'lucide-vue-next';
import { useNatsStore }  from '../stores/nats.store';
import { useNatsTap }    from '../composables/useNatsTap';
import type { TapFrame } from '../composables/useNatsTap';
import WireFrame         from './WireFrame.vue';
import type { Badge }    from './wire.types';
import { ALL_BADGES, BADGE_STYLE, inferBadge } from './wire.types';

// ── State ─────────────────────────────────────────────────────────────────────
const { nc }         = useNatsStore();
const { frames, paused, subscribe, unsubscribe, clear } = useNatsTap(1000);

const newSubject     = ref('');
const subscriptions  = ref<string[]>([]);
const activeBadges   = ref<Set<Badge>>(new Set(ALL_BADGES));
const framesEl       = ref<HTMLElement | null>(null);

// ── Computed ──────────────────────────────────────────────────────────────────
const filteredFrames = computed(() =>
    frames.value.filter((f: TapFrame) => activeBadges.value.has(inferBadge(f.subject)))
);

// ── Actions ───────────────────────────────────────────────────────────────────
function addSubscription(): void {
    const pat = newSubject.value.trim();
    if (!pat || subscriptions.value.includes(pat)) return;
    subscriptions.value = [...subscriptions.value, pat];
    subscribe(pat);
    newSubject.value = '';
}

function removeSubscription(pat: string): void {
    subscriptions.value = subscriptions.value.filter(s => s !== pat);
    unsubscribe(pat);
}

function clearFrames(): void {
    clear();
}

function toggleBadge(badge: Badge): void {
    const next = new Set(activeBadges.value);
    if (next.has(badge)) { next.delete(badge); } else { next.add(badge); }
    activeBadges.value = next;
}

// ── Auto-scroll when not paused ───────────────────────────────────────────────
watch(
    () => frames.value.length,
    () => {
        if (!paused.value) {
            nextTick(() => {
                if (framesEl.value) framesEl.value.scrollTop = 0;
            });
        }
    }
);
</script>

<style scoped>
.wire-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--cloudtak-panel-bg, rgba(13,17,23,0.98));
    color: #e6edf3;
    font-size: 12px;
}

/* Toolbar */
.wire-toolbar {
    flex-shrink: 0;
    padding: 10px 12px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    display: flex;
    flex-direction: column;
    gap: 7px;
}
.wire-title-row { display: flex; align-items: center; gap: 6px; }
.wire-icon { color: #4a9eff; flex-shrink: 0; }
.wire-title { font-weight: 700; font-size: 13px; letter-spacing: 0.02em; }
.wire-subtitle { font-size: 11px; color: rgba(255,255,255,0.35); margin-left: 2px; }

.wire-subject-row { display: flex; gap: 5px; }
.wire-input {
    flex: 1;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #e6edf3;
    padding: 5px 9px;
    font-size: 12px;
    font-family: monospace;
    outline: none;
    transition: border-color .15s;
}
.wire-input:focus { border-color: #4a9eff; }
.wire-input::placeholder { color: rgba(255,255,255,0.25); }

.wire-subs { display: flex; flex-wrap: wrap; gap: 4px; }
.wire-sub-tag {
    display: flex; align-items: center; gap: 4px;
    background: rgba(74,158,255,0.12);
    border: 1px solid rgba(74,158,255,0.25);
    border-radius: 4px;
    padding: 2px 7px;
    font-family: monospace; font-size: 11px; color: #4a9eff;
}
.wire-sub-remove {
    background: none; border: none; color: rgba(74,158,255,0.6);
    cursor: pointer; padding: 0; display: flex; align-items: center;
}
.wire-sub-remove:hover { color: #f85149; }

.wire-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.wire-count { font-size: 11px; color: rgba(255,255,255,0.3); margin-right: 4px; }

.wire-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 5px;
    color: rgba(255,255,255,0.6);
    padding: 3px 7px;
    cursor: pointer;
    display: flex; align-items: center; gap: 3px;
    font-size: 11px;
    transition: background .12s, color .12s;
}
.wire-btn:hover { background: rgba(255,255,255,0.1); color: #e6edf3; }
.wire-btn.active { background: rgba(74,158,255,0.15); color: #4a9eff; border-color: rgba(74,158,255,0.3); }
.wire-btn:disabled { opacity: 0.3; cursor: default; }
.wire-btn-add { background: rgba(74,158,255,0.15); color: #4a9eff; border-color: rgba(74,158,255,0.3); }

.wire-badge-filter { display: flex; gap: 3px; flex-wrap: wrap; }
.wire-badge-toggle {
    border: 1px solid transparent;
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity .12s;
    font-family: monospace;
}
.wire-badge-toggle.inactive { opacity: 0.25; background: transparent !important; }

/* Empty states */
.wire-empty {
    flex: 1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; opacity: 0.4; text-align: center;
    color: rgba(255,255,255,0.5); line-height: 1.6;
}
.wire-empty code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 3px; }
.wire-empty-small { text-align: center; padding: 24px; color: rgba(255,255,255,0.3); }

/* Frames container */
.wire-frames {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}
.wire-frames::-webkit-scrollbar { width: 4px; }
.wire-frames::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
</style>
