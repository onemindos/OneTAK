/**
 * Tile3DLayer builder.
 *
 * Renders OGC 3D Tiles on top of the MapLibre map via deck.gl.
 * No CesiumJS required — uses @loaders.gl/3d-tiles to parse .b3dm, .pnts, .i3dm.
 *
 * Supported 3D Tiles content:
 *   - .b3dm  Batched 3D Model   — buildings, structures, vehicles
 *   - .pnts  Point Cloud        — LiDAR scans, photogrammetry point clouds
 *   - .i3dm  Instanced 3D Model — repeated objects (trees, poles, signs)
 *   - .cmpt  Composite          — mix of the above in one tile
 *
 * Tile sources:
 *   - Any HTTP server hosting a tileset.json + tiles (offline-capable)
 *   - CesiumIon (optional, requires token): ion://AssetId via resolveIonUrl helper
 *   - ESRI I3S (building scene layers) — Tile3DLayer supports both formats
 *
 * Usage example:
 *   buildTile3DLayer({
 *     id:      'buildings',
 *     type:    'tile3d',
 *     label:   'City Buildings',
 *     visible: true,
 *     url:     'https://intel.local/3dtiles/buildings/tileset.json',
 *     maxErrors: 0,
 *     pointSize: 2,
 *     opacity: 1,
 *   })
 */

import type { Tile3DLayerConfig } from '../types';

export async function buildTile3DLayer(config: Tile3DLayerConfig) {
    const { Tile3DLayer }   = await import('@deck.gl/geo-layers');
    const { Tiles3DLoader } = await import('@loaders.gl/3d-tiles');

    return new Tile3DLayer({
        id:            `deck-tile3d-${config.id}`,
        data:          config.url,
        loader:        Tiles3DLoader,
        visible:       config.visible,
        opacity:       config.opacity ?? 1,
        pointSize:     config.pointSize ?? 2,
        maxErrors:     config.maxErrors ?? 0,
        onTilesetLoad: (tileset: unknown) => {
            console.debug(`[deck/tile3d] tileset loaded: ${config.label}`, tileset);
        },
        onTileError: (err: unknown) => {
            console.warn(`[deck/tile3d] tile error in ${config.label}:`, err);
        },
    });
}
