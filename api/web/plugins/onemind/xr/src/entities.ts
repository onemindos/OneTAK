// Converts WGS84 entity positions into Three.js scene objects.
// Uses a local ENU (East-North-Up) frame with the scene origin set
// to the first entity's position, or explicitly via setOrigin().

import type * as THREEType from 'three'
import type { XrEntityState } from './types'

// WGS84 constants
const A  = 6_378_137.0          // semi-major axis (m)
const E2 = 0.006_694_379_990_14 // first eccentricity squared

function wgs84ToEcef(lat: number, lon: number, hae: number): [number, number, number] {
    const phi    = (lat * Math.PI) / 180
    const lambda = (lon * Math.PI) / 180
    const N = A / Math.sqrt(1 - E2 * Math.sin(phi) ** 2)
    return [
        (N + hae) * Math.cos(phi) * Math.cos(lambda),
        (N + hae) * Math.cos(phi) * Math.sin(lambda),
        (N * (1 - E2) + hae) * Math.sin(phi),
    ]
}

// Scene origin in ECEF — set once on first entity or via setOrigin()
let originEcef: [number, number, number] | null = null

export function setOrigin(lat: number, lon: number, hae = 0): void {
    originEcef = wgs84ToEcef(lat, lon, hae)
}

// ENU offset from origin — returns Three.js XYZ (East=X, Up=Y, North=Z)
function toSceneXyz(lat: number, lon: number, hae: number): [number, number, number] {
    const ecef = wgs84ToEcef(lat, lon, hae)
    if (!originEcef) {
        originEcef = [...ecef] as [number, number, number]
        return [0, 0, 0]
    }
    const phi    = (lat * Math.PI) / 180
    const lambda = (lon * Math.PI) / 180
    const dx = ecef[0] - originEcef[0]
    const dy = ecef[1] - originEcef[1]
    const dz = ecef[2] - originEcef[2]
    // Rotate ECEF delta into ENU at origin
    const east  = -Math.sin(lambda) * dx + Math.cos(lambda) * dy
    const north = -Math.sin(phi) * Math.cos(lambda) * dx - Math.sin(phi) * Math.sin(lambda) * dy + Math.cos(phi) * dz
    const up    =  Math.cos(phi) * Math.cos(lambda) * dx + Math.cos(phi) * Math.sin(lambda) * dy + Math.sin(phi) * dz
    return [east, up, -north] // Three.js: X=east, Y=up, Z=south (right-hand)
}

const meshPool = new Map<string, THREEType.Mesh>()

export async function upsertEntityMesh(
    entity: XrEntityState,
    scene:  THREEType.Scene,
): Promise<void> {
    const THREE = await import('three')

    const [x, y, z] = toSceneXyz(entity.lat, entity.lon, entity.hae)

    let mesh = meshPool.get(entity.uid)
    if (!mesh) {
        // Friendly=blue cone, hostile=red sphere, unknown=yellow octahedron
        let geometry: THREEType.BufferGeometry
        let color: number
        if (entity.type.startsWith('a-f')) {
            geometry = new THREE.ConeGeometry(1.5, 4, 8)
            color = 0x2196f3
        } else if (entity.type.startsWith('a-h')) {
            geometry = new THREE.SphereGeometry(2, 8, 8)
            color = 0xf44336
        } else {
            geometry = new THREE.OctahedronGeometry(2)
            color = 0xffc107
        }
        const mat = new THREE.MeshPhongMaterial({ color })
        mesh = new THREE.Mesh(geometry, mat)

        // Label sprite
        const canvas   = document.createElement('canvas')
        canvas.width   = 256
        canvas.height  = 64
        const ctx      = canvas.getContext('2d')!
        ctx.font       = 'bold 22px sans-serif'
        ctx.fillStyle  = '#ffffff'
        ctx.textAlign  = 'center'
        ctx.fillText(entity.callsign, 128, 40)
        const tex    = new THREE.CanvasTexture(canvas)
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }))
        sprite.scale.set(12, 3, 1)
        sprite.position.set(0, 6, 0)
        mesh.add(sprite)

        scene.add(mesh)
        meshPool.set(entity.uid, mesh)
    }

    mesh.position.set(x, y, z)
    mesh.visible = !entity.stale
}

export function removeEntityMesh(uid: string, scene: THREEType.Scene): void {
    const mesh = meshPool.get(uid)
    if (mesh) {
        scene.remove(mesh)
        meshPool.delete(uid)
    }
}

export function clearAllEntities(scene: THREEType.Scene): void {
    for (const uid of [...meshPool.keys()]) removeEntityMesh(uid, scene)
    originEcef = null
}
