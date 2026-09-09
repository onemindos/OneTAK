<template>
    <div class='nats-console'>
        <!-- ── Section bar ────────────────────────────────────────────────────── -->
        <div class='nc-sections'>
            <button
                v-for='s in SECTIONS'
                :key='s.id'
                class='nc-section'
                :class='{ active: activeSection === s.id }'
                @click='activeSection = s.id'
            >
                <component
                    :is='s.icon'
                    :size='11'
                />
                {{ s.label }}
            </button>
            <div class='nc-sections-spacer' />
            <div
                class='nc-status'
                :class='status'
            >
                <div class='nc-status-dot' />
                <span>{{ statusLabel }}</span>
                <span
                    v-if='rtt'
                    class='nc-rtt'
                >{{ rtt }}ms</span>
            </div>
        </div>

        <!-- ── Section content ──────────────────────────────────────────────── -->
        <div class='nc-body'>
            <OverviewSection v-if='activeSection === "overview"' />
            <AgentsSection v-if='activeSection === "agents"' />
            <FleetSection v-if='activeSection === "fleet"' />
            <MissionsSection v-if='activeSection === "missions"' />
            <TasksSection v-if='activeSection === "tasks"' />
            <IntegrationsSection v-if='activeSection === "integrations"' />
            <ReplaySection v-if='activeSection === "replay"' />
            <IntelSection v-if='activeSection === "intel"' />
            <TimeMachineSection v-if='activeSection === "timemachine"' />
            <ServicesSection v-if='activeSection === "services"' />
            <VoiceSection v-if='activeSection === "voice"' />
            <BridgesSection v-if='activeSection === "bridges"' />

            <!-- Bus: inner tab bar + content -->
            <template v-if='activeSection === "bus"'>
                <div class='nc-tabs'>
                    <button
                        v-for='tab in TABS'
                        :key='tab.id'
                        class='nc-tab'
                        :class='{ active: activeTab === tab.id }'
                        @click='activeTab = tab.id'
                    >
                        <component
                            :is='tab.icon'
                            :size='12'
                        />
                        {{ tab.label }}
                    </button>
                </div>
                <div class='nc-tab-body'>
                    <WireTab v-if='activeTab === "wire"' />
                    <SecurityTab v-if='activeTab === "security"' />
                    <TopologyTab v-if='activeTab === "topology"' />
                    <ConnectionsTab v-if='activeTab === "connections"' />
                    <StreamsTab v-if='activeTab === "streams"' />
                    <KVTab v-if='activeTab === "kv"' />
                    <PublishTab v-if='activeTab === "publish"' />
                    <NatsSettings v-if='activeTab === "settings"' />
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed } from 'vue';
import {
    Radio, Shield, Network, Link2, Layers, Database, Settings, Send,
    LayoutDashboard, Bot, Satellite, Target, CheckSquare, Plug, HistoryIcon, Newspaper,
    Clock, LayoutList, Mic, GitMerge,
} from 'lucide-vue-next';
import { useNatsStore } from '../stores/nats.store';
import WireTab           from './WireTab.vue';
import SecurityTab       from './SecurityTab.vue';
import TopologyTab       from './TopologyTab.vue';
import ConnectionsTab    from './ConnectionsTab.vue';
import StreamsTab        from './StreamsTab.vue';
import KVTab             from './KVTab.vue';
import PublishTab        from './PublishTab.vue';
import NatsSettings      from './NatsSettings.vue';
import OverviewSection      from './OverviewSection.vue';
import AgentsSection        from './AgentsSection.vue';
import FleetSection         from './FleetSection.vue';
import MissionsSection      from './MissionsSection.vue';
import TasksSection         from './TasksSection.vue';
import IntegrationsSection  from './IntegrationsSection.vue';
import ReplaySection        from './ReplaySection.vue';
import IntelSection         from './IntelSection.vue';
import TimeMachineSection   from './TimeMachineSection.vue';
import ServicesSection      from './ServicesSection.vue';
import VoiceSection         from './VoiceSection.vue';
import BridgesSection       from './BridgesSection.vue';

const { status, rtt } = useNatsStore();

