<template>
    <div class="space-y-2 bg-gray-800 rounded p-3">
        <div class="flex items-center justify-between text-xs text-gray-400">
            <span>{{ formatTs(store.temporal.start) }}</span>
            <span class="text-white font-mono">{{ formatTs(store.temporal.current) }}</span>
            <span>{{ formatTs(store.temporal.end) }}</span>
        </div>

        <input
            type="range"
            :min="store.temporal.start"
            :max="store.temporal.end"
            :value="store.temporal.current"
            class="w-full h-1 accent-amber-500"
            @input="onScrub"
        >

        <div class="flex items-center gap-2">
            <button
                class="px-3 py-1 text-xs rounded transition-colors"
                :class='animating ? "bg-red-700 hover:bg-red-600 text-white" : "bg-green-700 hover:bg-green-600 text-white"'
                @click="toggleAnimate"
            >
                {{ animating ? 'Pause' : 'Play' }}
            </button>

            <select
                v-model.number="speed"
                class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
                <option :value="1">
                    1x
                </option>
                <option :value="5">
                    5x
                </option>
                <option :value="10">
                    10x
                </option>
                <option :value="60">
                    60x
                </option>
            </select>

            <span class="text-xs text-gray-500 ml-auto">speed</span>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, onUnmounted } from 'vue';
import { useDeckStore } from '../store';

const store     = useDeckStore();
const animating = ref(false);
const speed     = ref(1);
let   rafId: number | null = null;

function formatTs(ts: number): string {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function onScrub(e: Event) {
    store.setTemporalCurrent(Number((e.target as HTMLInputElement).value));
}

function toggleAnimate() {
    animating.value = !animating.value;
    if (animating.value) {
        startAnimation();
    } else {
        stopAnimation();
    }
}

function startAnimation() {
    let last = performance.now();

    function step(now: number) {
        const delta = (now - last) / 1000;
        last = now;

        const next = store.temporal.current + delta * speed.value * 1000;
        if (next >= store.temporal.end) {
            store.setTemporalCurrent(store.temporal.start);
            animating.value = false;
            return;
        }
        store.setTemporalCurrent(next);
        rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
}

function stopAnimation() {
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

onUnmounted(stopAnimation);
</script>
