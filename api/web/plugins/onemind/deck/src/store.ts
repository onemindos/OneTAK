import { defineStore } from 'pinia';
import { ref, shallowRef, computed } from 'vue';
import type { Map } from 'maplibre-gl';
import type { DeckLayerConfig, TemporalRange } from './types';

export const useDeckStore = defineStore('onemind-deck', () => {
    const map      = shallowRef<Map | null>(null);
    const configs  = ref<DeckLayerConfig[]>([]);
    const temporal = ref<TemporalRange>({ start: 0, end: Date.now(), current: Date.now() });

    const activeConfigs = computed(() => configs.value.filter(c => c.visible));

    function setMap(m: Map) { map.value = m; }

    function addLayerConfig(config: DeckLayerConfig) {
        configs.value.push(config);
        rebuildLayers();
    }

    function removeLayerConfig(id: string) {
        configs.value = configs.value.filter(c => c.id !== id);
        rebuildLayers();
    }

    function updateLayerConfig(id: string, patch: Partial<DeckLayerConfig>) {
        const idx = configs.value.findIndex(c => c.id === id);
        if (idx !== -1) {
            configs.value[idx] = { ...configs.value[idx], ...patch } as DeckLayerConfig;
            rebuildLayers();
        }
    }

    function setTemporalCurrent(ts: number) {
        temporal.value.current = ts;
        rebuildLayers();
    }

    // Called any time layer configs change — rebuilds deck.gl layer instances.
    // Actual layer construction happens in the layer modules (tile3d.ts, etc.)
    // to keep this store free of deck.gl imports.
    let rebuildFn: (() => void) | null = null;

    function onRebuild(fn: () => void) { rebuildFn = fn; }

    function rebuildLayers() {
        rebuildFn?.();
    }

    function cleanup() {
        configs.value  = [];
        map.value      = null;
        rebuildFn      = null;
    }

    return {
        map, configs, temporal, activeConfigs,
        setMap,
        addLayerConfig, removeLayerConfig, updateLayerConfig,
        setTemporalCurrent,
        onRebuild, rebuildLayers,
        cleanup,
    };
});
