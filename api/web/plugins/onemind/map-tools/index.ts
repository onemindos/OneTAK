import type { App } from 'vue';
import type { PluginAPI, PluginInstance } from '../../plugin';
import { addProtocol, removeProtocol } from 'maplibre-gl';
import { useMapToolsStore } from './src/store';

const MENU_KEY   = 'onemind-map-tools';
const ROUTE_NAME = 'home-menu-onemind-map-tools';

export default class MapToolsPlugin implements PluginInstance {
    private api: PluginAPI;
    private exportControl: unknown = null;

    constructor(api: PluginAPI) {
        this.api = api;
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new MapToolsPlugin(api);
    }

    async enable(): Promise<void> {
        const store = useMapToolsStore(this.api.pinia);
        store.setMap(this.api.map);

        await this.registerProtocols();
        await this.mountExportControl();

        this.api.routes.add(
            {
                path: 'onemind-map-tools',
                name: ROUTE_NAME,
                component: () => import('./src/MapToolsPanel.vue'),
            },
            'home-menu'
        );

        this.api.menu.add({
            key:         MENU_KEY,
            label:       'Map Tools',
            route:       ROUTE_NAME,
            tooltip:     'Measurements · Terrain · Export · Offline · Import',
            description: 'Distance/area measure · Contour lines · PDF/PNG export · Offline tile cache · Import KML/GPX/CSV · COG imagery · ArcGIS layers',
        });
    }

    async disable(): Promise<void> {
        this.unregisterProtocols();
        this.unmountExportControl();

        const store = useMapToolsStore(this.api.pinia);
        store.cleanup();

        this.api.menu.remove(MENU_KEY);
        this.api.router.removeRoute(ROUTE_NAME);
    }

    // ── Protocols ──────────────────────────────────────────────────────────────

    private async registerProtocols(): Promise<void> {
        // Cloud Optimized GeoTIFF: treat any cog:// URL as a raster tile source.
        // Usage: map.addSource('imagery', { type: 'raster', url: 'cog://https://...' })
        const { cogProtocol } = await import('maplibre-cog-protocol');
        addProtocol('cog', cogProtocol);

        // Vector text formats: load KML, GPX, CSV, TopoJSON directly as GeoJSON.
        // Usage: map.addSource('route', { type: 'geojson', data: 'gpx://https://...' })
        const VTP = await import('maplibre-gl-vector-text-protocol');
        const vtp = VTP.default ?? VTP;
        addProtocol('kml',      vtp);
        addProtocol('gpx',      vtp);
        addProtocol('csv',      vtp);
        addProtocol('topojson', vtp);
        addProtocol('tcx',      vtp);
    }

    private unregisterProtocols(): void {
        for (const scheme of ['cog', 'kml', 'gpx', 'csv', 'topojson', 'tcx']) {
            try { removeProtocol(scheme); } catch { /* already removed */ }
        }
    }

    // ── Export control ─────────────────────────────────────────────────────────

    private async mountExportControl(): Promise<void> {
        try {
            const { MaplibreExportControl } = await import('@watergis/maplibre-gl-export');
            this.exportControl = new MaplibreExportControl({ Format: 'PNG', DPI: 300 });
            (this.api.map as ReturnType<typeof this.api.map.addControl>);
            this.api.map.addControl(this.exportControl as Parameters<typeof this.api.map.addControl>[0], 'top-right');
        } catch (err) {
            console.warn('[map-tools] export control unavailable:', err);
        }
    }

    private unmountExportControl(): void {
        if (this.exportControl) {
            try {
                this.api.map.removeControl(this.exportControl as Parameters<typeof this.api.map.removeControl>[0]);
            } catch { /* map may already be destroyed */ }
            this.exportControl = null;
        }
    }
}
