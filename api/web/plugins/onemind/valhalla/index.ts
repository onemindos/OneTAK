import { markRaw } from 'vue'
import type { App } from 'vue'
import type { PluginAPI, PluginInstance } from '../../../plugin'
import { IconMapRoute } from '@tabler/icons-vue'
import { MapboxValhallaControl } from '@watergis/mapbox-gl-valhalla'

const MENU_KEY   = 'onemind-valhalla'
const ROUTE_NAME = 'home-menu-onemind-valhalla'

// Default isochrone rings: 5/15/30/60 minute travel time
// Colors: red → yellow → green → blue
const CONTOURS = [
    { time: 5,  distance: 1,  color: 'ef4444' },
    { time: 15, distance: 3,  color: 'f59e0b' },
    { time: 30, distance: 8,  color: '22c55e' },
    { time: 60, distance: 20, color: '3b82f6' },
]

const VALHALLA_URL = import.meta.env.VITE_VALHALLA_URL ?? 'https://valhalla.onemindos.dev'

export default class ValhallaPlugin implements PluginInstance {
    private api:     PluginAPI
    private control: MapboxValhallaControl | null = null

    constructor(api: PluginAPI) {
        this.api = api
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new ValhallaPlugin(api)
    }

    async enable(): Promise<void> {
        this.control = new MapboxValhallaControl(VALHALLA_URL, { Contours: CONTOURS })
        this.api.map.addControl(this.control as Parameters<typeof this.api.map.addControl>[0], 'bottom-right')

        this.api.routes.add(
            {
                path:      'onemind-valhalla',
                name:      ROUTE_NAME,
                component: () => import('./src/ValhallaPanel.vue'),
            },
            'home-menu'
        )

        this.api.menu.add({
            key:         MENU_KEY,
            icon:        markRaw(IconMapRoute),
            label:       'Isochrones',
            route:       ROUTE_NAME,
            tooltip:     'Travel time & distance isochrones',
            description: 'Valhalla routing — click map to show reachable areas in 5/15/30/60 min',
        })
    }

    async disable(): Promise<void> {
        if (this.control) {
            this.api.map.removeControl(this.control as Parameters<typeof this.api.map.removeControl>[0])
            this.control = null
        }
        this.api.menu.remove(MENU_KEY)
        this.api.router.removeRoute(ROUTE_NAME)
    }
}
