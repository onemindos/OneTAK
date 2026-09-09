<template>
    <div class='space-y-4'>
        <p class='text-xs text-gray-400'>
            Pre-cache map tiles for offline use. Define a bounding box and zoom range,
            then cache the area before going into denied communications environments.
        </p>

        <!-- Bounds (populated from current map view by default) -->
        <div class='grid grid-cols-2 gap-2'>
            <div class='space-y-1'>
                <label class='block text-xs text-gray-400'>North</label>
                <input
                    v-model.number='bounds.north'
                    type='number'
                    step='0.01'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
            <div class='space-y-1'>
                <label class='block text-xs text-gray-400'>South</label>
                <input
                    v-model.number='bounds.south'
                    type='number'
                    step='0.01'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
            <div class='space-y-1'>
                <label class='block text-xs text-gray-400'>East</label>
                <input
                    v-model.number='bounds.east'
                    type='number'
                    step='0.01'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
            <div class='space-y-1'>
                <label class='block text-xs text-gray-400'>West</label>
                <input
                    v-model.number='bounds.west'
                    type='number'
                    step='0.01'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
        </div>

        <div class='flex gap-2'>
            <div class='flex-1 space-y-1'>
                <label class='block text-xs text-gray-400'>Min zoom</label>
                <input
                    v-model.number='bounds.minZoom'
                    type='number'
                    min='0'
                    max='20'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
            <div class='flex-1 space-y-1'>
                <label class='block text-xs text-gray-400'>Max zoom</label>
                <input
                    v-model.number='bounds.maxZoom'
                    type='number'
                    min='0'
                    max='20'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
        </div>

        <!-- Tile URL template -->
        <div class='space-y-1'>
            <label class='block text-xs text-gray-400'>Tile URL template</label>
            <input
                v-model='tileUrl'
                class='w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none'
                placeholder='https://tiles.local/{z}/{x}/{y}.png'
            >
        </div>

        <!-- Estimate -->
        <button
            class='w-full py-2 text-xs rounded border border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors'
            @click='estimate'
        >
            Estimate tile count
        </button>

        <p
            v-if='estimatedCount !== null'
            class='text-xs text-center text-gray-300'
        >
            ~{{ estimatedCount.toLocaleString() }} tiles
        </p>

        <!-- Progress -->
        <div
            v-if='store.offlineCaching'
            class='space-y-2'
        >
            <div class='flex justify-between text-xs text-gray-400'>
                <span>Caching…</span>
                <span>{{ cached }} / {{ total }}</span>
            </div>
            <div class='w-full bg-gray-700 rounded-full h-1.5'>
                <div
                    class='bg-blue-500 h-1.5 rounded-full transition-all'
                    :style='{ width: progressPct + "%" }'
                />
            </div>
            <button
                class='w-full py-1.5 text-xs text-red-400 hover:text-red-300'
                @click='abort'
            >
                Abort
            </button>
        </div>

        <div
            v-else
            class='flex gap-2'
        >
            <button
                :disabled='!tileUrl'
                class='flex-1 py-2 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors disabled:opacity-40'
                @click='startCache'
            >
                Cache AO
            </button>
            <button
                class='px-3 py-2 text-xs rounded border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors'
                @click='clearCache'
            >
                Clear
            </button>
        </div>

        <p
            v-if='store.offlineCacheSize > 0'
            class='text-xs text-gray-500 text-center'
        >
            {{ store.offlineCacheSize.toLocaleString() }} tiles cached
        </p>
    </div>
</template>

<script setup lang='ts'>
import { ref, reactive, computed, onMounted } from 'vue';
import { useMapToolsStore } from '../store';
import { estimateTileCount, cacheTiles, clearTileCache, getTileCacheSize } from '../tools/offline';

const store   = useMapToolsStore();
const tileUrl = ref('');
const estimatedCount = ref<number | null>(null);
const cached  = ref(0);
const total   = ref(0);
const progressPct = computed(() => total.value ? Math.round((cached.value / total.value) * 100) : 0);

let abortController: AbortController | null = null;

const bounds = reactive({
    north: 40, south: 39, east: -74, west: -75, minZoom: 8, maxZoom: 14,
});

onMounted(async () => {
    // Populate bounds from current map view
    if (store.map) {
        const b = store.map.getBounds();
        bounds.north = parseFloat(b.getNorth().toFixed(4));
        bounds.south = parseFloat(b.getSouth().toFixed(4));
        bounds.east  = parseFloat(b.getEast().toFixed(4));
        bounds.west  = parseFloat(b.getWest().toFixed(4));
    }
    store.offlineCacheSize = await getTileCacheSize();
});

function estimate() {
    estimatedCount.value = estimateTileCount(bounds);
}

async function startCache() {
    if (!tileUrl.value) return;
    abortController = new AbortController();
    store.offlineCaching = true;
    cached.value = 0;
    total.value  = estimateTileCount(bounds);

    await cacheTiles(bounds, tileUrl.value, (c, t) => {
        cached.value = c;
        total.value  = t;
    }, abortController.signal);

    store.offlineCaching    = false;
    store.offlineCacheSize  = await getTileCacheSize();
}

function abort() {
    abortController?.abort();
    store.offlineCaching = false;
}

async function clearCache() {
    await clearTileCache();
    store.offlineCacheSize = 0;
}
</script>
