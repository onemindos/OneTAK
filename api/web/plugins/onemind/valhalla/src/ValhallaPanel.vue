<template>
    <div class="valhalla-panel">
        <div class="valhalla-header">
            <span class="valhalla-title">Isochrone Analysis</span>
            <span class="valhalla-hint">Click anywhere on the map to generate travel time rings</span>
        </div>

        <div class="valhalla-body">
            <section class="valhalla-section">
                <div class="valhalla-section-title">Time Rings (minutes)</div>
                <div class="ring-grid">
                    <div v-for="ring in rings" :key="ring.time" class="ring-row">
                        <span class="ring-swatch" :style="{ background: '#' + ring.color }" />
                        <span class="ring-label">{{ ring.time }} min</span>
                        <span class="ring-dist">≈ {{ ring.distance }} km</span>
                    </div>
                </div>
            </section>

            <section class="valhalla-section">
                <div class="valhalla-section-title">Transport Mode</div>
                <div class="mode-grid">
                    <button
                        v-for="m in modes" :key="m.key"
                        :class="['mode-btn', activeMode === m.key ? 'mode-btn--active' : '']"
                        @click="activeMode = m.key"
                    >
                        {{ m.label }}
                    </button>
                </div>
            </section>

            <section class="valhalla-section">
                <div class="valhalla-section-title">Server</div>
                <div class="server-row">
                    <input v-model="serverUrl" class="server-input" placeholder="https://valhalla.onemindos.dev" />
                </div>
            </section>

            <div class="valhalla-tip">
                <strong>How to use:</strong> The isochrone control is in the <em>bottom-right</em> corner of the map.
                Click the clock icon (time) or distance icon, then click any point on the map.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const VALHALLA_URL = import.meta.env.VITE_VALHALLA_URL ?? 'https://valhalla.onemindos.dev'

const serverUrl  = ref(VALHALLA_URL)
const activeMode = ref('auto')

const rings = [
    { time: 5,  distance: 1,  color: 'ef4444' },
    { time: 15, distance: 3,  color: 'f59e0b' },
    { time: 30, distance: 8,  color: '22c55e' },
    { time: 60, distance: 20, color: '3b82f6' },
]

const modes = [
    { key: 'auto',        label: 'Car' },
    { key: 'pedestrian',  label: 'Foot' },
    { key: 'bicycle',     label: 'Bike' },
    { key: 'motor_scooter', label: 'Moto' },
]
</script>

<style scoped>
.valhalla-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 13px;
}

.valhalla-header {
    padding: 12px 14px;
    border-bottom: 1px solid #21262d;
    background: #161b22;
    flex-shrink: 0;
}

.valhalla-title {
    font-weight: 600;
    font-size: 14px;
    display: block;
}

.valhalla-hint { color: #6e7681; font-size: 11px; }

.valhalla-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.valhalla-section {
    border: 1px solid #21262d;
    border-radius: 6px;
    overflow: hidden;
}

.valhalla-section-title {
    background: #161b22;
    padding: 7px 12px;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8b949e;
}

.ring-grid { padding: 8px 12px; display: flex; flex-direction: column; gap: 6px; }

.ring-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
}

.ring-swatch {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    flex-shrink: 0;
}

.ring-label { flex: 1; }
.ring-dist  { color: #6e7681; }

.mode-grid {
    padding: 8px 12px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.mode-btn {
    padding: 4px 12px;
    border-radius: 4px;
    border: 1px solid #30363d;
    background: #21262d;
    color: #c9d1d9;
    cursor: pointer;
    font-size: 12px;
}

.mode-btn--active {
    background: #1f6feb;
    border-color: #1f6feb;
    color: #fff;
}

.server-row { padding: 8px 12px; }

.server-input {
    width: 100%;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 4px;
    color: #c9d1d9;
    padding: 4px 8px;
    font-size: 11px;
    box-sizing: border-box;
}

.valhalla-tip {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 12px;
    color: #8b949e;
    line-height: 1.5;
}
</style>
