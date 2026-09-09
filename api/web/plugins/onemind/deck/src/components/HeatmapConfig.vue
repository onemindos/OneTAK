<template>
    <div class="space-y-4">
        <p class="text-xs text-gray-400">
            Visualize CoT track density as a heatmap. Load a time window from the ClickHouse
            plugin and render unit/contact concentration across the AO.
        </p>

        <div class="space-y-2">
            <label class="block text-xs text-gray-400">Label</label>
            <input
                v-model="form.label"
                class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder="Track density — last 24h"
            >
        </div>

        <div class="flex gap-2">
            <div class="flex-1 space-y-1">
                <label class="block text-xs text-gray-400">Intensity</label>
                <input
                    v-model.number="form.intensity"
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
            </div>
            <div class="flex-1 space-y-1">
                <label class="block text-xs text-gray-400">Radius (px)</label>
                <input
                    v-model.number="form.radiusPixels"
                    type="number"
                    min="10"
                    max="200"
                    step="5"
                    class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
            </div>
        </div>

        <p class="text-xs text-gray-500">
            Connect to the ClickHouse plugin to feed live CoT track data into this layer.
            Feature data is passed via the ClickHouse store after a query runs.
        </p>

        <button
            class="w-full py-2 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors"
            @click="addLayer"
        >
            Add Heatmap Layer
        </button>
    </div>
</template>

<script setup lang='ts'>
import { reactive } from 'vue';
import { useDeckStore } from '../store';
import { v4 as uuid } from 'uuid';

const store = useDeckStore();
const form  = reactive({ label: '', intensity: 1, radiusPixels: 30, threshold: 0.05 });

function addLayer() {
    store.addLayerConfig({
        id:           uuid(),
        type:         'heatmap',
        label:        form.label || 'Track Density',
        visible:      true,
        intensity:    form.intensity,
        threshold:    form.threshold,
        radiusPixels: form.radiusPixels,
        colorRange:   [],
    });
}
</script>
