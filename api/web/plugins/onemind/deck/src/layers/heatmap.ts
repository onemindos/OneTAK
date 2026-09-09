/**
 * HeatmapLayer builder.
 *
 * Renders density heatmaps from CoT/feature position data.
 * Pairs with the ClickHouse plugin — query a time window of CoT tracks
 * and pass the feature array here to visualize track density.
 *
 * How it works:
 *   - Accepts any array of objects with longitude/latitude fields.
 *   - Aggregates point density using a Gaussian kernel on the GPU.
 *   - Color range goes from transparent (low density) to red (high density).
 *   - radiusPixels controls the kernel radius — larger = smoother/blurrier.
 *
 * TAK use cases:
 *   - Track density over time (where are units spending the most time?)
 *   - Threat concentration in an AO
 *   - Signal/sensor coverage heatmap
 *   - Contact/sighting frequency by location
 *
 * Data source:
 *   Pass CoT DBFeature[] from api.feature.list() or ClickHouse query results.
 *   Features need [longitude, latitude] extractable from geometry.coordinates.
 */

import type { HeatmapLayerConfig } from '../types';
import type { DBFeature } from '../../../plugin';

const DEFAULT_COLOR_RANGE: [number, number, number, number][] = [
    [0, 0, 255, 0],
    [0, 128, 255, 128],
    [0, 255, 128, 200],
    [128, 255, 0, 220],
    [255, 255, 0, 240],
    [255, 0, 0, 255],
];

export async function buildHeatmapLayer(config: HeatmapLayerConfig, features: DBFeature[]) {
    const { HeatmapLayer } = await import('@deck.gl/aggregation-layers');

    return new HeatmapLayer({
        id:           `deck-heatmap-${config.id}`,
        data:         features,
        visible:      config.visible,
        intensity:    config.intensity ?? 1,
        threshold:    config.threshold ?? 0.05,
        radiusPixels: config.radiusPixels ?? 30,
        colorRange:   (config.colorRange ?? DEFAULT_COLOR_RANGE) as [number, number, number, number][],
        getPosition: (d: DBFeature) => {
            const coords = d.geometry?.coordinates as [number, number] | undefined;
            return coords ?? [0, 0];
        },
        getWeight: () => 1,
    });
}
