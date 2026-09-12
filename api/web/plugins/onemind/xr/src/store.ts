import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TilesetEntry, XrEntityState } from './types'

export const useXrStore = defineStore('onemind-xr', () => {
    const tilesets     = ref<TilesetEntry[]>([])
    const entities     = ref(new Map<string, XrEntityState>())
    const sessionMode  = ref<'none' | 'vr' | 'ar'>('none')
    const natsConnected = ref(false)
    const vrSupported  = ref(false)
    const arSupported  = ref(false)

    function addTileset(entry: TilesetEntry) {
        if (!tilesets.value.find(t => t.id === entry.id)) {
            tilesets.value.push(entry)
        }
    }

    function removeTileset(id: string) {
        tilesets.value = tilesets.value.filter(t => t.id !== id)
    }

    function toggleTileset(id: string) {
        const t = tilesets.value.find(t => t.id === id)
        if (t) t.visible = !t.visible
    }

    function upsertEntity(e: XrEntityState) {
        entities.value.set(e.uid, e)
    }

    const entityList = computed(() => [...entities.value.values()])

    async function detectXrSupport() {
        if (!navigator.xr) return
        vrSupported.value = await navigator.xr.isSessionSupported('immersive-vr').catch(() => false)
        arSupported.value = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false)
    }

    return {
        tilesets, entities, sessionMode, natsConnected, vrSupported, arSupported,
        addTileset, removeTileset, toggleTileset, upsertEntity, entityList, detectXrSupport,
    }
})
