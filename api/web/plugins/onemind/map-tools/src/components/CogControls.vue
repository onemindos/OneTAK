<template>
    <div class='space-y-4'>
        <p class='text-xs text-gray-400'>
            Load Cloud Optimized GeoTIFFs (COG) as raster layers.
            Works with drone ortho imagery, aerial photography, and satellite snapshots.
        </p>

        <!-- Add COG layer -->
        <div class='space-y-2'>
            <label class='block text-xs text-gray-400'>GeoTIFF URL</label>
            <input
                v-model='cogUrl'
                class='w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none'
                placeholder='https://intel.local/imagery/ortho.tif'
            />
            <label class='block text-xs text-gray-400'>Label</label>
            <div class='flex gap-2'>
                <input
                    v-model='cogLabel'
                    class='flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none'
                    placeholder='Drone Ortho 2024-09-09'
                />
                <button
                    :disabled='!cogUrl'
                    class='px-3 py-2 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors disabled:opacity-40'
                    @click='addLayer'
                >
                    Add
                </button>
            </div>
        </div>

        <!-- Active COG layers -->
        <div v-if='store.cogLayers.length' class='space-y-2'>
            <span class='text-xs text-gray-400'>Active imagery</span>
            <div
                v-for='layer in store.cogLayers'
                :key='layer.id'
                class='bg-gray-800 rounded p-3 space-y-2'
            >
                <div class='flex items-center justify-between'>
                    <p class='text-xs text-white'>{{ layer.label }}</p>
                    <button class='text-xs text-red-400 hover:text-red-300' @click='removeLayer(layer.id)'>Remove</button>
                </div>
                <div class='flex items-center gap-2'>
                    <span class='text-xs text-gray-400 w-12'>Opacity</span>
                    <input
                        type='range' min='0' max='1' step='0.05'
                        :value='layer.opacity'
                        class='flex-1 h-1 accent-blue-500'
                        @input='setOpacity(layer.id, Number(($event.target as HTMLInputElement).value))'
                    />
                    <span class='text-xs text-gray-400 w-8 text-right'>{{ Math.round(layer.opacity * 100) }}%</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useMapToolsStore } from '../store';
import { addCogLayer, removeCogLayer, setCogOpacity } from '../tools/cog';
import { v4 as uuid } from 'uuid';

const store    = useMapToolsStore();
const cogUrl   = ref('');
const cogLabel = ref('');

function addLayer() {
    if (!cogUrl.value || !store.map) return;
    const layer = {
        id:      uuid(),
        url:     cogUrl.value.trim(),
        label:   cogLabel.value.trim() || cogUrl.value.split('/').pop() || 'Untitled',
        opacity: 1,
    };
    addCogLayer(store.map, layer);
    store.addCogLayer(layer);
    cogUrl.value   = '';
    cogLabel.value = '';
}

function removeLayer(id: string) {
    if (!store.map) return;
    removeCogLayer(store.map, id);
    store.removeCogLayer(id);
}

function setOpacity(id: string, opacity: number) {
    if (!store.map) return;
    setCogOpacity(store.map, id, opacity);
    const layer = store.cogLayers.find(l => l.id === id);
    if (layer) layer.opacity = opacity;
}
</script>
