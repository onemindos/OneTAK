<template>
    <div class="compare-root">
        <div class="compare-header">
            <span class="compare-side-label">Before / Layer A</span>
            <span class="compare-side-label right">After / Layer B</span>
        </div>

        <div ref="containerEl" class="compare-container">
            <div ref="beforeEl" class="compare-map" />
            <div ref="afterEl"  class="compare-map" />
        </div>

        <div class="compare-controls">
            <div class="compare-ctrl-group">
                <label class="compare-ctrl-label">Left map</label>
                <select v-model="beforeStyle" class="compare-select" @change="applyBeforeStyle">
                    <option v-for="s in STYLES" :key="s.id" :value="s.url">{{ s.label }}</option>
                </select>
            </div>
            <div class="compare-ctrl-group">
                <label class="compare-ctrl-label">Right map</label>
                <select v-model="afterStyle" class="compare-select" @change="applyAfterStyle">
                    <option v-for="s in STYLES" :key="s.id" :value="s.url">{{ s.label }}</option>
                </select>
            </div>
            <button class="compare-sync-btn" @click="syncToMain">Sync to main map</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, inject } from 'vue'
import { Map as MaplibreMap } from 'maplibre-gl'
import Compare from '@maplibre/maplibre-gl-compare'
import '@maplibre/maplibre-gl-compare/dist/maplibre-gl-compare.css'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mainMap = inject<any>('map')

const containerEl = ref<HTMLElement | null>(null)
const beforeEl    = ref<HTMLElement | null>(null)
const afterEl     = ref<HTMLElement | null>(null)

const STYLES = [
    { id: 'osm',       label: 'OpenStreetMap', url: 'https://tiles.onemindos.dev/styles/basic-preview/style.json' },
    { id: 'satellite', label: 'Satellite',     url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
    { id: 'dark',      label: 'Dark Matter',   url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
    { id: 'positron',  label: 'Positron',      url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
]

const beforeStyle = ref(STYLES[0].url)
const afterStyle  = ref(STYLES[3].url)

let beforeMap: MaplibreMap | null = null
let afterMap:  MaplibreMap | null = null
let compare:   Compare | null = null

onMounted(() => {
    if (!beforeEl.value || !afterEl.value || !containerEl.value) return

    const center = mainMap?.getCenter() ?? { lng: -98, lat: 39 }
    const zoom   = mainMap?.getZoom()   ?? 4
    const bearing = mainMap?.getBearing() ?? 0
    const pitch   = mainMap?.getPitch()   ?? 0

    beforeMap = new MaplibreMap({
        container: beforeEl.value,
        style:     beforeStyle.value,
        center,
        zoom,
        bearing,
        pitch,
    })

    afterMap = new MaplibreMap({
        container: afterEl.value,
        style:     afterStyle.value,
        center,
        zoom,
        bearing,
        pitch,
    })

    compare = new Compare(beforeMap, afterMap, containerEl.value, {
        mousemove:   false,
        orientation: 'vertical',
    })
})

onBeforeUnmount(() => {
    compare?.remove()
    beforeMap?.remove()
    afterMap?.remove()
    compare   = null
    beforeMap = null
    afterMap  = null
})

function syncToMain() {
    if (!mainMap || !beforeMap || !afterMap) return
    const center  = mainMap.getCenter()
    const zoom    = mainMap.getZoom()
    const bearing = mainMap.getBearing()
    const pitch   = mainMap.getPitch()
    beforeMap.jumpTo({ center, zoom, bearing, pitch })
    afterMap.jumpTo({ center, zoom, bearing, pitch })
}

function applyBeforeStyle() {
    beforeMap?.setStyle(beforeStyle.value)
}

function applyAfterStyle() {
    afterMap?.setStyle(afterStyle.value)
}
</script>

<style scoped>
.compare-root {
    display:        flex;
    flex-direction: column;
    height:         100%;
    background:     #0d1117;
    color:          #c9d1d9;
    font-size:      13px;
}

.compare-header {
    display:         flex;
    justify-content: space-between;
    padding:         8px 14px;
    background:      #161b22;
    border-bottom:   1px solid #21262d;
    font-size:       11px;
    font-weight:     600;
    text-transform:  uppercase;
    letter-spacing:  0.05em;
    color:           #8b949e;
    flex-shrink:     0;
}

.compare-container {
    flex:         1;
    position:     relative;
    min-height:   400px;
}

.compare-map {
    position: absolute;
    top:      0;
    bottom:   0;
    width:    100%;
}

.compare-controls {
    display:     flex;
    align-items: center;
    gap:         12px;
    padding:     10px 14px;
    background:  #161b22;
    border-top:  1px solid #21262d;
    flex-shrink: 0;
    flex-wrap:   wrap;
}

.compare-ctrl-group {
    display:     flex;
    align-items: center;
    gap:         6px;
}

.compare-ctrl-label {
    font-size: 12px;
    color:     #8b949e;
    white-space: nowrap;
}

.compare-select {
    background:    #0d1117;
    border:        1px solid #30363d;
    border-radius: 4px;
    color:         #c9d1d9;
    padding:       4px 8px;
    font-size:     12px;
    cursor:        pointer;
}

.compare-sync-btn {
    margin-left:   auto;
    padding:       5px 14px;
    border-radius: 4px;
    border:        1px solid #30363d;
    background:    #21262d;
    color:         #c9d1d9;
    cursor:        pointer;
    font-size:     12px;
    white-space:   nowrap;
}

.compare-sync-btn:hover {
    background: #1f6feb;
    border-color: #1f6feb;
    color: #fff;
}
</style>
