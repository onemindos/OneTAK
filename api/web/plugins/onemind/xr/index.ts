import { markRaw, defineAsyncComponent } from 'vue'
import type { App } from 'vue'
import type { PluginAPI, PluginInstance } from '../../../plugin'
import { IconAugmentedReality } from '@tabler/icons-vue'
import { connectNats, disconnectNats } from './src/nats'

const MENU_KEY   = 'onemind-xr'
const ROUTE_NAME = 'home-menu-onemind-xr'

export default class XrPlugin implements PluginInstance {
    private api: PluginAPI

    constructor(api: PluginAPI) {
        this.api = api
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new XrPlugin(api)
    }

    async enable(): Promise<void> {
        await connectNats()

        this.api.routes.add(
            {
                path:      'onemind-xr',
                name:      ROUTE_NAME,
                component: defineAsyncComponent(() => import('./src/XrView.vue')),
            },
            'home-menu'
        )

        this.api.menu.add({
            key:         MENU_KEY,
            icon:        markRaw(IconAugmentedReality),
            label:       'XR View',
            route:       ROUTE_NAME,
            tooltip:     'Immersive 3D · WebXR · Quest 3',
            description: '3D Tiles in browser · Enter VR/AR on Quest 3 · Live entities from NATS bus',
        })
    }

    async disable(): Promise<void> {
        await disconnectNats()
        this.api.menu.remove(MENU_KEY)
        this.api.router.removeRoute(ROUTE_NAME)
    }
}
