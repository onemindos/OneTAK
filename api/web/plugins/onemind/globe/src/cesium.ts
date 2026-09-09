/**
 * CesiumJS viewer lifecycle manager.
 *
 * Cesium is loaded lazily — only when the user activates the globe.
 * It mounts into a <div id="onemind-cesium-container"> that GlobeView.vue
 * injects into the DOM.
 *
 * Offline / no-Ion setup:
 *   - Set CESIUM_ION_TOKEN to null (default here).
 *   - Cesium will use its built-in Bing imagery fallback — which still needs internet.
 *   - For fully offline: set a self-hosted terrain provider and a local imagery provider
 *     in initCesium(). Comment out the Ion lines and point to local tile servers.
 *
 * Self-hosted terrain example:
 *   const terrain = new Cesium.CesiumTerrainProvider({
 *     url: 'https://tiles.local/terrain',
 *   });
 *
 * Self-hosted imagery example:
 *   const imagery = new Cesium.TileMapServiceImageryProvider({
 *     url: 'https://tiles.local/imagery',
 *   });
 *
 * VITE_CESIUM_BASE_URL:
 *   Cesium's static assets (workers, WASM, widgets CSS) must be served from a known path.
 *   Set VITE_CESIUM_BASE_URL in .env (or the Vite config cesium plugin) so the bundler
 *   copies Cesium's build output to the right location.
 *   Example vite.config.ts: viteStaticCopy({ targets: [{ src: 'node_modules/cesium/Build/Cesium', dest: '' }] })
 */

let viewer: unknown = null;

export async function initCesium(
    containerId: string,
    opts: { ionToken?: string | null; lat: number; lng: number; alt: number }
): Promise<void> {
    if (viewer) return;

    const Cesium = await import('cesium');
    await import('cesium/Build/Cesium/Widgets/widgets.css');

    // Set CESIUM_BASE_URL so workers/assets resolve correctly.
    // Adjust to match your Vite copy destination.
    (window as Record<string, unknown>).CESIUM_BASE_URL =
        import.meta.env.VITE_CESIUM_BASE_URL ?? '/Cesium/';

    if (opts.ionToken) {
        Cesium.Ion.defaultAccessToken = opts.ionToken;
    } else {
        // Disable Ion — use offline providers only
        Cesium.Ion.defaultAccessToken = '';
    }

    const v = new Cesium.Viewer(containerId, {
        // Disable default UI chrome — OneTAK provides its own
        timeline:           false,
        animation:          false,
        baseLayerPicker:    false,
        geocoder:           false,
        homeButton:         false,
        sceneModePicker:    false,
        navigationHelpButton: false,
        infoBox:            false,
        selectionIndicator: false,

        // Enable terrain (online: world terrain via Ion; offline: replace with local provider)
        terrain: opts.ionToken ? Cesium.Terrain.fromWorldTerrain() : undefined,
    });

    // Fly to initial position (synced from MapLibre)
    v.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(opts.lng, opts.lat, opts.alt),
        duration: 0,
    });

    viewer = v;
}

export function syncCesiumCamera(lat: number, lng: number, alt: number, heading: number, pitch: number): void {
    if (!viewer) return;
    const Cesium = (viewer as { scene: unknown; camera: {
        setView: (opts: Record<string, unknown>) => void
    }});

    // Dynamic import would be circular here — use the already-loaded module.
    // We access the global Cesium namespace set on window by the import above.
    const C = (window as Record<string, unknown>).Cesium as typeof import('cesium');
    if (!C) return;

    (viewer as { camera: { setView: (opts: unknown) => void } }).camera.setView({
        destination: C.Cartesian3.fromDegrees(lng, lat, alt),
        orientation: {
            heading: C.Math.toRadians(heading),
            pitch:   C.Math.toRadians(pitch),
            roll:    0,
        },
    });
}

export async function destroyCesium(): Promise<void> {
    if (!viewer) return;
    (viewer as { destroy: () => void }).destroy();
    viewer = null;
}
