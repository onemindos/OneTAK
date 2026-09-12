// Three.js custom layer for MapLibre GL JS.
// Renders entity meshes on the 2D map canvas using the shared WebGL context.
// Entities are positioned with MercatorCoordinate so they stay locked to the map.

import * as THREE from 'three'
import { MercatorCoordinate } from 'maplibre-gl'
import type { XrEntityState } from '../../xr/src/types'

const LAYER_ID = 'onemind-three-entities'

// Mercator Y points down, so negate Y when scaling
const SCALE_SIGN = new THREE.Vector3(1, -1, 1)

interface EntityMesh {
    mesh:  THREE.Mesh
    label: THREE.Sprite
}

export class ThreeLayer {
    readonly id   = LAYER_ID
    readonly type = 'custom' as const
    readonly renderingMode = '3d' as const

    private map!:      maplibregl.Map
    private renderer!: THREE.WebGLRenderer
    private scene!:    THREE.Scene
    private camera!:   THREE.Camera

    private pool = new Map<string, EntityMesh>()

    onAdd(map: maplibregl.Map, gl: WebGLRenderingContext): void {
        this.map = map

        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas() as HTMLCanvasElement,
            context: gl,
            antialias: true,
        })
        this.renderer.autoClear = false
        this.renderer.shadowMap.enabled = false

        this.scene  = new THREE.Scene()
        this.camera = new THREE.Camera()

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 1.0)
        this.scene.add(ambient)
    }

    render(_gl: WebGLRenderingContext, matrix: number[]): void {
        const projMatrix = new THREE.Matrix4().fromArray(matrix)
        this.camera.projectionMatrix = projMatrix
        this.camera.projectionMatrixInverse.copy(projMatrix).invert()

        this.renderer.resetState()
        this.renderer.render(this.scene, this.camera)
        this.map.triggerRepaint()
    }

    onRemove(_map: maplibregl.Map, _gl: WebGLRenderingContext): void {
        this.clear()
        this.renderer.dispose()
    }

    upsertEntity(e: XrEntityState): void {
        const mc    = MercatorCoordinate.fromLngLat([e.lon, e.lat], e.hae ?? 0)
        const scale = mc.meterInMercatorCoordinateUnits()

        let entry = this.pool.get(e.uid)

        if (!entry) {
            let geo: THREE.BufferGeometry
            let color: number
            if (e.type.startsWith('a-f')) {
                geo   = new THREE.ConeGeometry(1.5, 4, 8)
                color = 0x2196f3
            } else if (e.type.startsWith('a-h')) {
                geo   = new THREE.SphereGeometry(2, 8, 8)
                color = 0xf44336
            } else {
                geo   = new THREE.OctahedronGeometry(2)
                color = 0xffc107
            }
            const mat  = new THREE.MeshPhongMaterial({ color })
            const mesh = new THREE.Mesh(geo, mat)
            mesh.matrixAutoUpdate = false

            // Callsign label
            const cvs = document.createElement('canvas')
            cvs.width  = 256
            cvs.height = 64
            const ctx = cvs.getContext('2d')!
            ctx.font       = 'bold 20px sans-serif'
            ctx.fillStyle  = '#ffffff'
            ctx.strokeStyle = 'rgba(0,0,0,0.7)'
            ctx.lineWidth  = 3
            ctx.textAlign  = 'center'
            ctx.strokeText(e.callsign, 128, 40)
            ctx.fillText(e.callsign, 128, 40)
            const tex    = new THREE.CanvasTexture(cvs)
            const label  = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }))
            label.matrixAutoUpdate = false
            mesh.add(label)

            this.scene.add(mesh)
            entry = { mesh, label }
            this.pool.set(e.uid, entry)
        }

        const S = scale * 50  // world-unit size in Mercator space (adjust for zoom)

        entry.mesh.matrix
            .makeTranslation(mc.x, mc.y, mc.z)
            .scale(SCALE_SIGN.clone().multiplyScalar(S))
        entry.mesh.matrixWorldNeedsUpdate = true

        // Label floats above the mesh
        entry.label.matrix
            .makeTranslation(0, 4, 0)
            .scale(new THREE.Vector3(3 * S, S, 1))
        entry.label.matrixWorldNeedsUpdate = true

        entry.mesh.visible = !e.stale
    }

    removeEntity(uid: string): void {
        const entry = this.pool.get(uid)
        if (entry) {
            this.scene.remove(entry.mesh)
            this.pool.delete(uid)
        }
    }

    clear(): void {
        for (const uid of [...this.pool.keys()]) this.removeEntity(uid)
    }

    get size(): number { return this.pool.size }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type maplibregl = any
