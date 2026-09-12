<template>
    <div class="ps-panel">
        <div class="ps-header">
            <span class="ps-title">360° Panorama Library</span>
            <span class="ps-hint">Saved panoramas anchored to map positions</span>
        </div>

        <div class="ps-body">
            <!-- Add panorama -->
            <section class="ps-section">
                <div class="ps-section-header">
                    <span>Add Panorama</span>
                    <button class="btn-icon" @click="showForm = !showForm">+</button>
                </div>

                <form v-if="showForm" class="ps-form" @submit.prevent="addPano">
                    <input v-model="form.label"    placeholder="Label (e.g. Gate A entry)" required />
                    <input v-model="form.imageUrl" placeholder="Equirectangular image URL" required />
                    <div class="ps-coords">
                        <input v-model.number="form.lng" placeholder="Longitude" type="number" step="any" required />
                        <input v-model.number="form.lat" placeholder="Latitude"  type="number" step="any" required />
                    </div>
                    <div class="ps-form-actions">
                        <button type="submit">Save</button>
                        <button type="button" @click="showForm = false">Cancel</button>
                    </div>
                </form>
            </section>

            <!-- Panorama list -->
            <section class="ps-section">
                <div class="ps-section-header">
                    <span>Library</span>
                    <span class="ps-count">{{ panos.length }}</span>
                </div>

                <div v-if="panos.length === 0" class="ps-empty">
                    No panoramas saved. Add one above.
                </div>

                <ul class="ps-list">
                    <li v-for="p in panos" :key="p.id" class="ps-item">
                        <div class="ps-item-info">
                            <span class="ps-item-label">{{ p.label }}</span>
                            <span class="ps-item-coords">{{ p.lat.toFixed(5) }}, {{ p.lng.toFixed(5) }}</span>
                        </div>
                        <div class="ps-item-actions">
                            <button class="btn-enter" @click="enterPano(p)">Enter</button>
                            <button class="btn-remove" @click="removePano(p.id)">✕</button>
                        </div>
                    </li>
                </ul>
            </section>

            <div class="ps-tip">
                <strong>Tip:</strong> Use the floating <em>360° View</em> panel to quickly enter
                any URL without saving. Click <em>Enter</em> for an immersive view anchored at
                the given coordinates.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'

interface PanoEntry {
    id: string
    label: string
    imageUrl: string
    lng: number
    lat: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = inject<any>('map')

const panos    = ref<PanoEntry[]>([])
const showForm = ref(false)
const form     = ref({ label: '', imageUrl: '', lng: null as number | null, lat: null as number | null })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let photosphere: any = null

function addPano() {
    panos.value.push({
        id:       `pano-${Date.now()}`,
        label:    form.value.label,
        imageUrl: form.value.imageUrl,
        lng:      form.value.lng!,
        lat:      form.value.lat!,
    })
    form.value   = { label: '', imageUrl: '', lng: null, lat: null }
    showForm.value = false
}

function removePano(id: string) {
    panos.value = panos.value.filter(p => p.id !== id)
}

async function enterPano(p: PanoEntry) {
    if (!map) return
    const { Photosphere } = await import('maplibre-gl-photosphere')
    if (!photosphere) photosphere = new Photosphere(map)
    photosphere.enter({ lngLat: { lng: p.lng, lat: p.lat }, imageUrl: p.imageUrl })
}
</script>

<style scoped>
.ps-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 13px;
}

.ps-header {
    padding: 12px 14px;
    border-bottom: 1px solid #21262d;
    background: #161b22;
    flex-shrink: 0;
}

.ps-title { font-weight: 600; font-size: 14px; display: block; }
.ps-hint  { color: #6e7681; font-size: 11px; }

.ps-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.ps-section {
    border: 1px solid #21262d;
    border-radius: 6px;
    overflow: hidden;
}

.ps-section-header {
    background: #161b22;
    padding: 7px 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.ps-count {
    background: #1f6feb;
    color: #fff;
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 11px;
}

.ps-empty {
    padding: 12px;
    color: #6e7681;
    font-size: 12px;
}

.ps-form {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-bottom: 1px solid #21262d;
}

.ps-form input {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 4px;
    color: #c9d1d9;
    padding: 5px 8px;
    font-size: 12px;
}

.ps-coords { display: flex; gap: 6px; }
.ps-coords input { flex: 1; }

.ps-form-actions { display: flex; gap: 6px; }

.ps-form-actions button {
    padding: 4px 12px;
    border-radius: 4px;
    border: 1px solid #30363d;
    background: #21262d;
    color: #c9d1d9;
    cursor: pointer;
    font-size: 12px;
}

.ps-form-actions button[type="submit"] {
    background: #1f6feb;
    border-color: #1f6feb;
    color: #fff;
}

.ps-list { list-style: none; margin: 0; padding: 0; }

.ps-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #161b22;
    gap: 8px;
}

.ps-item:last-child { border-bottom: none; }

.ps-item-info { flex: 1; min-width: 0; }
.ps-item-label { font-weight: 600; font-size: 12px; display: block; }
.ps-item-coords { color: #6e7681; font-size: 11px; }

.ps-item-actions { display: flex; gap: 6px; flex-shrink: 0; }

.btn-enter {
    padding: 3px 10px;
    border-radius: 4px;
    border: 1px solid #1f6feb;
    background: transparent;
    color: #1f6feb;
    cursor: pointer;
    font-size: 11px;
}

.btn-remove {
    background: transparent;
    border: none;
    color: #6e7681;
    cursor: pointer;
    padding: 2px 4px;
    font-size: 11px;
}

.btn-remove:hover { color: #f85149; }

.btn-icon {
    background: #21262d;
    border: 1px solid #30363d;
    color: #c9d1d9;
    border-radius: 4px;
    width: 22px;
    height: 22px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ps-tip {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 12px;
    color: #8b949e;
    line-height: 1.5;
}
</style>
