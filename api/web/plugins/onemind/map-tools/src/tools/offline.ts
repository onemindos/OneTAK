/**
 * Offline tile cache tool.
 *
 * How it works:
 *   - Uses the browser Cache API (navigator.serviceWorker / Cache Storage)
 *     to pre-fetch and store map tiles for a given geographic bounds + zoom range.
 *   - A lightweight fetch loop enumerates all tiles in the bounding box using
 *     @mapbox/tile-cover (already in OneTAK deps) and caches each tile.
 *   - Cached tiles are served by a registered service worker when the browser
 *     is offline or in a degraded network.
 *
 * Offline workflow:
 *   1. Operator selects bounds on the map (draw a rectangle using terra-draw).
 *   2. Sets min/max zoom levels for the cache (e.g., z8–z16).
 *   3. Taps "Cache AO" — tile URLs are enumerated and fetched in batches.
 *   4. Progress is reported; estimated tile count shown before download.
 *   5. On next mission in denied comms environment, tiles serve from cache.
 *
 * Note: Service worker registration is handled outside this tool.
 * The SW file lives at api/web/public/sw-tiles.js (to be implemented).
 * This file provides the tile enumeration + prefetch logic only.
 */

import type { OfflineBounds } from '../types';
// @mapbox/tile-cover is already in OneTAK package.json
import cover from '@mapbox/tile-cover';

export function estimateTileCount(bounds: OfflineBounds): number {
    const bbox: GeoJSON.Feature = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [bounds.west,  bounds.south],
                [bounds.east,  bounds.south],
                [bounds.east,  bounds.north],
                [bounds.west,  bounds.north],
                [bounds.west,  bounds.south],
            ]],
        },
        properties: {},
    };

    let total = 0;
    for (let z = bounds.minZoom; z <= bounds.maxZoom; z++) {
        total += cover.tiles(bbox.geometry, { min_zoom: z, max_zoom: z }).length;
    }
    return total;
}

export async function cacheTiles(
    bounds: OfflineBounds,
    tileUrlTemplate: string,
    onProgress: (cached: number, total: number) => void,
    signal: AbortSignal,
): Promise<void> {
    const CACHE_NAME = 'onemind-tiles-v1';
    const BATCH_SIZE = 10;

    const bbox: GeoJSON.Feature = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [bounds.west,  bounds.south],
                [bounds.east,  bounds.south],
                [bounds.east,  bounds.north],
                [bounds.west,  bounds.north],
                [bounds.west,  bounds.south],
            ]],
        },
        properties: {},
    };

    const allTiles: [number, number, number][] = [];
    for (let z = bounds.minZoom; z <= bounds.maxZoom; z++) {
        const tiles = cover.tiles(bbox.geometry, { min_zoom: z, max_zoom: z });
        allTiles.push(...tiles as [number, number, number][]);
    }

    const cache = await caches.open(CACHE_NAME);
    let cached = 0;

    for (let i = 0; i < allTiles.length; i += BATCH_SIZE) {
        if (signal.aborted) return;
        const batch = allTiles.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
            batch.map(async ([x, y, z]) => {
                const url = tileUrlTemplate
                    .replace('{z}', String(z))
                    .replace('{x}', String(x))
                    .replace('{y}', String(y));
                try {
                    const res = await fetch(url);
                    if (res.ok) await cache.put(url, res);
                } catch { /* skip failed tiles silently */ }
                cached++;
                onProgress(cached, allTiles.length);
            })
        );
    }
}

export async function clearTileCache(): Promise<void> {
    await caches.delete('onemind-tiles-v1');
}

export async function getTileCacheSize(): Promise<number> {
    const cache = await caches.open('onemind-tiles-v1');
    const keys  = await cache.keys();
    return keys.length;
}
