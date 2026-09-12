import { markRaw, defineAsyncComponent } from 'vue'
import type { App } from 'vue'
import type { PluginAPI, PluginInstance } from '../../../plugin'
import { IconGlobe } from '@tabler/icons-vue'

const MENU_KEY   = 'onemind-globe'
const ROUTE_NAME = 'home-menu-onemind-globe'

const FOG_CONFIG = {
    range:            [0.5, 10],
    'horizon-blend':  0.08,
    color:            'rgba(138, 178, 220, 0.6)',
    'high-color':     '#1a4a9e',
    'space-color':    '#060b1a',
    'star-intensity': 0.18,
}

const SKY_LAYER = {
    id:   'onemind-sky',
    type: 'sky',
    paint: {
        'sky-type':                       'atmosphere',
        'sky-atmosphere-color':           'rgba(85, 151, 220, 0.75)',
        'sky-atmosphere-halo-color':      'rgba(135, 196, 255, 0.57)',
        'sky-atmosphere-sun-intensity':   5,
    },
}

export default class GlobePlugin implements PluginInstance {
    private api: PluginAPI

    constructor(api: PluginAPI) {
        this.api = api
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new GlobePlugin(api)
    }

    async enable(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = this.api.map as any

        map.setProjection({ type: 'globe' })
        map.setFog(FOG_CONFIG)

        if (!map.getLayer('onemind-sky')) {
            map.addLayer(SKY_LAYER)
        }

        this.api.routes.add(
            {
                path:      'onemind-globe',
                name:      ROUTE_NAME,
                component: defineAsyncComponent(() => import('./src/GlobePanel.vue')),
            },
            'home-menu'
        )

        this.api.menu.add({
            key:         MENU_KEY,
            icon:        markRaw(IconGlobe),
            label:       'Globe',
            route:       ROUTE_NAME,
            tooltip:     'Globe view',
            description: '3D globe projection · Atmosphere · Terrain control',
        })
    }

    async disable(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = this.api.map as any

        if (map.getLayer('onemind-sky')) map.removeLayer('onemind-sky')
        if (map.getSource('onemind-dem')) {
            map.setTerrain(null)
            map.removeSource('onemind-dem')
        }
        map.setFog({})
        map.setProjection({ type: 'mercator' })

        this.api.menu.remove(MENU_KEY)
        this.api.router.removeRoute(ROUTE_NAME)
    }
}
