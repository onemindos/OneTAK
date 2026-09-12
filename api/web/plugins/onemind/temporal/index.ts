import { markRaw, defineAsyncComponent } from 'vue'
import type { App, Component } from 'vue'
import type { PluginAPI, PluginInstance } from '../../../plugin'
import { IconClock } from '@tabler/icons-vue'
import { isEnabled, isLive, timeRangeEnd } from './src/state'

const MENU_KEY   = 'onemind-temporal'
const ROUTE_NAME = 'home-menu-onemind-temporal'
const FLOAT_UID  = 'onemind-temporal-float'

export default class TemporalPlugin implements PluginInstance {
    private api: PluginAPI
    private TemporalFloat: Component
    private _liveTimer?: ReturnType<typeof setInterval>

    constructor(api: PluginAPI, TemporalFloat: Component) {
        this.api          = api
        this.TemporalFloat = TemporalFloat
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        const { default: TemporalFloat } = await import('./src/TemporalFloat.vue')
        return new TemporalPlugin(api, TemporalFloat)
    }

    async enable(): Promise<void> {
        isEnabled.value = true

        this._liveTimer = setInterval(() => {
            if (isLive.value) timeRangeEnd.value = Date.now()
        }, 30_000)

        this.api.float.add({
            uid:       FLOAT_UID,
            name:      'Time Scrubber',
            component: this.TemporalFloat,
            width:     300,
            height:    260,
            x:         20,
            y:         80,
        })

        this.api.routes.add(
            {
                path:      'onemind-temporal',
                name:      ROUTE_NAME,
                component: defineAsyncComponent(() => import('./src/TemporalPanel.vue')),
            },
            'home-menu'
        )

        this.api.menu.add({
            key:         MENU_KEY,
            icon:        markRaw(IconClock),
            label:       'Time Scrubber',
            route:       ROUTE_NAME,
            tooltip:     'Filter map entities by time window',
            description: 'Scrub through time — filter CoT entities by timestamp window',
        })
    }

    async disable(): Promise<void> {
        isEnabled.value = false
        clearInterval(this._liveTimer)

        this.api.float.remove(FLOAT_UID)
        this.api.menu.remove(MENU_KEY)
        this.api.router.removeRoute(ROUTE_NAME)
    }
}
