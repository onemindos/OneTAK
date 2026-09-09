import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import type { Map } from 'maplibre-gl';
import type { MeasureResult, ContourConfig, CogLayer, ImportedLayer } from './types';

export const useMapToolsStore = defineStore('onemind-map-tools', () => {
    const map = shallowRef<Map | null>(null);

    // ── Measure ────────────────────────────────────────────────────────────────
    const measureActive    = ref(false);
    const measureMode      = ref<'distance' | 'area'>('distance');
    const measureResults   = ref<MeasureResult[]>([]);

    // ── Contour ────────────────────────────────────────────────────────────────
    const contourActive = ref(false);
    const contourConfig = ref<ContourConfig>({
        demUrl:   '',
        encoding: 'terrarium',
        interval: 100,
        maxzoom:  12,
    });

    // ── COG layers ─────────────────────────────────────────────────────────────
    const cogLayers = ref<CogLayer[]>([]);

    // ── Imported layers ────────────────────────────────────────────────────────
    const importedLayers = ref<ImportedLayer[]>([]);

    // ── Offline ────────────────────────────────────────────────────────────────
    const offlineCacheSize = ref(0);
    const offlineCaching   = ref(false);

    function setMap(m: Map) {
        map.value = m;
    }

    function addMeasureResult(r: MeasureResult) {
        measureResults.value.push(r);
    }

    function clearMeasureResults() {
        measureResults.value = [];
    }

    function addCogLayer(layer: CogLayer) {
        cogLayers.value.push(layer);
    }

    function removeCogLayer(id: string) {
        cogLayers.value = cogLayers.value.filter(l => l.id !== id);
    }

    function addImportedLayer(layer: ImportedLayer) {
        importedLayers.value.push(layer);
    }

    function removeImportedLayer(id: string) {
        importedLayers.value = importedLayers.value.filter(l => l.id !== id);
    }

    function cleanup() {
        measureActive.value  = false;
        contourActive.value  = false;
        cogLayers.value      = [];
        importedLayers.value = [];
        measureResults.value = [];
        map.value            = null;
    }

    return {
        map,
        measureActive, measureMode, measureResults,
        contourActive, contourConfig,
        cogLayers,
        importedLayers,
        offlineCacheSize, offlineCaching,
        setMap,
        addMeasureResult, clearMeasureResults,
        addCogLayer, removeCogLayer,
        addImportedLayer, removeImportedLayer,
        cleanup,
    };
});
