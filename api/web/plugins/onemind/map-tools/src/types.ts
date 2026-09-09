import type { Map } from 'maplibre-gl';

export type ToolId =
    | 'measure-distance'
    | 'measure-area'
    | 'contour'
    | 'export'
    | 'import'
    | 'cog'
    | 'offline';

export interface ToolDef {
    id:          ToolId;
    label:       string;
    description: string;
    icon:        string;
    active:      boolean;
}

export interface MeasureResult {
    type:  'distance' | 'area';
    value: number;
    unit:  string;
    label: string;
}

export interface ContourConfig {
    demUrl:   string;
    encoding: 'terrarium' | 'mapbox';
    interval: number;
    maxzoom:  number;
}

export interface CogLayer {
    id:    string;
    url:   string;
    label: string;
    opacity: number;
}

export interface ImportedLayer {
    id:     string;
    label:  string;
    url:    string;
    format: 'kml' | 'gpx' | 'csv' | 'topojson' | 'tcx';
}

export interface OfflineBounds {
    north: number;
    south: number;
    east:  number;
    west:  number;
    minZoom: number;
    maxZoom: number;
}

export interface MapToolsContext {
    map: Map | null;
}
