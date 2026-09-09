import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import type { Map } from 'maplibre-gl';

export const useGlobeStore = defineStore('onemind-globe', () => {
    const map       = shallowRef<Map | null>(null);
    const active    = ref(false);
    const ready     = ref(false);
    const ionToken  = ref<string | null>(null);

    // Current camera position — synced both ways between MapLibre and Cesium
    const latitude  = ref(0);
    const longitude = ref(0);
    const altitude  = ref(10000);
    const heading   = ref(0);
    const pitch     = ref(-90);

    function setMap(m: Map) { map.value = m; }

    function syncFromMapLibre() {
        if (!map.value) return;
        const center      = map.value.getCenter();
        latitude.value    = center.lat;
        longitude.value   = center.lng;
        const zoom        = map.value.getZoom();
        altitude.value    = zoomToAltitude(zoom);
        heading.value     = map.value.getBearing();
        pitch.value       = -90 + map.value.getPitch();
    }

    function cleanup() {
        active.value    = false;
        ready.value     = false;
        map.value       = null;
    }

    return {
        map, active, ready, ionToken,
        latitude, longitude, altitude, heading, pitch,
        setMap, syncFromMapLibre, cleanup,
    };
});

// Rough zoom → altitude mapping (meters above ground)
function zoomToAltitude(zoom: number): number {
    return Math.max(100, 40_000_000 / Math.pow(2, zoom));
}
