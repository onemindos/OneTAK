<template>
    <!-- Full-screen Cesium globe overlay.
         Sits above the MapLibre canvas via fixed positioning.
         Toggle visibility with the globe store's active flag. -->
    <teleport to='body'>
        <div
            v-if='store.active'
            id='onemind-cesium-container'
            ref='cesiumEl'
            class='fixed inset-0 z-40'
            style='pointer-events: auto;'
        />
        <!-- Globe chrome overlay — toolbar, close button -->
        <div v-if='store.active' class='fixed top-4 right-4 z-50 flex flex-col gap-2'>
            <button
                class='px-3 py-2 text-xs rounded bg-gray-900/90 text-white border border-gray-600 hover:bg-gray-800 transition-colors backdrop-blur'
                @click='close'
            >
                ✕ Close Globe
            </button>
            <div v-if='!store.ready' class='px-3 py-2 text-xs rounded bg-gray-900/90 text-gray-400 border border-gray-700 backdrop-blur'>
                Loading Cesium…
            </div>
            <div v-if='store.ionToken === null' class='px-3 py-2 text-xs rounded bg-amber-900/80 text-amber-300 border border-amber-700 backdrop-blur max-w-48'>
                No CesiumIon token — terrain requires a self-hosted provider or Ion token.
            </div>
        </div>
    </teleport>
</template>

<script setup lang='ts'>
import { watch, onUnmounted, ref, nextTick } from 'vue';
import { useGlobeStore } from './store';
import { initCesium, destroyCesium, syncCesiumCamera } from './cesium';

const store     = useGlobeStore();
const cesiumEl  = ref<HTMLElement | null>(null);

watch(() => store.active, async (active) => {
    if (active) {
        await nextTick();
        store.syncFromMapLibre();
        try {
            await initCesium('onemind-cesium-container', {
                ionToken: store.ionToken,
                lat:      store.latitude,
                lng:      store.longitude,
                alt:      store.altitude,
            });
            store.ready = true;
        } catch (err) {
            console.error('[globe] Cesium init failed:', err);
            store.active = false;
        }
    } else {
        store.ready = false;
        await destroyCesium();
    }
});

// Keep Cesium camera in sync when MapLibre moves
watch([() => store.latitude, () => store.longitude], () => {
    if (store.active && store.ready) {
        syncCesiumCamera(store.latitude, store.longitude, store.altitude, store.heading, store.pitch);
    }
});

function close() {
    store.active = false;
}

onUnmounted(async () => {
    await destroyCesium();
});
</script>
