/**
 * deck.gl plugin — 3D tiles, heatmaps, animated track replay.
 *
 * Owns the single MapLibreOverlay instance. All deck.gl layers in OneTAK
 * go through this plugin to avoid duplicate overlay conflicts.
 *
 * Architecture:
 *   - enable() mounts a MapLibreOverlay in interleaved mode (same WebGL canvas).
 *   - The store exposes addLayerConfig/removeLayerConfig for other code to call.
 *   - Any config change triggers rebuildLayers() which reconstructs all
 *     active deck.gl Layer instances and calls setLayers() on the overlay.
 *   - disable() destroys the overlay and clears all layers.
 */

import type { App } from 'vue';
import type { PluginAPI, PluginInstance } from '../../plugin';
import { initOverlay, destroyOverlay, setLayers } from './src/overlay';
import { useDeckStore } from './src/store';
import { buildTile3DLayer } from './src/layers/tile3d';
import { buildHeatmapLayer } from './src/layers/heatmap';
import { buildTripsLayer }   from './src/layers/trips';
import type { Layer } from '@deck.gl/core';

const MENU_KEY   = 'onemind-deck';
const ROUTE_NAME = 'home-menu-onemind-deck';

export default class DeckPlugin implements PluginInstance {
    private api: PluginAPI;

    constructor(api: PluginAPI) {
        this.api = api;
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new DeckPlugin(api);
    }

    async enable(): Promise<void> {
        const store = useDeckStore(this.api.pinia);
        store.setMap(this.api.map);

        await initOverlay(this.api.map);

        // Wire the rebuild callback — called whenever any layer config changes.
        store.onRebuild(() => this.rebuildLayers());

        this.api.routes.add(
            {
                path:      'onemind-deck',
                name:      ROUTE_NAME,
                component: () => import('./src/DeckPanel.vue'),
            },
            'home-menu'
        );

        this.api.menu.add({
            key:         MENU_KEY,
            label:       'Deck Layers',
            route:       ROUTE_NAME,
            tooltip:     '3D tiles · Heatmaps · Track replay',
            description: '3D buildings/photogrammetry · CoT density heatmap · Animated track replay with time scrubber',
        });
    }

    async disable(): Promise<void> {
        destroyOverlay();

        const store = useDeckStore(this.api.pinia);
        store.cleanup();

        this.api.menu.remove(MENU_KEY);
        this.api.router.removeRoute(ROUTE_NAME);
    }

    private async rebuildLayers(): Promise<void> {
        const store  = useDeckStore(this.api.pinia);
        const layers: Layer[] = [];

        for (const config of store.activeConfigs) {
            try {
                if (config.type === 'tile3d') {
                    layers.push(await buildTile3DLayer(config));
                } else if (config.type === 'heatmap') {
                    // Features fetched externally and stored on the config as _data
                    const features = (config as typeof config & { _data?: unknown[] })._data ?? [];
                    layers.push(await buildHeatmapLayer(config, features as Parameters<typeof buildHeatmapLayer>[1]));
                } else if (config.type === 'trips') {
                    const trips = (config as typeof config & { _trips?: unknown[] })._trips ?? [];
                    layers.push(await buildTripsLayer(config, trips as Parameters<typeof buildTripsLayer>[1]));
                }
            } catch (err) {
                console.warn(`[deck] failed to build layer ${config.id}:`, err);
            }
        }

        setLayers(layers);
    }
}
