<template>
    <div class="tf">
        <div class="tf-header">
            <span class="tf-title">Time Window</span>
            <span :class="['tf-badge', isLive ? 'tf-badge--live' : 'tf-badge--off']">
                {{ isLive ? 'LIVE' : 'PAUSED' }}
            </span>
        </div>

        <div class="tf-presets">
            <button
                v-for="p in PRESETS" :key="p.label"
                class="tf-preset"
                @click="onPreset(p.ms)"
            >{{ p.label }}</button>
        </div>

        <div class="tf-sliders">
            <div class="tf-row">
                <span class="tf-label">From</span>
                <span class="tf-time">{{ formattedStart }}</span>
            </div>
            <input
                type="range"
                class="tf-slider"
                :min="epochMin"
                :max="epochNow"
                :step="60_000"
                :value="timeRangeStart"
                @input="onStartInput"
            />

            <div class="tf-row">
                <span class="tf-label">To</span>
                <span class="tf-time">{{ formattedEnd }}</span>
            </div>
            <input
                type="range"
                class="tf-slider"
                :min="epochMin"
                :max="epochNow"
                :step="60_000"
                :value="timeRangeEnd"
                @input="onEndInput"
            />
        </div>

        <div class="tf-actions">
            <button
                :class="['tf-btn', isLive ? 'tf-btn--active' : '']"
                @click="toggleLive"
            >{{ isLive ? 'Live On' : 'Go Live' }}</button>
            <button class="tf-btn tf-btn--apply" @click="applyFilter">Apply Filter</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import {
    PRESETS, isLive, isEnabled,
    timeRangeStart, timeRangeEnd,
    formattedStart, formattedEnd,
} from '../state'
import { applyTemporalFilter } from './filter'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = inject<any>('map')

const epochNow = ref(Date.now())
const epochMin = Date.now() - 7 * 86400_000

function onStartInput(e: Event) {
    timeRangeStart.value = Number((e.target as HTMLInputElement).value)
    if (isLive.value) isLive.value = false
}

function onEndInput(e: Event) {
    timeRangeEnd.value = Number((e.target as HTMLInputElement).value)
    if (isLive.value) isLive.value = false
}

function toggleLive() {
    isLive.value = !isLive.value
    if (isLive.value) {
        const now = Date.now()
        timeRangeEnd.value = now
        epochNow.value = now
    }
}

function onPreset(ms: number) {
    const now = Date.now()
    timeRangeStart.value = now - ms
    timeRangeEnd.value   = now
    epochNow.value       = now
    isLive.value         = true
    applyFilter()
}

function applyFilter() {
    if (!map || !isEnabled.value) return
    epochNow.value = Date.now()
    applyTemporalFilter(map, timeRangeStart.value, timeRangeEnd.value)
}
</script>

<style scoped>
.tf {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 12px;
    min-width: 280px;
}

.tf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.tf-title { font-weight: 600; font-size: 13px; }

.tf-badge {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
}

.tf-badge--live { background: #166534; color: #4ade80; }
.tf-badge--off  { background: #1f2937; color: #6b7280; }

.tf-presets {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.tf-preset {
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid #30363d;
    background: #21262d;
    color: #c9d1d9;
    cursor: pointer;
    font-size: 11px;
}

.tf-preset:hover { border-color: #1f6feb; color: #58a6ff; }

.tf-sliders {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.tf-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
}

.tf-label { color: #8b949e; }
.tf-time  { color: #c9d1d9; font-family: monospace; }

.tf-slider {
    width: 100%;
    accent-color: #1f6feb;
    cursor: pointer;
}

.tf-actions {
    display: flex;
    gap: 6px;
}

.tf-btn {
    flex: 1;
    padding: 5px 8px;
    border-radius: 4px;
    border: 1px solid #30363d;
    background: #21262d;
    color: #c9d1d9;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
}

.tf-btn--active { background: #0d2d16; border-color: #166534; color: #4ade80; }
.tf-btn--apply  { background: #0c2461; border-color: #1f6feb; color: #58a6ff; }
.tf-btn--apply:hover { background: #1f6feb; color: #fff; }
</style>
