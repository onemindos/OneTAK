<template>
    <div class="gc-panel">
        <div class="gc-header">
            <span class="gc-title">Place Search</span>
            <span class="gc-hint">Type to search via your Nominatim server</span>
        </div>

        <div class="gc-body">
            <section class="gc-section">
                <div class="gc-section-header">
                    <span>Recent Searches</span>
                    <div class="gc-header-actions">
                        <span class="gc-count">{{ recent.length }}</span>
                        <button v-if="recent.length" class="btn-clear" @click="clearHistory">Clear</button>
                    </div>
                </div>

                <div v-if="recent.length === 0" class="gc-empty">
                    No recent searches yet.
                </div>

                <ul v-else class="gc-list">
                    <li
                        v-for="item in recent"
                        :key="item.id"
                        class="gc-item"
                        @click="flyTo(item)"
                    >
                        <div class="gc-item-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                        <div class="gc-item-info">
                            <span class="gc-item-name">{{ item.name }}</span>
                            <span class="gc-item-coords">{{ item.lng.toFixed(5) }}, {{ item.lat.toFixed(5) }}</span>
                        </div>
                    </li>
                </ul>
            </section>

            <div class="gc-tip">
                <strong>How to use:</strong> The search box appears in the <em>top-left</em> of the map.
                Type any address, place name, or coordinates to find and fly to a location.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'

interface RecentEntry {
    id:   string
    name: string
    lng:  number
    lat:  number
}

const STORAGE_KEY = 'geocoder-recent'
const MAX_RECENT  = 10

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map    = inject<any>('map')
const recent = ref<RecentEntry[]>([])

function loadRecent(): RecentEntry[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    } catch {
        return []
    }
}

function saveRecent(entries: RecentEntry[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function clearHistory() {
    recent.value = []
    saveRecent([])
}

function flyTo(item: RecentEntry) {
    map?.flyTo({ center: [item.lng, item.lat], zoom: 14 })
}

onMounted(() => {
    recent.value = loadRecent()

    // Listen for geocoder result events to build history
    // MaplibreGeocoder fires a custom event on the map container
    const container = map?.getContainer?.()
    if (!container) return
    const handler = (e: Event) => {
        const detail = (e as CustomEvent).detail
        if (!detail?.result) return
        const r      = detail.result
        const center = r.center ?? r.geometry?.coordinates
        if (!center) return
        const entry: RecentEntry = {
            id:   `r-${Date.now()}`,
            name: r.place_name ?? r.text ?? 'Unknown',
            lng:  center[0],
            lat:  center[1],
        }
        const updated = [entry, ...recent.value.filter(x => x.name !== entry.name)].slice(0, MAX_RECENT)
        recent.value  = updated
        saveRecent(updated)
    }
    container.addEventListener('geocoder:result', handler)
})
</script>

<style scoped>
.gc-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 13px;
}

.gc-header {
    padding: 12px 14px;
    border-bottom: 1px solid #21262d;
    background: #161b22;
    flex-shrink: 0;
}

.gc-title { font-weight: 600; font-size: 14px; display: block; }
.gc-hint  { color: #6e7681; font-size: 11px; }

.gc-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.gc-section {
    border: 1px solid #21262d;
    border-radius: 6px;
    overflow: hidden;
}

.gc-section-header {
    background: #161b22;
    padding: 7px 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.gc-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.gc-count {
    background: #1f6feb;
    color: #fff;
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 11px;
}

.btn-clear {
    background: transparent;
    border: 1px solid #30363d;
    color: #8b949e;
    border-radius: 4px;
    padding: 1px 8px;
    font-size: 11px;
    cursor: pointer;
}
.btn-clear:hover { color: #f85149; border-color: #f85149; }

.gc-empty {
    padding: 12px;
    color: #6e7681;
    font-size: 12px;
}

.gc-list { list-style: none; margin: 0; padding: 0; }

.gc-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid #161b22;
    cursor: pointer;
    transition: background 0.1s;
}
.gc-item:last-child { border-bottom: none; }
.gc-item:hover { background: #161b22; }

.gc-item-icon { color: #1f6feb; flex-shrink: 0; }

.gc-item-info { flex: 1; min-width: 0; }
.gc-item-name {
    font-size: 12px;
    font-weight: 500;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.gc-item-coords { color: #6e7681; font-size: 11px; }

.gc-tip {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 12px;
    color: #8b949e;
    line-height: 1.5;
}
</style>
