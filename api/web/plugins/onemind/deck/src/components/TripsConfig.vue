<template>
    <div class='space-y-4'>
        <p class='text-xs text-gray-400'>
            Animate CoT track history as moving trails. Pairs with the ClickHouse plugin —
            query historical tracks, then play them back with the time scrubber.
        </p>

        <div class='space-y-2'>
            <label class='block text-xs text-gray-400'>Label</label>
            <input
                v-model='form.label'
                class='w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none'
                placeholder='Mission replay'
            >
        </div>

        <div class='flex gap-2'>
            <div class='flex-1 space-y-1'>
                <label class='block text-xs text-gray-400'>Trail length (s)</label>
                <input
                    v-model.number='form.trailLength'
                    type='number'
                    min='10'
                    max='3600'
                    step='10'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
            <div class='flex-1 space-y-1'>
                <label class='block text-xs text-gray-400'>Width (px)</label>
                <input
                    v-model.number='form.widthMinPixels'
                    type='number'
                    min='1'
                    max='10'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
        </div>

        <!-- Temporal control -->
        <TemporalControl />

        <button
            class='w-full py-2 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors'
            @click='addLayer'
        >
            Add Trip Layer
        </button>
    </div>
</template>

<script setup lang='ts'>
import { reactive } from 'vue';
import { useDeckStore } from '../store';
import TemporalControl from './TemporalControl.vue';
import { v4 as uuid } from 'uuid';

const store = useDeckStore();
const form  = reactive({ label: '', trailLength: 120, widthMinPixels: 2 });

function addLayer() {
    store.addLayerConfig({
        id:             uuid(),
        type:           'trips',
        label:          form.label || 'Track Replay',
        visible:        true,
        trailLength:    form.trailLength,
        widthMinPixels: form.widthMinPixels,
        color:          [253, 128, 93],
        currentTime:    store.temporal.current,
        animating:      false,
        animationSpeed: 1,
    });
}
</script>
