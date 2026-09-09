<template>
    <div class='ig'>
        <div class='ig-header'>
            <Link2
                :size='14'
                class='ig-accent'
            />
            <span class='ig-title'>Integrations</span>
            <span class='ig-sub'>Services connected to the NATS bus</span>
        </div>

        <div class='ig-grid'>
            <div
                v-for='i in INTEGRATIONS'
                :key='i.id'
                class='ig-card'
                :style='{ borderColor: statusMap.get(i.id)?.active ? `${i.color}44` : "rgba(255,255,255,0.07)" }'
            >
                <div class='ig-card-top'>
                    <div
                        class='ig-icon'
                        :style='{ background: `${i.color}18`, color: i.color }'
                    >
                        <component
                            :is='i.icon'
                            :size='18'
                        />
                    </div>
                    <div class='ig-info'>
                        <div class='ig-name'>
                            {{ i.name }}
                        </div>
                        <div class='ig-desc'>
                            {{ i.description }}
                        </div>
                    </div>
                    <button
                        v-if='i.url'
                        class='ig-open'
                        :title='`Open ${i.name}`'
                        @click='openUrl(i.url)'
                    >
                        <ExternalLink :size='13' />
                    </button>
                </div>

                <div class='ig-meta'>
                    <div class='ig-status-row'>
                        <div
                            class='ig-dot'
                            :class='{ glow: statusMap.get(i.id)?.active }'
                            :style='{ background: statusMap.get(i.id)?.active ? "#43e27d" : nc ? "#555" : "#333" }'
                        />
                        <span class='ig-muted'>
                            {{ statusMap.get(i.id)?.active ? 'Active' : nc ? 'No traffic' : 'Offline' }}
                        </span>
                    </div>
                    <span class='ig-subject'>{{ i.subjectPrefix }}.&gt;</span>
                    <span
                        v-if='(statusMap.get(i.id)?.msgCount ?? 0) > 0'
                        class='ig-count ig-muted'
                    >
                        {{ statusMap.get(i.id)?.msgCount }} msgs
                    </span>
                </div>
            </div>
        </div>

        <div class='ig-hint'>
            <p>Any NATS service publishing to the subject grammar (tel.*, cmd.*, evt.*, ent.*) appears here automatically.</p>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, watch, onUnmounted } from 'vue';
import { Link2, ExternalLink, Home, Crosshair, Camera, Plane, Globe2 } from 'lucide-vue-next';
import { useNatsStore } from '../stores/nats.store';
import type { Component } from 'vue';
import type { Subscription } from 'nats.ws';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: Component;
    subjectPrefix: string;
    url?: string;
    color: string;
}

const INTEGRATIONS: Integration[] = [
    {
        id: 'cloudtak',
        name: 'CloudTAK (ATOC)',
        description: 'Tactical COP — CoT tracks, missions, TAK devices, GeoChat',
        icon: Crosshair,
        subjectPrefix: 'tak.cot',
        url: 'https://cloudtak.onemindos.dev',
        color: '#00d4ff',
    },
    {
        id: 'wwv',
        name: 'WorldWideView (ATLAS)',
        description: 'Strategic globe — space domain, orbital passes, recon planning',
        icon: Globe2,
        subjectPrefix: 'ent.satellite',
        url: 'https://wwv.onemindos.dev',
        color: '#c084fc',
    },
    {
        id: 'homeassistant',
        name: 'Home Assistant',
        description: 'Smart home — sensors, automation, irrigation, HVAC, cameras',
        icon: Home,
        subjectPrefix: 'tel.home',
        color: '#facc15',
    },
    {
        id: 'mavlink',
        name: 'MAVLink (Drones)',
        description: 'Drone telemetry and commands — position, battery, waypoints',
        icon: Plane,
        subjectPrefix: 'tel.drone',
        color: '#43e27d',
    },
    {
        id: 'cameras',
        name: 'Vision / Cameras',
        description: 'Camera feeds, motion detection, object recognition',
        icon: Camera,
        subjectPrefix: 'det.visual',
        color: '#fb923c',
    },
];

interface IStatus { id: string; lastSeen: number | null; msgCount: number; active: boolean; }

const { nc } = useNatsStore();
const statusMap = ref<Map<string, IStatus>>(new Map());
let subs: Subscription[] = [];

function teardown() {
    for (const s of subs) s.unsubscribe();
    subs = [];
}

watch(nc, (conn) => {
    teardown();
    statusMap.value = new Map();
    if (!conn) return;

    for (const ig of INTEGRATIONS) {
        try {
            const sub = conn.subscribe(`${ig.subjectPrefix}.>`);
            subs.push(sub);
            (async () => {
                for await (const _ of sub) { void _;
                    const next = new Map(statusMap.value);
                    const ex = next.get(ig.id);
                    next.set(ig.id, { id: ig.id, lastSeen: Date.now(), msgCount: (ex?.msgCount ?? 0) + 1, active: true });
                    statusMap.value = next;
                }
            })().catch(() => {});
        } catch { /* ignore */ }
    }
}, { immediate: true });

onUnmounted(teardown);

function openUrl(url: string) { window.open(url, '_blank', 'noopener'); }
</script>

<style scoped>
.ig { display:flex; flex-direction:column; gap:12px; padding:14px; height:100%; overflow:auto; }
.ig-header { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.ig-accent { color:#4a9eff; }
.ig-title { font-size:13px; font-weight:700; color:#e6edf3; }
.ig-sub { font-size:11px; color:rgba(255,255,255,0.35); }
.ig-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.ig-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:10px; transition:border-color .2s; }
.ig-card-top { display:flex; align-items:flex-start; gap:10px; }
.ig-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ig-info { flex:1; min-width:0; }
.ig-name { font-size:12px; font-weight:600; color:#e6edf3; }
.ig-desc { font-size:11px; color:rgba(255,255,255,0.35); margin-top:2px; }
.ig-open { background:none; border:none; padding:4px; cursor:pointer; color:rgba(255,255,255,0.3); border-radius:4px; display:flex; }
.ig-open:hover { color:#e6edf3; background:rgba(255,255,255,0.07); }
.ig-meta { display:flex; align-items:center; gap:8px; }
.ig-status-row { display:flex; align-items:center; gap:5px; }
.ig-dot { width:7px; height:7px; border-radius:50%; }
.ig-dot.glow { box-shadow:0 0 5px #43e27d; }
.ig-muted { font-size:11px; color:rgba(255,255,255,0.35); }
.ig-subject { font-size:10px; font-family:monospace; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:2px 6px; border-radius:4px; color:rgba(255,255,255,0.5); }
.ig-count { margin-left:auto; font-family:monospace; }
.ig-hint { border:1px dashed rgba(255,255,255,0.1); border-radius:8px; padding:14px; text-align:center; }
.ig-hint p { font-size:11px; color:rgba(255,255,255,0.3); margin:0 0 4px; }
</style>
