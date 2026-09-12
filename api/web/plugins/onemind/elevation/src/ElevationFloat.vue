<template>
    <div class="ef">
        <div v-if="isQuerying" class="ef-state ef-querying">
            <span class="ef-spinner" />
            <span>Querying…</span>
        </div>
        <div v-else-if="!lastElevation" class="ef-state ef-idle">
            Click anywhere on the map to query elevation
        </div>
        <div v-else class="ef-result">
            <div class="ef-coords">
                {{ fmt(lastElevation.lat, 'lat') }}, {{ fmt(lastElevation.lng, 'lng') }}
            </div>
            <div v-if="lastElevation.elev !== null" class="ef-elev">
                <span class="ef-m">{{ lastElevation.elev.toFixed(1) }} m</span>
                <span class="ef-ft">{{ toFt(lastElevation.elev) }} ft</span>
            </div>
            <div v-else class="ef-unknown">Elevation unavailable</div>
        </div>

        <div v-if="readings.length > 1" class="ef-history">
            <div class="ef-history-title">Last {{ Math.min(readings.length, 5) }}</div>
            <div v-for="r in readings.slice(0, 5)" :key="r.ts" class="ef-history-row">
                <span class="ef-history-coords">{{ fmt(r.lat,'lat') }}, {{ fmt(r.lng,'lng') }}</span>
                <span class="ef-history-elev">{{ r.elev !== null ? r.elev.toFixed(0)+'m' : '?' }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { lastElevation, isQuerying, readings } from './state'

function toFt(m: number) { return Math.round(m * 3.28084).toLocaleString() }
function fmt(v: number, axis: 'lat' | 'lng') {
    const abs = Math.abs(v).toFixed(5)
    const dir = axis === 'lat' ? (v >= 0 ? 'N' : 'S') : (v >= 0 ? 'E' : 'W')
    return `${abs}°${dir}`
}
</script>

<style scoped>
.ef {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 12px;
    min-height: 60px;
}

.ef-state {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6e7681;
    font-size: 12px;
}

.ef-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid #30363d;
    border-top-color: #1f6feb;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

.ef-result {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.ef-coords {
    color: #8b949e;
    font-size: 11px;
    font-family: monospace;
}

.ef-elev {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.ef-m {
    font-size: 20px;
    font-weight: 700;
    color: #1f6feb;
}

.ef-ft {
    font-size: 12px;
    color: #6e7681;
}

.ef-unknown { color: #6e7681; font-style: italic; }

.ef-history {
    border-top: 1px solid #21262d;
    padding-top: 6px;
}

.ef-history-title {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6e7681;
    margin-bottom: 4px;
}

.ef-history-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    padding: 1px 0;
    color: #8b949e;
}

.ef-history-elev { color: #c9d1d9; }
</style>
