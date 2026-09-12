// Manages TilesRenderer instances keyed by tileset ID.
// Each TilesRenderer owns a THREE.Group that is added to the scene.

import type * as THREEType from 'three'
// TilesRenderer types are not re-exported as a separate type-only import;
// use 'unknown' for the stored map value and cast on access.

const pool = new Map<string, unknown>()

export async function mountTileset(
    id:       string,
    url:      string,
    scene:    THREEType.Scene,
    camera:   THREEType.PerspectiveCamera,
    renderer: THREEType.WebGLRenderer,
): Promise<void> {
    if (pool.has(id)) return

    const { TilesRenderer } = await import('3d-tiles-renderer')
    const tiles = new TilesRenderer(url)
    tiles.setCamera(camera)
    tiles.setResolutionFromRenderer(camera, renderer)
    scene.add(tiles.group)
    pool.set(id, tiles)
}

export function unmountTileset(id: string, scene: THREEType.Scene): void {
    const tiles = pool.get(id) as { group: THREEType.Object3D; dispose(): void } | undefined
    if (!tiles) return
    scene.remove(tiles.group)
    tiles.dispose()
    pool.delete(id)
}

export function tickTilesets(
    camera:   THREEType.PerspectiveCamera,
    renderer: THREEType.WebGLRenderer,
): void {
    for (const raw of pool.values()) {
        const tiles = raw as {
            setResolutionFromRenderer(c: unknown, r: unknown): void
            update(): void
        }
        tiles.setResolutionFromRenderer(camera, renderer)
        tiles.update()
    }
}

export function unmountAll(scene: THREEType.Scene): void {
    for (const id of [...pool.keys()]) unmountTileset(id, scene)
}
