/**
 * TripsLayer builder.
 *
 * Animates CoT track history as moving trails on the map.
 * Pairs with the ClickHouse plugin — query historical CoT tracks and
 * animate them across the temporal range.
 *
 * How it works:
 *   - Each "trip" is a sequence of [lng, lat, timestamp] waypoints.
 *   - The layer renders an animated trail that moves forward through time.
 *   - currentTime (from the temporal store) controls playback position.
 *   - trailLength controls how many seconds of trail are visible behind each unit.
 *
 * TAK use cases:
 *   - Mission replay / debrief
 *   - Search and rescue track visualization
 *   - Vehicle convoy playback
 *   - Historical ISR pattern-of-life analysis
 *
 * Data source:
 *   Pass trip data built from ClickHouse CoT history queries.
 *   Use api.cot.history(uid, { start, end }) per tracked unit.
 */

import type { TripsLayerConfig } from '../types';

export interface TripData {
    uid:       string;
    callsign:  string;
    color:     [number, number, number];
    waypoints: { coordinates: [number, number]; timestamp: number }[];
}

export async function buildTripsLayer(config: TripsLayerConfig, trips: TripData[]) {
    const { TripsLayer } = await import('@deck.gl/geo-layers');

    return new TripsLayer({
        id:              `deck-trips-${config.id}`,
        data:            trips,
        visible:         config.visible,
        currentTime:     config.currentTime,
        trailLength:     config.trailLength ?? 120,
        widthMinPixels:  config.widthMinPixels ?? 2,
        getPath:         (d: TripData) => d.waypoints.map(w => w.coordinates),
        getTimestamps:   (d: TripData) => d.waypoints.map(w => w.timestamp / 1000),
        getColor:        (d: TripData) => d.color ?? [253, 128, 93],
    });
}