const SECTIONS = [
    { id: 'overview',     label: 'Overview',      icon: LayoutDashboard },
    { id: 'agents',       label: 'Agents',         icon: Bot             },
    { id: 'fleet',        label: 'Fleet',          icon: Satellite       },
    { id: 'missions',     label: 'Missions',       icon: Target          },
    { id: 'tasks',        label: 'Tasks',          icon: CheckSquare     },
    { id: 'intel',        label: 'Intel',          icon: Newspaper       },
    { id: 'bus',          label: 'Bus',            icon: Radio           },
    { id: 'integrations', label: 'Integrations',   icon: Plug            },
    { id: 'replay',       label: 'Replay',         icon: HistoryIcon     },
    { id: 'timemachine',  label: 'Time Machine',   icon: Clock           },
    { id: 'services',     label: 'Services',       icon: LayoutList      },
    { id: 'voice',        label: 'Voice',          icon: Mic             },
    { id: 'bridges',      label: 'Bridges',        icon: GitMerge        },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];
const activeSection = ref<SectionId>('overview');

const TABS = [
    { id: 'wire',        label: 'Wire',        icon: Radio    },
    { id: 'topology',    label: 'Topology',    icon: Network  },
    { id: 'connections', label: 'Connections', icon: Link2    },
    { id: 'streams',     label: 'Streams',     icon: Layers   },
    { id: 'kv',          label: 'Key-Value',   icon: Database },
    { id: 'publish',     label: 'Publish',     icon: Send     },
    { id: 'security',    label: 'Security',    icon: Shield   },
    { id: 'settings',    label: 'Settings',    icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];
const activeTab = ref<TabId>('wire');

const statusLabel = computed(() => {
    const map: Record<string, string> = {
        connected: 'connected', connecting: 'connecting…',
        disconnected: 'disconnected', error: 'error',
    };
    return map[status.value] ?? status.value;
});
</script>

<style scoped>
.nats-console {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--cloudtak-panel-bg, rgba(13,17,23,0.98));
    color: #e6edf3;
    font-size: 12px;
}

/* Section bar */
.nc-sections {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    border-bottom: 2px solid rgba(255,255,255,0.07);
    padding: 0 6px;
    gap: 0;
    min-height: 38px;
    background: rgba(255,255,255,0.02);
    overflow-x: auto;
}
.nc-sections::-webkit-scrollbar { height: 0; }
.nc-section {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 10px;
    background: none; border: none; border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    color: rgba(255,255,255,0.4);
    font-size: 11px; font-weight: 600;
    cursor: pointer; white-space: nowrap;
    transition: color .12s, border-color .12s;
}
.nc-section:hover { color: rgba(255,255,255,0.75); }
.nc-section.active { color: #4a9eff; border-bottom-color: #4a9eff; }

.nc-sections-spacer { flex: 1; min-width: 8px; }

/* Connection status pill */
.nc-status {
    display: flex; align-items: center; gap: 5px;
    padding: 3px 9px;
    border-radius: 12px;
    font-size: 11px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.4);
    white-space: nowrap;
    flex-shrink: 0;
}
.nc-status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
}
.nc-status.connected .nc-status-dot  { background: #22c55e; box-shadow: 0 0 6px #22c55e88; }
.nc-status.connected                 { color: #22c55e; border-color: rgba(34,197,94,0.25); }
.nc-status.connecting .nc-status-dot { background: #f59e0b; animation: blink 1s infinite; }
.nc-status.connecting                { color: #f59e0b; }
.nc-status.error .nc-status-dot      { background: #f85149; }
.nc-status.error                     { color: #f85149; }
.nc-rtt { color: rgba(255,255,255,0.3); font-size: 10px; }

@keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

/* Body */
.nc-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

/* Bus inner tab bar */
.nc-tabs {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 0 8px;
    gap: 1px;
    min-height: 34px;
}
.nc-tab {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 9px;
    background: none; border: none; border-bottom: 2px solid transparent;
    color: rgba(255,255,255,0.4);
    font-size: 11px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
    transition: color .12s, border-color .12s;
}
.nc-tab:hover { color: rgba(255,255,255,0.7); }
.nc-tab.active { color: #4a9eff; border-bottom-color: #4a9eff; }

.nc-tab-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
</style>
