import { markRaw, defineAsyncComponent } from 'vue'
import type { App, Component } from 'vue'
import type { PluginAPI, PluginInstance } from '../../../plugin'
import { IconMountain } from '@tabler/icons-vue'
import { lastElevation, isQuerying, readings } from './src/state'

const MENU_KEY   = 'onemind-elevation'
const ROUTE_NAME = 'home-menu-onemind-elevation'
const FLOAT_UID  = 'onemind-elevation-float'
const MAX_READINGS = 10
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VALHALLA_URL = (import.meta as any).env?.VITE_VALHALLA_URL ?? 'https://valhalla.onemindos.dev'

export default class ElevationPlugin implements PluginInstance {
    private api: PluginAPI
    private ElevationFloat: Component
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _clickHandler: ((e: any) => void) | null = null

    constructor(api: PluginAPI, ElevationFloat: Component) {
        this.api           = api
        this.ElevationFloat = ElevationFloat
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        const { default: ElevationFloat } = await import('./src/ElevationFloat.vue')
        return new ElevationPlugin(api, ElevationFloat)
    }

    async enable(): Promise<void> {
        this._clickHandler = (e) => this._onMapClick(e)
        this.api.map.on('click', this._clickHandler)

        this.api.float.add({
            uid:       FLOAT_UID,
            name:      'Elevation',
            component: this.ElevationFloat,
            width:     270,
            height:    220,
            x:         20,
            y:         80,
        })

        this.api.routes.add(
            {
                path:      'onemind-elevation',
                name:      ROUTE_NAME,
                component: defineAsyncComponent(() => import('./src/ElevationPanel.vue')),
            },
            'home-menu'
        )

        this.api.menu.add({
            key:         MENU_KEY,
            icon:        markRaw(IconMountain),
            label:       'Elevation',
            route:       ROUTE_NAME,
            tooltip:     'Query terrain elevation',
            description: 'Click-to-elevation · Terrain height from tiles or Valhalla API',
        })
    }

    async disable(): Promise<void> {
        if (this._clickHandler) {
            this.api.map.off('click', this._clickHandler)
            this._clickHandler = null
        }
        this.api.float.remove(FLOAT_UID)
        this.api.menu.remove(MENU_KEY)
        this.api.router.removeRoute(ROUTE_NAME)
        lastElevation.value = null
        isQuerying.value    = false
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async _onMapClick(e: any): Promise<void> {
        const { lng, lat } = e.lngLat
        isQuerying.value = true

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = this.api.map as any
        let elev: number | null = null

        try {
            const raw = map.queryTerrainElevation([lng, lat], { exaggerated: false })
            if (raw != null) elev = raw
        } catch { /* queryTerrainElevation unavailable */ }

        if (elev === null) {
            try {
                const body = JSON.stringify({ range: false, shape: [{ lat, lon: lng }] })
                const res  = await fetch(`${VALHALLA_URL}/height?json=${encodeURIComponent(body)}`)
                const data = await res.json()
                elev = data.height?.[0] ?? null
            } catch { /* Valhalla unavailable */ }
        }

        const point = { lng, lat, elev, ts: Date.now() }
        lastElevation.value = point
        readings.value = [point, ...readings.value].slice(0, MAX_READINGS)
        isQuerying.value = false
    }
}
