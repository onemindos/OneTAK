<template>
    <div class='flex flex-col h-full overflow-hidden bg-gray-900 text-white'>
        <div class='flex items-center gap-3 px-4 py-3 border-b border-gray-700'>
            <IconLayersSubtract :size='20' />
            <span class='font-semibold text-sm tracking-wide'>Deck Layers</span>
        </div>

        <!-- Tab nav -->
        <div class='flex gap-1 px-3 pt-3'>
            <button
                v-for='tab in tabs'
                :key='tab.id'
                class='px-3 py-1.5 text-xs rounded transition-colors'
                :class='activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"'
                @click='activeTab = tab.id'
            >
                {{ tab.label }}
            </button>
        </div>

        <div class='flex-1 overflow-y-auto p-3'>
            <Tile3DConfig   v-if='activeTab === "tile3d"' />
            <HeatmapConfig  v-else-if='activeTab === "heatmap"' />
            <TripsConfig    v-else-if='activeTab === "trips"' />
            <LayerList      v-else-if='activeTab === "layers"' />
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { IconLayersSubtract } from '@tabler/icons-vue';
import Tile3DConfig  from './components/Tile3DConfig.vue';
import HeatmapConfig from './components/HeatmapConfig.vue';
import TripsConfig   from './components/TripsConfig.vue';
import LayerList     from './components/LayerList.vue';

const activeTab = ref('tile3d');

const tabs = [
    { id: 'tile3d',  label: '3D Tiles' },
    { id: 'heatmap', label: 'Heatmap'  },
    { id: 'trips',   label: 'Trips'    },
    { id: 'layers',  label: 'All Layers' },
];
</script>
