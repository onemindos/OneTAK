<template>
    <div class="globe-panel">
        <div class="globe-header">
            <span class="globe-title">Globe Settings</span>
            <span class="globe-hint">Globe projection is active on the map</span>
        </div>

        <div class="globe-body">

            <!-- Atmosphere -->
            <section class="globe-section">
                <div class="globe-section-title">Atmosphere</div>
                <label class="globe-row">
                    <span>Fog &amp; Atmosphere</span>
                    <input type="checkbox" v-model="fogEnabled" @change="toggleFog" />
                </label>
                <label class="globe-row">
                    <span>Sky Layer</span>
                    <input type="checkbox" v-model="skyEnabled" @change="toggleSky" />
                </label>
                <label class="globe-row">
                    <span>Star Intensity</span>
                    <input
                        type="range" min="0" max="1" step="0.05"
                        v-model.number="starIntensity"
                        @input="updateFog"
                        :disabled="!fogEnabled"
                    />
                    <span class="val">{{ starIntensity.toFixed(2) }}</span>
                </label>
            </section>

            <!-- Terrain -->
            <section class="globe-section">
                <div class="globe-section-title">Terrain</div>
                <label class="globe-row">
                    <span>3D Terrain</span>
                    <input type="checkbox" v-model="terrainEnabled" @change="toggleTerrain" />
                </label>
                <div v-if="terrainEnabled" class="globe-row">
                    <span>DEM source URL</span>
                    <input
                        v-model="demUrl"
                        class="globe-input"
                        placeholder="https://your-server/dem/{z}/{x}/{y}.png"
                        @change="applyTerrain"
                    />
                </div>
                <label class="globe-row">
                    <span>Exaggeration</span>
                    <input
                        type="range" min="0.5" max="3" step="0.1"
                        v-model.number="exaggeration"
                        @input="applyTerrain"
                        :disabled="!terrainEnabled"
                    />
                    <span class="val">{{ exaggeration.toFixed(1) }}×</span>
                </label>
            </section>

            <!-- Tip -->
            <div class="globe-tip">
                <strong>Quest 3 / XR:</strong> Use the <em>XR View</em> plugin to enter
                WebXR mode with 3D Tiles. Globe projection stays active on the flat map.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'

// Map is injected by the CloudTAK host via provide('map', ...)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = inject<any>('map')

const fogEnabled     = ref(true)
const skyEnabled     = ref(true)
const starIntensity  = ref(0.18)
const terrainEnabled = ref(false)
const demUrl         = ref('')
const exaggeration   = ref(1.5)

const FOG_CONFIG = () => ({
    range:            [0.5, 10] as [number, number],
    'horizon-blend':  0.08,
    color:            'rgba(138, 178, 220, 0.6)',
    'high-color':     '#1a4a9e',
    'space-color':    '#060b1a',
    'star-intensity': starIntensity.value,
})

function toggleFog() {
    if (!map) return
    map.setFog(fogEnabled.value ? FOG_CONFIG() : {})
}

function updateFog() {
    if (!map || !fogEnabled.value) return
    map.setFog(FOG_CONFIG())
}

function toggleSky() {
    if (!map) return
    if (skyEnabled.value) {
        if (!map.getLayer('onemind-sky')) {
            map.addLayer({
                id:   'onemind-sky',
                type: 'sky',
                paint: {
                    'sky-type':             'atmosphere',
                    'sky-atmosphere-color': 'rgba(85, 151, 220, 0.75)',
                    'sky-atmosphere-halo-color': 'rgba(135, 196, 255, 0.57)',
                    'sky-atmosphere-sun-intensity': 5,
                },
            } as Parameters<typeof map.addLayer>[0])
        }
    } else {
        if (map.getLayer('onemind-sky')) map.removeLayer('onemind-sky')
    }
}

function toggleTerrain() {
    if (!map) return
    if (terrainEnabled.value && demUrl.value) {
        applyTerrain()
    } else {
        map.setTerrain(null)
        if (map.getSource('onemind-dem')) map.removeSource('onemind-dem')
    }
}

function applyTerrain() {
    if (!map || !terrainEnabled.value || !demUrl.value) return
    if (!map.getSource('onemind-dem')) {
        map.addSource('onemind-dem', {
            type:     'raster-dem',
            tiles:    [demUrl.value],
            tileSize: 256,
            encoding: 'terrarium',
        })
    }
    map.setTerrain({ source: 'onemind-dem', exaggeration: exaggeration.value })
}
</script>

<style scoped>
.globe-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 13px;
}

.globe-header {
    padding: 12px 14px;
    border-bottom: 1px solid #21262d;
    background: #161b22;
    flex-shrink: 0;
}

.globe-title {
    font-weight: 600;
    font-size: 14px;
    display: block;
}

.globe-hint {
    color: #6e7681;
    font-size: 11px;
}

.globe-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.globe-section {
    border: 1px solid #21262d;
    border-radius: 6px;
    overflow: hidden;
}

.globe-section-title {
    background: #161b22;
    padding: 7px 12px;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8b949e;
}

.globe-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid #161b22;
    cursor: pointer;
}

.globe-row:last-child { border-bottom: none; }

.globe-row span:first-child { flex: 1; }

.val {
    min-width: 36px;
    text-align: right;
    color: #6e7681;
    font-size: 11px;
}

.globe-input {
    flex: 1;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 4px;
    color: #c9d1d9;
    padding: 4px 8px;
    font-size: 11px;
}

.globe-tip {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 12px;
    color: #8b949e;
    line-height: 1.5;
}
</style>
