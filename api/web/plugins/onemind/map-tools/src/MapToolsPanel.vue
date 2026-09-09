<template>
    <div class="flex flex-col h-full overflow-hidden bg-gray-900 text-white">
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
            <IconMap :size="20" />
            <span class="font-semibold text-sm tracking-wide">Map Tools</span>
        </div>

        <!-- Tab nav -->
        <div class="flex gap-1 px-3 pt-3">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                class="px-3 py-1.5 text-xs rounded transition-colors"
                :class='activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"'
                @click="activeTab = tab.id"
            >
                {{ tab.label }}
            </button>
        </div>

        <div class="flex-1 overflow-y-auto p-3">
            <!-- MEASURE -->
            <MeasureControls v-if='activeTab === "measure"' />

            <!-- TERRAIN -->
            <ContourControls v-else-if='activeTab === "terrain"' />

            <!-- IMPORT -->
            <ImportControls v-else-if='activeTab === "import"' />

            <!-- COG LAYERS -->
            <CogControls v-else-if='activeTab === "cog"' />

            <!-- OFFLINE -->
            <OfflineControls v-else-if='activeTab === "offline"' />
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { IconMap } from '@tabler/icons-vue';
import MeasureControls from './components/MeasureControls.vue';
import ContourControls from './components/ContourControls.vue';
import ImportControls  from './components/ImportControls.vue';
import CogControls     from './components/CogControls.vue';
import OfflineControls from './components/OfflineControls.vue';

const activeTab = ref('measure');

const tabs = [
    { id: 'measure', label: 'Measure'  },
    { id: 'terrain', label: 'Terrain'  },
    { id: 'import',  label: 'Import'   },
    { id: 'cog',     label: 'Imagery'  },
    { id: 'offline', label: 'Offline'  },
];
</script>
