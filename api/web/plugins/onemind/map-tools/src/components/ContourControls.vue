<template>
    <div class='space-y-4'>
        <p class='text-xs text-gray-400'>
            Overlay terrain contour lines from a DEM tile source.
            Use your hosted PMTiles DEM via the geo/martin tile server.
        </p>

        <div class='space-y-2'>
            <label class='block text-xs text-gray-400'>DEM Tile URL</label>
            <input
                v-model='config.demUrl'
                class='w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none'
                placeholder='https://tiles.local/terrain/{z}/{x}/{y}.png'
            >
            <p class='text-xs text-gray-500'>
                Self-hosted: use Martin at <code class='text-blue-400'>geo/martin</code> with a terrarium PMTiles DEM.
            </p>
        </div>

        <div class='flex gap-2'>
            <div class='flex-1 space-y-1'>
                <label class='block text-xs text-gray-400'>Encoding</label>
                <select
                    v-model='config.encoding'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
                    <option value='terrarium'>
                        Terrarium (AWS/Mapzen)
                    </option>
                    <option value='mapbox'>
                        Mapbox Terrain-RGB
                    </option>
                </select>
            </div>
            <div class='flex-1 space-y-1'>
                <label class='block text-xs text-gray-400'>Interval (m)</label>
                <input
                    v-model.number='config.interval'
                    type='number'
                    min='10'
                    step='10'
                    class='w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none'
                >
            </div>
        </div>

        <div class='flex gap-2'>
            <button
                v-if='!store.contourActive'
                :disabled='!config.demUrl'
                class='flex-1 py-2 text-xs rounded bg-emerald-700 hover:bg-emerald-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
                @click='enable'
            >
                Enable Contours
            </button>
            <button
                v-else
                class='flex-1 py-2 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors'
                @click='disable'
            >
                Remove Contours
            </button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { reactive } from 'vue';
import { useMapToolsStore } from '../store';
import { mountContours, unmountContours } from '../tools/contour';

const store  = useMapToolsStore();
const config = reactive({ ...store.contourConfig });

async function enable() {
    if (!store.map) return;
    try {
        await mountContours(store.map, config);
        Object.assign(store.contourConfig, config);
        store.contourActive = true;
    } catch (err) {
        console.error('[map-tools] contour mount failed:', err);
    }
}

async function disable() {
    if (!store.map) return;
    await unmountContours(store.map);
    store.contourActive = false;
}
</script>
