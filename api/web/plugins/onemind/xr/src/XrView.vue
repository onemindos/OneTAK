<template>
    <div class="xr-view">
        <div class="xr-header">
            <span class="xr-title">XR / Immersive View</span>
            <div class="xr-badges">
                <span v-if="store.vrSupported"  class="badge badge--vr">VR</span>
                <span v-if="store.arSupported"  class="badge badge--ar">AR</span>
                <span v-if="!store.vrSupported && !store.arSupported" class="badge badge--none">
                    WebXR unavailable
                </span>
                <span :class="['badge', store.natsConnected ? 'badge--live' : 'badge--off']">
                    NATS {{ store.natsConnected ? '●' : '○' }}
                </span>
            </div>
        </div>

        <!-- Three.js canvas -->
        <div class="xr-canvas-wrapper">
            <XrCanvas />
        </div>

        <!-- Config controls -->
        <div class="xr-controls">

            <!-- Tilesets -->
            <section class="xr-section">
                <div class="xr-section-header">
                    <span>3D Tile Sources</span>
                    <button class="btn-icon" title="Add tileset" @click="showAddForm = !showAddForm">+</button>
                </div>

                <form v-if="showAddForm" class="xr-add-form" @submit.prevent="addTileset">
                    <input v-model="newLabel" placeholder="Label (e.g. Site Survey)" required />
                    <input v-model="newUrl"   placeholder="tileset.json URL" required />
                    <button type="submit">Add</button>
                    <button type="button" @click="showAddForm = false">Cancel</button>
                </form>

                <div v-if="store.tilesets.length === 0" class="xr-empty">
                    No tilesets added yet. Paste a <code>tileset.json</code> URL.
                </div>

                <ul class="xr-list">
                    <li v-for="ts in store.tilesets" :key="ts.id" class="xr-list-item">
                        <label>
                            <input type="checkbox" :checked="ts.visible" @change="store.toggleTileset(ts.id)" />
                            {{ ts.label }}
                        </label>
                        <span class="xr-url">{{ ts.url }}</span>
                        <button class="btn-remove" @click="store.removeTileset(ts.id)">✕</button>
                    </li>
                </ul>
            </section>

            <!-- Live entities -->
            <section class="xr-section">
                <div class="xr-section-header">
                    <span>Live Entities</span>
                    <span class="xr-count">{{ store.entityList.length }}</span>
                </div>
                <div v-if="store.entityList.length === 0" class="xr-empty">
                    Listening on <code>ent.*.*.state</code> — no entities yet.
                </div>
                <ul v-else class="xr-list xr-entities">
                    <li
                        v-for="e in store.entityList.slice(0, 60)"
                        :key="e.uid"
                        :class="['xr-list-item', e.stale ? 'stale' : '']"
                    >
                        <span class="callsign">{{ e.callsign }}</span>
                        <span class="coords">{{ e.lat.toFixed(4) }}, {{ e.lon.toFixed(4) }}</span>
                        <span class="cot-type">{{ e.type }}</span>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useXrStore } from './store'
import XrCanvas from './XrCanvas.vue'

const store = useXrStore()

const showAddForm = ref(false)
const newLabel    = ref('')
const newUrl      = ref('')

onMounted(() => store.detectXrSupport())

function addTileset() {
    store.addTileset({
        id:      `ts-${Date.now()}`,
        label:   newLabel.value.trim(),
        url:     newUrl.value.trim(),
        visible: true,
    })
    newLabel.value    = ''
    newUrl.value      = ''
    showAddForm.value = false
}
</script>

<style scoped>
.xr-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 13px;
    overflow: hidden;
}

.xr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid #21262d;
    background: #161b22;
    flex-shrink: 0;
}

.xr-title { font-weight: 600; font-size: 14px; }

.xr-badges { display: flex; gap: 6px; }

.badge {
    padding: 2px 7px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}
.badge--vr   { background: #1f6feb; color: #fff; }
.badge--ar   { background: #238636; color: #fff; }
.badge--none { background: #30363d; color: #8b949e; }
.badge--live { background: #1a4a1a; color: #4caf50; }
.badge--off  { background: #30363d; color: #8b949e; }

.xr-canvas-wrapper {
    height: 300px;
    flex-shrink: 0;
}

.xr-controls {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.xr-section {
    border: 1px solid #21262d;
    border-radius: 6px;
    overflow: hidden;
}

.xr-section-header {
    background: #161b22;
    padding: 7px 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.xr-count {
    background: #1f6feb;
    color: #fff;
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 11px;
}

.xr-empty {
    padding: 12px;
    color: #6e7681;
    font-size: 12px;
}

.xr-add-form {
    padding: 10px 12px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    border-bottom: 1px solid #21262d;
}

.xr-add-form input {
    flex: 1;
    min-width: 140px;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 4px;
    color: #c9d1d9;
    padding: 4px 8px;
    font-size: 12px;
}

.xr-add-form button {
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #30363d;
    background: #21262d;
    color: #c9d1d9;
    cursor: pointer;
    font-size: 12px;
}

.xr-add-form button[type="submit"] {
    background: #1f6feb;
    border-color: #1f6feb;
    color: #fff;
}

.xr-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.xr-list-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-bottom: 1px solid #161b22;
    font-size: 12px;
}

.xr-list-item:last-child { border-bottom: none; }

.xr-url {
    flex: 1;
    color: #6e7681;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.xr-entities .callsign  { font-weight: 600; min-width: 80px; }
.xr-entities .coords    { color: #6e7681; min-width: 110px; }
.xr-entities .cot-type  { color: #8b949e; font-size: 11px; }
.stale                  { opacity: 0.4; }
</style>
