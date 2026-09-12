import { markRaw, defineAsyncComponent } from 'vue'
import type { App, Component } from 'vue'
import type { PluginAPI, PluginInstance } from '../../../plugin'
import { IconView360 } from '@tabler/icons-vue'

const MENU_KEY   = 'onemind-photosphere'
const ROUTE_NAME = 'home-menu-onemind-photosphere'
const FLOAT_UID  = 'onemind-photosphere-float'

export default class PhotospherePlugin implements PluginInstance {
    private api: PluginAPI
    private PhotosphereFloat: Component

    constructor(api: PluginAPI, PhotosphereFloat: Component) {
        this.api = api
        this.PhotosphereFloat = PhotosphereFloat
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        const { default: PhotosphereFloat } = await import('./src/PhotosphereFloat.vue')
        return new PhotospherePlugin(api, PhotosphereFloat)
    }

    async enable(): Promise<void> {
        // Configure map to support full pitch range needed by photosphere
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = this.api.map as any
        map.setMinPitch?.(5)
        map.setMaxPitch?.(175)

        // Floating panel for entering panorama URLs / exiting
        this.api.float.add({
            uid:       FLOAT_UID,
            name:      '360° View',
            component: this.PhotosphereFloat,
            width:     320,
            height:    200,
            x:         20,
            y:         20,
        })

        this.api.routes.add(
            {
                path:      'onemind-photosphere',
                name:      ROUTE_NAME,
                component: defineAsyncComponent(() => import('./src/PhotospherePanel.vue')),
            },
            'home-menu'
        )

        this.api.menu.add({
            key:         MENU_KEY,
            icon:        markRaw(IconView360),
            label:       '360° View',
            route:       ROUTE_NAME,
            tooltip:     'Immersive 360° panorama viewer',
            description: 'Step inside any equirectangular 360° photo anchored on the map',
        })
    }

    async disable(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = this.api.map as any
        map.setMinPitch?.(0)
        map.setMaxPitch?.(85)

        this.api.float.remove(FLOAT_UID)
        this.api.menu.remove(MENU_KEY)
        this.api.router.removeRoute(ROUTE_NAME)
    }
}
