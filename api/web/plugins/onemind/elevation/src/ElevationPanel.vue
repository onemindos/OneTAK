<template>
    <div class="ep">
        <div class="ep-header">
            <span class="ep-title">Terrain Elevation</span>
            <span class="ep-hint">Click map points to sample terrain height</span>
        </div>

        <div class="ep-body">
            <section class="ep-section">
                <div class="ep-section-header">
                    <span>Recent Points</span>
                    <span class="ep-count">{{ readings.length }}</span>
                    <button v-if="readings.length" class="ep-action" @click="exportCsv">Export CSV</button>
                </div>

                <div v-if="!readings.length" class="ep-empty">
                    No readings yet — click points on the map.
                </div>

                <ul v-else class="ep-list">
                    <li v-for="r in readings" :key="r.ts" class="ep-row">
                        <div class="ep-row-info">
                            <span class="ep-row-coords">{{ r.lat.toFixed(5) }}, {{ r.lng.toFixed(5) }}</span>
                            <span class="ep-row-elev">
                                <template v-if="r.elev !== null">
                                    {{ r.elev.toFixed(1) }} m &nbsp;/&nbsp; {{ toFt(r.elev) }} ft
                                </template>
                                <template v-else>unavailable</template>
                            </span>
                        </div>
                        <div class="ep-row-actions">
                            <button class="ep-btn" @click="copyRow(r)">Copy</button>
                            <button class="ep-btn" @click="flyTo(r)">Fly</button>
                        </div>
                    </li>
                </ul>
            </section>

            <section class="ep-section">
                <div class="ep-section-header">How it works</div>
                <div class="ep-info">
                    <p>Elevation is queried from <strong>terrain tiles</strong> when available (enable the Globe plugin or terrain in map settings).</p>
                    <p>Falls back to the <strong>Valhalla height API</strong> (our self-hosted routing server) when no terrain is loaded — results are OSM/SRTM accuracy.</p>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { readings } from './state'
import type { ElevPoint } from './state'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = inject<any>('map')

function toFt(m: number) { return Math.round(m * 3.28084).toLocaleString() }

function copyRow(r: ElevPoint) {
    const text = `${r.lat},${r.lng},${r.elev ?? ''}`
    navigator.clipboard.writeText(text).catch(() => {})
}

function flyTo(r: ElevPoint) {
    map?.flyTo({ center: [r.lng, r.lat], zoom: 14 })
}

function exportCsv() {
    const header = 'lat,lng,elevation_m,elevation_ft,timestamp'
    const rows   = readings.value.map(r =>
        `${r.lat},${r.lng},${r.elev ?? ''},${r.elev != null ? Math.round(r.elev * 3.28084) : ''},${new Date(r.ts).toISOString()}`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'elevation.csv' })
    a.click()
    URL.revokeObjectURL(url)
}
</script>

<style scoped>
.ep {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 13px;
}

.ep-header {
    padding: 12px 14px;
    border-bottom: 1px solid #21262d;
    background: #161b22;
    flex-shrink: 0;
}

.ep-title { font-weight: 600; font-size: 14px; display: block; }
.ep-hint  { color: #6e7681; font-size: 11px; }

.ep-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.ep-section {
    border: 1px solid #21262d;
    border-radius: 6px;
    overflow: hidden;
}

.ep-section-header {
    background: #161b22;
    padding: 7px 12px;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8b949e;
    display: flex;
    align-items: center;
    gap: 8px;
}

.ep-count {
    background: #1f6feb;
    color: #fff;
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 11px;
}

.ep-action {
    margin-left: auto;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #30363d;
    background: #21262d;
    color: #c9d1d9;
    cursor: pointer;
    font-size: 11px;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
}

.ep-empty {
    padding: 12px;
    color: #6e7681;
    font-size: 12px;
}

.ep-list { list-style: none; margin: 0; padding: 0; }

.ep-row {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #161b22;
    gap: 8px;
}

.ep-row:last-child { border-bottom: none; }

.ep-row-info { flex: 1; min-width: 0; }

.ep-row-coords {
    font-family: monospace;
    font-size: 11px;
    color: #8b949e;
    display: block;
}

.ep-row-elev {
    font-size: 13px;
    font-weight: 600;
    color: #1f6feb;
}

.ep-row-actions { display: flex; gap: 4px; flex-shrink: 0; }

.ep-btn {
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid #30363d;
    background: #21262d;
    color: #c9d1d9;
    cursor: pointer;
    font-size: 11px;
}

.ep-btn:hover { background: #30363d; }

.ep-info {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: #8b949e;
    line-height: 1.5;
}

.ep-info p { margin: 0; }
.ep-info strong { color: #c9d1d9; }
</style>
