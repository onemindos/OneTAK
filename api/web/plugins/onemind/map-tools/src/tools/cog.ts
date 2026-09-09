/**
 * COG (Cloud Optimized GeoTIFF) layer tool.
 *
 * How it works:
 *   - The 'cog://' protocol is registered in the plugin index.ts when the
 *     plugin is enabled. This tells MapLibre to fetch GeoTIFF files as tiles.
 *   - addCogLayer() creates a standard MapLibre raster source + layer using
 *     the cog:// prefix, pointing at any HTTP-accessible GeoTIFF.
 *   - Works offline as long as the GeoTIFF is on a local server.
 *
 * Typical use cases:
 *   - Drone/aerial ortho imagery (.tif files from mapping software)
 *   - Satellite imagery snapshots for offline AO coverage
 *   - NIIRS-graded classified imagery via local server
 *
 * Usage:
 *   await addCogLayer(map, {
 *     id: 'drone-ortho-2024',
 *     url: 'cog://https://intel.local/imagery/ortho.tif',
 *     label: 'Drone Ortho - 2024-09-09',
 *     opacity: 0.85,
 *   });
 */

import type { Map } from 'maplibre-gl';
import type { CogLayer } from '../types';

export function addCogLayer(map: Map, layer: CogLayer): void {
    const srcId   = `onemind-cog-${layer.id}`;
    const layerId = `onemind-cog-layer-${layer.id}`;

    if (map.getSource(srcId)) return;

    map.addSource(srcId, {
        type: 'raster',
        url:  `cog://${layer.url.replace(/^cog:\/\//, '')}`,
        tileSize: 256,
    });

    map.addLayer({
        id:     layerId,
        type:   'raster',
        source: srcId,
        paint:  { 'raster-opacity': layer.opacity ?? 1 },
    });
}

export function removeCogLayer(map: Map, id: string): void {
    const layerId = `onemind-cog-layer-${id}`;
    const srcId   = `onemind-cog-${id}`;
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(srcId))  map.removeSource(srcId);
}

export function setCogOpacity(map: Map, id: string, opacity: number): void {
    const layerId = `onemind-cog-layer-${id}`;
    if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'raster-opacity', opacity);
    }
}
