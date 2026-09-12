<template>
    <div class="pf">
        <div v-if="!active" class="pf-form">
            <input
                v-model="imageUrl"
                class="pf-input"
                placeholder="Equirectangular image URL"
            />
            <div class="pf-coords">
                <input v-model.number="lng" class="pf-coord" placeholder="Lng" type="number" step="any" />
                <input v-model.number="lat" class="pf-coord" placeholder="Lat" type="number" step="any" />
            </div>
            <button class="pf-btn pf-btn--enter" :disabled="!imageUrl || !lng || !lat" @click="enter">
                Enter 360°
            </button>
        </div>
        <div v-else class="pf-active">
            <span class="pf-active-label">Inside 360° view</span>
            <button class="pf-btn pf-btn--exit" @click="exitSphere">Exit</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, inject, onBeforeUnmount } from 'vue'
import type { Map } from 'maplibre-gl'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map    = inject<any>('map') as Map & Record<string, any>
const active = ref(false)
const imageUrl = ref('')
const lng      = ref<number | null>(null)
const lat      = ref<number | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let photosphere: any = null

async function enter() {
    if (!imageUrl.value || lng.value === null || lat.value === null || !map) return
    const { Photosphere } = await import('maplibre-gl-photosphere')
    if (!photosphere) {
        photosphere = new Photosphere(map)
    }
    photosphere.enter({
        lngLat:   { lng: lng.value, lat: lat.value },
        imageUrl: imageUrl.value,
    })
    active.value = true
}

function exitSphere() {
    photosphere?.exit()
    active.value = false
}

onBeforeUnmount(() => {
    if (active.value) exitSphere()
})
</script>

<style scoped>
.pf {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #0d1117;
    color: #c9d1d9;
}

.pf-form {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.pf-input, .pf-coord {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 4px;
    color: #c9d1d9;
    padding: 5px 8px;
    font-size: 12px;
    width: 100%;
    box-sizing: border-box;
}

.pf-coords {
    display: flex;
    gap: 6px;
}

.pf-coord { width: 50%; }

.pf-btn {
    padding: 6px 14px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
}

.pf-btn--enter { background: #1f6feb; color: #fff; }
.pf-btn--enter:disabled { opacity: 0.5; cursor: not-allowed; }
.pf-btn--exit  { background: #b91c1c; color: #fff; width: 100%; }

.pf-active {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.pf-active-label {
    font-size: 12px;
    color: #4caf50;
    font-weight: 600;
}
</style>
