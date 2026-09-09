/**
 * Measure tool — distance and area using Turf.js (already in deps).
 *
 * How it works:
 *   1. User clicks "Distance" or "Area" button in MeasureControls.
 *   2. MeasureTool.start(mode) attaches map click listener.
 *   3. Each click adds a vertex to the GeoJSON source; a line/polygon renders.
 *   4. Double-click or "Finish" button calls MeasureTool.finish() which
 *      computes the final measurement and pushes it to the store.
 *   5. MeasureTool.clear() removes all layers/sources from the map.
 *
 * MapLibre layers used:
 *   - Source:  'onemind-measure-points'   (GeoJSON FeatureCollection)
 *   - Source:  'onemind-measure-line'     (GeoJSON LineString)
 *   - Layer:   'onemind-measure-points-layer'
 *   - Layer:   'onemind-measure-line-layer'
 */

import type { Map, MapMouseEvent } from 'maplibre-gl';
import turfDistance from '@turf/distance';
import turfArea     from '@turf/area';
import turfLength   from '@turf/length';
import type { Feature, Position } from 'geojson';

const SRC_POINTS = 'onemind-measure-points';
const SRC_LINE   = 'onemind-measure-line';

export class MeasureTool {
    private map:      Map;
    private vertices: Position[] = [];
    private mode:     'distance' | 'area' = 'distance';
    private onClick:  ((e: MapMouseEvent) => void) | null = null;
    private onDblClick: ((e: MapMouseEvent) => void) | null = null;

    constructor(map: Map) {
        this.map = map;
    }

    start(mode: 'distance' | 'area'): void {
        this.mode     = mode;
        this.vertices = [];
        this.setupSources();
        this.setupLayers();

        this.onClick = (e: MapMouseEvent) => {
            this.vertices.push([e.lngLat.lng, e.lngLat.lat]);
            this.updateSources();
        };

        this.onDblClick = () => {
            this.finish();
        };

        this.map.on('click', this.onClick);
        this.map.on('dblclick', this.onDblClick);
        this.map.getCanvas().style.cursor = 'crosshair';
    }

    finish(): { value: number; unit: string; label: string } | null {
        this.detachListeners();
        this.map.getCanvas().style.cursor = '';

        if (this.vertices.length < 2) return null;

        if (this.mode === 'distance') {
            const line = { type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: this.vertices }, properties: {} };
            const km   = turfLength(line, { units: 'kilometers' });
            return { value: km, unit: 'km', label: `${km.toFixed(2)} km` };
        } else {
            if (this.vertices.length < 3) return null;
            const poly = {
                type: 'Feature' as const,
                geometry: {
                    type: 'Polygon' as const,
                    coordinates: [[...this.vertices, this.vertices[0]]],
                },
                properties: {},
            };
            const sqm = turfArea(poly);
            const sqkm = sqm / 1_000_000;
            return { value: sqkm, unit: 'km²', label: `${sqkm.toFixed(4)} km²` };
        }
    }

    clear(): void {
        this.detachListeners();
        this.vertices = [];
        this.map.getCanvas().style.cursor = '';
        for (const layer of ['onemind-measure-points-layer', 'onemind-measure-line-layer', 'onemind-measure-fill-layer']) {
            if (this.map.getLayer(layer)) this.map.removeLayer(layer);
        }
        for (const src of [SRC_POINTS, SRC_LINE]) {
            if (this.map.getSource(src)) this.map.removeSource(src);
        }
    }

    private setupSources(): void {
        if (!this.map.getSource(SRC_POINTS)) {
            this.map.addSource(SRC_POINTS, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        }
        if (!this.map.getSource(SRC_LINE)) {
            this.map.addSource(SRC_LINE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        }
    }

    private setupLayers(): void {
        if (!this.map.getLayer('onemind-measure-line-layer')) {
            this.map.addLayer({
                id:     'onemind-measure-line-layer',
                type:   'line',
                source: SRC_LINE,
                paint:  { 'line-color': '#f59e0b', 'line-width': 2, 'line-dasharray': [4, 2] },
            });
        }
        if (!this.map.getLayer('onemind-measure-fill-layer')) {
            this.map.addLayer({
                id:     'onemind-measure-fill-layer',
                type:   'fill',
                source: SRC_LINE,
                filter: ['==', ['geometry-type'], 'Polygon'],
                paint:  { 'fill-color': '#f59e0b', 'fill-opacity': 0.15 },
            });
        }
        if (!this.map.getLayer('onemind-measure-points-layer')) {
            this.map.addLayer({
                id:     'onemind-measure-points-layer',
                type:   'circle',
                source: SRC_POINTS,
                paint:  { 'circle-radius': 5, 'circle-color': '#f59e0b', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
            });
        }
    }

    private updateSources(): void {
        const pointFeatures: Feature[] = this.vertices.map(v => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: v },
            properties: {},
        }));

        (this.map.getSource(SRC_POINTS) as ReturnType<Map['getSource']> & { setData: Function })
            ?.setData({ type: 'FeatureCollection', features: pointFeatures });

        if (this.vertices.length >= 2) {
            const coords = this.mode === 'area' && this.vertices.length >= 3
                ? [...this.vertices, this.vertices[0]]
                : this.vertices;

            const geomType = this.mode === 'area' && this.vertices.length >= 3 ? 'Polygon' : 'LineString';
            const lineFeature: Feature = {
                type: 'Feature',
                geometry: geomType === 'Polygon'
                    ? { type: 'Polygon', coordinates: [coords] }
                    : { type: 'LineString', coordinates: coords },
                properties: {},
            };

            (this.map.getSource(SRC_LINE) as ReturnType<Map['getSource']> & { setData: Function })
                ?.setData({ type: 'FeatureCollection', features: [lineFeature] });
        }
    }

    private detachListeners(): void {
        if (this.onClick)    { this.map.off('click', this.onClick);       this.onClick    = null; }
        if (this.onDblClick) { this.map.off('dblclick', this.onDblClick); this.onDblClick = null; }
    }
}
