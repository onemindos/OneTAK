/**
 * Globe plugin — CesiumJS WGS84 3D globe toggle.
 *
 * Mounts CesiumJS as a full-screen overlay above the MapLibre map.
 * The MapLibre canvas is hidden while the globe is active; camera position
 * is synced from MapLibre on open so the globe opens at the current view.
 *
 * When to use the globe vs MapLibre:
 *   - MapLibre (default): 2D tactical operations, fast tile rendering, all CoT overlays
 *   - Globe (this plugin): polar operations (no Mercator distortion), long-range arc
 *     visualization, WGS84-accurate great-circle routes, 3D terrain fly-through
 *
 * Cesium is loaded lazily (~2MB WASM + JS) — only on first activate.
 * Subsequent toggles are instant.
 *
 * Ion token:
 *   Optional. Set VITE_CESIUM_ION_TOKEN in your .env for world terrain + imagery.
 *   Without it, Cesium runs with a local/default provider — still works offline
 *   if you configure a self-hosted terrain provider in cesium.ts.
 *
 * Vite setup required (add to api/web/vite.config.ts):
 *   import { viteStaticCopy } from 'vite-plugin-static-copy';
 *   viteStaticCopy({ targets: [{ src: 'node_modules/cesium/Build/Cesium', dest: '' }] })
 *   define: { 'CESIUM_BASE_URL': JSON.stringify('/Cesium/') }
 */

import type { App } from 'vue';
import type { PluginAPI, PluginInstance } from '../../plugin';
import { useGlobeStore } from './src/store';
import { markRaw, defineAsyncComponent } from 'vue';

const BB_KEY     = 'onemind-globe-toggle';
const FLOAT_UID  = 'onemind-globe-view';

export default class GlobePlugin implements PluginInstance {
    private api: PluginAPI;

    constructor(api: PluginAPI) {
        this.api = api;
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new GlobePlugin(api);
    }

    async enable(): Promise<void> {
        const store = useGlobeStore(this.api.pinia);
        store.setMap(this.api.map);

        // Read optional Ion token from env
        const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN ?? null;
        store.ionToken = ionToken;

        // Mount GlobeView as a persistent float — it manages its own DOM teleport
        const GlobeView = defineAsyncComponent(() => import('./src/GlobeView.vue'));
        this.api.float.add({
            uid:    FLOAT_UID,
            name:   'Globe',
            component: markRaw(GlobeView),
            // Zero size — the component uses <teleport to="body"> for the full-screen canvas
            width:  0,
            height: 0,
            x:      0,
            y:      0,
        });

        // Globe toggle button in the bottom status bar
        const GlobeToggle = defineAsyncComponent(() => import('./src/components/GlobeToggle.vue'));
        this.api.bottomBar.add({
            key:       BB_KEY,
            component: markRaw(GlobeToggle),
        });
    }

    async disable(): Promise<void> {
        const store = useGlobeStore(this.api.pinia);
        store.active = false;
        store.cleanup();

        this.api.bottomBar.remove(BB_KEY);
        this.api.float.remove(FLOAT_UID);
    }
}
