<template>
    <div ref="container" class="xr-canvas-container">
        <canvas ref="canvas" class="xr-canvas" />
        <div v-if="store.sessionMode === 'none'" class="xr-hud">
            <span :class="['dot', store.natsConnected ? 'dot--green' : 'dot--red']" />
            {{ store.natsConnected ? 'NATS live' : 'NATS offline' }}
            &nbsp;·&nbsp;
            {{ store.entityList.length }} entities
            &nbsp;·&nbsp;
            {{ store.tilesets.filter(t => t.visible).length }} tileset{{ store.tilesets.filter(t => t.visible).length !== 1 ? 's' : '' }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useXrStore } from './store'
import {
    initScene, destroyScene, onFrame, resizeRenderer,
    getCamera, getRenderer, getScene,
} from './renderer'
import { mountTileset, unmountTileset, tickTilesets } from './tiles'
import { upsertEntityMesh, clearAllEntities } from './entities'

const container = ref<HTMLDivElement>()
const canvas    = ref<HTMLCanvasElement>()
const store     = useXrStore()

let cleanupFrame: (() => void) | null     = null
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
    if (!canvas.value) return

    const { renderer, scene, camera } = await initScene(canvas.value)

    // Mount already-visible tilesets
    for (const ts of store.tilesets.filter(t => t.visible)) {
        await mountTileset(ts.id, ts.url, scene, camera, renderer)
    }

    // Inject WebXR buttons directly into this container
    if (store.vrSupported) {
        const { VRButton } = await import('three/examples/jsm/webxr/VRButton.js')
        const btn = VRButton.createButton(renderer)
        applyBtnStyle(btn, 'left')
        container.value?.appendChild(btn)
        renderer.xr.addEventListener('sessionstart', () => { store.sessionMode = 'vr' })
        renderer.xr.addEventListener('sessionend',   () => { store.sessionMode = 'none' })
    }

    if (store.arSupported) {
        const { ARButton } = await import('three/examples/jsm/webxr/ARButton.js')
        const btn = ARButton.createButton(renderer, {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['local-floor', 'bounded-floor'],
        })
        applyBtnStyle(btn, 'right')
        container.value?.appendChild(btn)
        renderer.xr.addEventListener('sessionstart', () => { store.sessionMode = 'ar' })
    }

    // Per-frame tile updates
    cleanupFrame = onFrame(() => {
        const cam = getCamera()
        const rdr = getRenderer()
        if (cam && rdr) tickTilesets(cam, rdr)
    })

    // Sync entity meshes
    watch(
        () => [...store.entities.values()],
        async (list) => {
            const sc = getScene()
            if (!sc) return
            for (const e of list) await upsertEntityMesh(e, sc)
        },
        { deep: true }
    )

    // Sync tileset visibility
    watch(
        () => store.tilesets.map(t => ({ id: t.id, url: t.url, visible: t.visible })),
        async (list) => {
            const sc  = getScene()
            const cam = getCamera()
            const rdr = getRenderer()
            if (!sc || !cam || !rdr) return
            for (const ts of list) {
                if (ts.visible) await mountTileset(ts.id, ts.url, sc, cam, rdr)
                else unmountTileset(ts.id, sc)
            }
        },
        { deep: true }
    )

    resizeObserver = new ResizeObserver(entries => {
        const e = entries[0]
        if (e) resizeRenderer(e.contentRect.width, e.contentRect.height)
    })
    resizeObserver.observe(container.value!)
})

onBeforeUnmount(() => {
    cleanupFrame?.()
    resizeObserver?.disconnect()
    const sc = getScene()
    if (sc) clearAllEntities(sc)
    destroyScene()
})

function applyBtnStyle(btn: HTMLElement, side: 'left' | 'right') {
    Object.assign(btn.style, {
        position:  'absolute',
        bottom:    '20px',
        [side]:    '50%',
        transform: side === 'left' ? 'translateX(-50%)' : 'translateX(50%)',
        zIndex:    '10',
    })
}
</script>

<style scoped>
.xr-canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #060b1a;
    overflow: hidden;
}
.xr-canvas {
    display: block;
    width: 100%;
    height: 100%;
}
.xr-hud {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.55);
    color: #e0e0e0;
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 5px;
    pointer-events: none;
}
.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
}
.dot--green { background: #4caf50; }
.dot--red   { background: #f44336; }
</style>
