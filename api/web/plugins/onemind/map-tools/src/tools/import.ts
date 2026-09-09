/**
 * Vector text import tool.
 *
 * How it works:
 *   - The kml://, gpx://, csv://, topojson://, tcx:// protocols are registered
 *     in the plugin index.ts using maplibre-gl-vector-text-protocol.
 *   - This means MapLibre can treat any of these URL schemes as GeoJSON sources.
 *   - addImportedLayer() creates a GeoJSON source + fill/line/circle layers
 *     for the imported file.
 *   - loadFileAsDataUrl() handles local File objects (drag-and-drop / file picker)
 *     by converting them to a data URL that MapLibre can consume.
 *
 * Supported formats:
 *   - KML  — Google Earth files, TAK export files
 *   - GPX  — GPS track files, ATAK/WinTAK exports
 *   - CSV  — coordinate tables (lon,lat,name columns)
 *   - TopoJSON — topological GeoJSON
 *   - TCX  — Garmin training/track files
 *
 * Usage:
 *   // From URL:
 *   addImportedLayer(map, { id: 'mission', label: 'Mission KML', url: 'kml://https://...', format: 'kml' })
 *
 *   // From local file:
 *   const url = await loadFileAsDataUrl(file, 'gpx');
 *   addImportedLayer(map, { id: 'track', label: 'GPX Track', url, format: 'gpx' })
 */

import type { Map } from 'maplibre-gl';
import type { ImportedLayer } from '../types';

export async function loadFileAsDataUrl(file: File, format: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(`${format}://${reader.result}`);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function addImportedLayer(map: Map, layer: ImportedLayer): void {
    const srcId = `onemind-import-${layer.id}`;
    if (map.getSource(srcId)) return;

    map.addSource(srcId, {
        type: 'geojson',
        data: layer.url,
    });

    // Line features
    map.addLayer({
        id:     `${srcId}-line`,
        type:   'line',
        source: srcId,
        filter: ['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']],
        paint:  { 'line-color': '#3b82f6', 'line-width': 2 },
    });

    // Polygon features
    map.addLayer({
        id:     `${srcId}-fill`,
        type:   'fill',
        source: srcId,
        filter: ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
        paint:  { 'fill-color': '#3b82f6', 'fill-opacity': 0.2 },
    });

    // Polygon outlines
    map.addLayer({
        id:     `${srcId}-outline`,
        type:   'line',
        source: srcId,
        filter: ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
        paint:  { 'line-color': '#3b82f6', 'line-width': 1.5 },
    });

    // Point features
    map.addLayer({
        id:     `${srcId}-points`,
        type:   'circle',
        source: srcId,
        filter: ['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']],
        paint:  { 'circle-radius': 5, 'circle-color': '#3b82f6', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#fff' },
    });
}

export function removeImportedLayer(map: Map, id: string): void {
    const srcId = `onemind-import-${id}`;
    for (const suffix of ['-points', '-outline', '-fill', '-line']) {
        if (map.getLayer(`${srcId}${suffix}`)) map.removeLayer(`${srcId}${suffix}`);
    }
    if (map.getSource(srcId)) map.removeSource(srcId);
}
