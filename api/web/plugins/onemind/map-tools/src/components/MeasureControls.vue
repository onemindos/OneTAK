<template>
    <div class='space-y-4'>
        <p class='text-xs text-gray-400'>Click on the map to add vertices. Double-click to finish.</p>

        <!-- Mode selector -->
        <div class='flex gap-2'>
            <button
                class='flex-1 py-2 text-xs rounded border transition-colors'
                :class='store.measureMode === "distance" ? "border-amber-500 text-amber-400 bg-amber-500/10" : "border-gray-600 text-gray-400 hover:border-gray-500"'
                @click='setMode("distance")'
            >
                Distance
            </button>
            <button
                class='flex-1 py-2 text-xs rounded border transition-colors'
                :class='store.measureMode === "area" ? "border-amber-500 text-amber-400 bg-amber-500/10" : "border-gray-600 text-gray-400 hover:border-gray-500"'
                @click='setMode("area")'
            >
                Area
            </button>
        </div>

        <!-- Start / Stop -->
        <div class='flex gap-2'>
            <button
                v-if='!store.measureActive'
                class='flex-1 py-2 text-xs rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors'
                @click='startMeasure'
            >
                Start
            </button>
            <template v-else>
                <button
                    class='flex-1 py-2 text-xs rounded bg-green-700 hover:bg-green-600 text-white transition-colors'
                    @click='finishMeasure'
                >
                    Finish
                </button>
                <button
                    class='flex-1 py-2 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors'
                    @click='clearMeasure'
                >
                    Clear
                </button>
            </template>
        </div>

        <!-- Results -->
        <div v-if='store.measureResults.length' class='space-y-2'>
            <div class='flex items-center justify-between'>
                <span class='text-xs text-gray-400'>Results</span>
                <button class='text-xs text-gray-500 hover:text-gray-300' @click='store.clearMeasureResults'>Clear all</button>
            </div>
            <div
                v-for='(r, i) in store.measureResults'
                :key='i'
                class='flex items-center justify-between bg-gray-800 rounded px-3 py-2'
            >
                <span class='text-xs text-gray-400 capitalize'>{{ r.type }}</span>
                <span class='text-sm font-mono text-amber-400'>{{ r.label }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { onUnmounted, shallowRef } from 'vue';
import { useMapToolsStore } from '../store';
import { MeasureTool } from '../tools/measure';

const store = useMapToolsStore();
const tool  = shallowRef<MeasureTool | null>(null);

function setMode(mode: 'distance' | 'area') {
    store.measureMode = mode;
    if (store.measureActive) {
        clearMeasure();
        startMeasure();
    }
}

function startMeasure() {
    if (!store.map) return;
    tool.value = new MeasureTool(store.map);
    tool.value.start(store.measureMode);
    store.measureActive = true;
}

function finishMeasure() {
    if (!tool.value) return;
    const result = tool.value.finish();
    if (result) {
        store.addMeasureResult({ type: store.measureMode, ...result });
    }
    tool.value.clear();
    tool.value = null;
    store.measureActive = false;
}

function clearMeasure() {
    tool.value?.clear();
    tool.value = null;
    store.measureActive = false;
}

onUnmounted(() => { tool.value?.clear(); });
</script>
