import { markRaw, defineAsyncComponent } from 'vue'
import type { App } from 'vue'
import type { PluginAPI, PluginInstance } from '../../../plugin'
import { IconCube } from '@tabler/icons-vue'
import { ThreeLayer } from './src/layer'
import { connectNats, disconnectNats } from './src/nats'
import { natsConnected, entityCount } from './src/state'

const MENU_KEY   = 'onemind-maplibre-three'
const ROUTE_NAME = 'home-menu-onemind-maplibre-three'
const LAYER_ID   = 'onemind-three-entities'

export default class MaplibreThreePlugin implements PluginInstance {
    private api:   PluginAPI
    private layer: ThreeLayer | null = null

    constructor(api: PluginAPI) {
        this.api = api
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new MaplibreThreePlugin(api)
    }

    async enable(): Promise<void> {
        this.layer = new ThreeLayer()

        // Intercept upsert to keep entity count reactive
        const orig = this.layer.upsertEntity.bind(this.layer)
        this.layer.upsertEntity = (e) => { orig(e); entityCount.value = this.layer!.size }

        const map = this.api.map as any
        const addLayer = () => map.addLayer(this.layer)
        if (map.isStyleLoaded()) addLayer()
        else map.once('load', addLayer)

        await connectNats(
            (connected) => { natsConnected.value = connected },
            this.layer,
        )

        this.api.routes.add(
            {
                path:      'onemind-maplibre-three',
                name:      ROUTE_NAME,
                component: defineAsyncComponent(() => import('./src/ThreePanel.vue')),
            },
            'home-menu'
        )

        this.api.menu.add({
            key:         MENU_KEY,
            icon:        markRaw(IconCube),
            label:       '3D Entities',
            route:       ROUTE_NAME,
            tooltip:     '3D entity layer on 2D map — Three.js + MapLibre shared WebGL',
            description: 'Renders NATS entities as 3D meshes pinned to the map. Friendly=blue, hostile=red, unknown=yellow. Pairs with XR View for full VR/AR pipeline.',
        })
    }

    async disable(): Promise<void> {
        await disconnectNats()

        const map = this.api.map as any
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)

        this.layer?.clear()
        this.layer = null

        this.api.menu.remove(MENU_KEY)
        this.api.router.removeRoute(ROUTE_NAME)
    }
}
