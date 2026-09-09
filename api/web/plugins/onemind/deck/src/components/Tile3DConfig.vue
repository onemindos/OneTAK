<template>
    <div class='space-y-4'>
        <p class='text-xs text-gray-400'>
            Load OGC 3D Tiles (buildings, photogrammetry, LiDAR point clouds) directly on the map.
            Works with any self-hosted tileset.json endpoint. No CesiumJS or CesiumIon required.
        </p>

        <div class='space-y-2'>
            <label class='block text-xs text-gray-400'>Tileset URL (tileset.json)</label>
            <input
                v-model='form.url'
                class='w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none'
                placeholder='https://intel.local/3dtiles/buildings/tileset.json'
            >
        </div>

        <div class='space-y-2'>
            <label class='block text-xs text-gray-400'>Label</label>
            <input
                v-model='form.label'
                class='w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none'
                placeholder='City Buildings'
            >
        </div>

        <div class='flex gap-2'>
            <div class='flex-1 space-y-1'>
                <label class='block text-xs text-gray-400'>Point size</label>
                <input
                    v-model.number='form.pointSize'
                    type='number'
                    min='1'
                    max='10'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
            <div class='flex-1 space-y-1'>
                <label class='block text-xs text-gray-400'>Opacity</label>
                <input
                    v-model.number='form.opacity'
                    type='number'
                    min='0'
                    max='1'
                    step='0.1'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
        </div>

        <button
            :disabled='!form.url'
            class='w-full py-2 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors disabled:opacity-40'
            @click='addLayer'
        >
            Add 3D Tile Layer
        </button>

        <!-- Preset tile sources -->
        <div class='space-y-1'>
            <p class='text-xs text-gray-500'>
                Quick-add presets
            </p>
            <button
                v-for='preset in presets'
                :key='preset.label'
                class='w-full text-left px-3 py-2 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors'
                @click='applyPreset(preset)'
            >
                {{ preset.label }}
            </button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { reactive } from 'vue';
import { useDeckStore } from '../store';
import { v4 as uuid } from 'uuid';

const store = useDeckStore();
const form  = reactive({ url: '', label: '', pointSize: 2, opacity: 1 });

const presets = [
    { label: 'NYC Buildings (Cesium Sample)',     url: 'https://assets.cesium.com/buildings.json' },
    { label: 'Local Building Tiles',              url: 'https://intel.local/3dtiles/buildings/tileset.json' },
    { label: 'Local Drone Photogrammetry',        url: 'https://intel.local/3dtiles/drone/tileset.json' },
];

function applyPreset(preset: { label: string; url: string }) {
    form.url   = preset.url;
    form.label = preset.label;
}

function addLayer() {
    if (!form.url) return;
    store.addLayerConfig({
        id:        uuid(),
        type:      'tile3d',
        label:     form.label || form.url.split('/').pop() || 'Untitled',
        visible:   true,
        url:       form.url,
        maxErrors: 0,
        pointSize: form.pointSize,
        opacity:   form.opacity,
    });
    form.url   = '';
    form.label = '';
}
</script>
