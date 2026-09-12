import { markRaw } from 'vue'
import type { App } from 'vue'
import type { PluginAPI, PluginInstance } from '../../../plugin'
import { IconLayoutColumns } from '@tabler/icons-vue'

const MENU_KEY   = 'onemind-compare'
const ROUTE_NAME = 'home-menu-onemind-compare'

export default class ComparePlugin implements PluginInstance {
    private api: PluginAPI

    constructor(api: PluginAPI) {
        this.api = api
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new ComparePlugin(api)
    }

    async enable(): Promise<void> {
        this.api.routes.add(
            {
                path:      'onemind-compare',
                name:      ROUTE_NAME,
                component: () => import('./src/CompareView.vue'),
            },
            'home-menu'
        )

        this.api.menu.add({
            key:         MENU_KEY,
            icon:        markRaw(IconLayoutColumns),
            label:       'Map Compare',
            route:       ROUTE_NAME,
            tooltip:     'Split-screen map comparison',
            description: 'Side-by-side map comparison with a draggable divider — great for WebODM before/after',
        })
    }

    async disable(): Promise<void> {
        this.api.menu.remove(MENU_KEY)
        this.api.router.removeRoute(ROUTE_NAME)
    }
}
