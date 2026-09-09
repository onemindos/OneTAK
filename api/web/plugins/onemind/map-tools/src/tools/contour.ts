/**
 * Contour tool — terrain contour lines using maplibre-contour.
 *
 * How it works:
 *   1. User provides a DEM (Digital Elevation Model) tile URL in ContourControls.
 *      - Encoding: 'terrarium' (Mapzen/AWS) or 'mapbox' (Mapbox Terrain-RGB)
 *      - Any raster DEM tile server works — including self-hosted.
 *   2. ContourTool.mount(config) creates a DemSource, calls setupMaplibre(map),
 *      then adds the contour line layer and label layer.
 *   3. ContourTool.unmount() removes all layers and sources.
 *
 * Recommended public DEM sources (offline: use hosted PMTiles DEM):
 *   - terrarium: https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png
 *   - mapbox:    mapbox://mapbox.mapbox-terrain-dem-v1  (needs Mapbox token)
 *   - self-hosted: serve a terrarium PMTiles file via Martin in the geo namespace
 *
 * MapLibre sources/layers added:
 *   - Source: 'onemind-contour-dem'     (raster-dem via DemSource.sharedDemProtocolUrl)
 *   - Source: 'onemind-contour-lines'   (vector tiles from DemSource)
 *   - Layer:  'onemind-contour-lines'   (line)
 *   - Layer:  'onemind-contour-labels'  (symbol)
 */

import type { Map } from 'maplibre-gl';
import type { ContourConfig } from '../types';

let demSourceInstance: unknown = null;

export async function mountContours(map: Map, config: ContourConfig): Promise<void> {
    await unmountContours(map);

    const mlcontour = await import('maplibre-contour');
    const DemSource = mlcontour.default ?? mlcontour.DemSource ?? mlcontour;

    const demSource = new DemSource({
        url:      config.demUrl,
        encoding: config.encoding,
        maxzoom:  config.maxzoom,
        worker:   true,
    });

    demSource.setupMaplibre(map);
    demSourceInstance = demSource;

    map.addSource('onemind-contour-lines', {
        type:  'vector',
        tiles: [demSource.contourProtocolUrl({
            thresholds:  { 12: [config.interval, config.interval * 5], 14: [config.interval / 2, config.interval * 2] },
            elevationKey: 'ele',
            levelKey:     'level',
        })],
        maxzoom: config.maxzoom,
    });

    map.addLayer({
        id:           'onemind-contour-lines',
        type:         'line',
        source:       'onemind-contour-lines',
        'source-layer': 'contours',
        paint: {
            'line-color':   ['match', ['get', 'level'], 1, '#8B6914', '#C8A951'],
            'line-width':   ['match', ['get', 'level'], 1, 1.5, 0.75],
            'line-opacity': 0.75,
        },
    });

    map.addLayer({
        id:           'onemind-contour-labels',
        type:         'symbol',
        source:       'onemind-contour-lines',
        'source-layer': 'contours',
        filter:       ['==', ['get', 'level'], 1],
        layout: {
            'symbol-placement':   'line',
            'text-field':         '{ele}m',
            'text-font':          ['literal', ['Open Sans Regular']],
            'text-size':          10,
            'text-allow-overlap': false,
        },
        paint: {
            'text-color':   '#8B6914',
            'text-halo-color': 'rgba(255,255,255,0.7)',
            'text-halo-width': 1,
        },
    });
}

export async function unmountContours(map: Map): Promise<void> {
    for (const id of ['onemind-contour-labels', 'onemind-contour-lines']) {
        if (map.getLayer(id)) map.removeLayer(id);
    }
    if (map.getSource('onemind-contour-lines')) map.removeSource('onemind-contour-lines');
    demSourceInstance = null;
}
