/**
 * deck.gl MapLibreOverlay singleton manager.
 *
 * Only one MapLibreOverlay should exist on the map at a time.
 * This module manages that singleton and exposes methods to
 * add, remove, and update layers.
 *
 * How it works:
 *   1. init(map) — creates a MapLibreOverlay in interleaved mode
 *      (renders into MapLibre's WebGL2 context, same canvas, proper depth).
 *   2. setLayers(layers) — replaces the full layer list, deck.gl diffs internally.
 *   3. destroy() — removes the control from the map and clears the singleton.
 *
 * Interleaved vs overlaid:
 *   - Interleaved (default here): deck.gl renders inside MapLibre's GL context.
 *     Proper depth sorting with map features. Slightly more complex setup.
 *   - Overlaid: separate canvas on top. Simpler but no depth sorting.
 *
 * Package: @deck.gl/mapbox (named for historical reasons, works with MapLibre).
 */

import type { Map } from 'maplibre-gl';
import type { Layer } from '@deck.gl/core';

let overlayInstance: unknown = null;
let mapInstance:     Map | null = null;

export async function initOverlay(map: Map): Promise<void> {
    if (overlayInstance) return;

    const { MapLibreOverlay } = await import('@deck.gl/mapbox');

    const overlay = new MapLibreOverlay({
        interleaved: true,
        layers: [],
    });

    map.addControl(overlay as Parameters<Map['addControl']>[0]);
    overlayInstance = overlay;
    mapInstance     = map;
}

export function setLayers(layers: Layer[]): void {
    if (!overlayInstance) return;
    (overlayInstance as { setProps: (props: { layers: Layer[] }) => void }).setProps({ layers });
}

export function destroyOverlay(): void {
    if (overlayInstance && mapInstance) {
        try {
            mapInstance.removeControl(overlayInstance as Parameters<Map['removeControl']>[0]);
        } catch { /* map may already be destroyed */ }
    }
    overlayInstance = null;
    mapInstance     = null;
}
