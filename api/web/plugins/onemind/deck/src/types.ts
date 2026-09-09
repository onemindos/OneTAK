export type DeckLayerType = 'tile3d' | 'heatmap' | 'trips';

export interface DeckLayerBase {
    id:      string;
    type:    DeckLayerType;
    label:   string;
    visible: boolean;
}

export interface Tile3DLayerConfig extends DeckLayerBase {
    type:          'tile3d';
    url:           string;
    maxErrors:     number;
    pointSize:     number;
    opacity:       number;
}

export interface HeatmapLayerConfig extends DeckLayerBase {
    type:       'heatmap';
    intensity:  number;
    threshold:  number;
    radiusPixels: number;
    colorRange: [number, number, number, number][];
}

export interface TripsLayerConfig extends DeckLayerBase {
    type:          'trips';
    trailLength:   number;
    widthMinPixels: number;
    color:         [number, number, number];
    currentTime:   number;
    animating:     boolean;
    animationSpeed: number;
}

export type DeckLayerConfig = Tile3DLayerConfig | HeatmapLayerConfig | TripsLayerConfig;

export interface TemporalRange {
    start: number;
    end:   number;
    current: number;
}
