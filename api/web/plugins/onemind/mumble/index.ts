import type { App } from 'vue'
import type { Pinia } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { connect, disconnect } from './src/mumble'

// Minimal local types matching the real CloudTAK PluginAPI shape.
// Source of truth: @tak-ps/cloudtak — CloudTAK-Plugin-Sample for field names.
interface MenuItemConfig {
    key: string
    label: string
    icon?: unknown
    route: string
    tooltip?: string
    description?: string
    routeExternal?: boolean
}

interface BottomBarItemConfig {
    key: string
    component: unknown
}

interface PluginAPI {
    app: App
    pinia: Pinia
    router: { removeRoute(name: string | symbol): void }
    menu: {
        add: (item: MenuItemConfig) => void
        remove: (key: string) => void
    }
    routes: {
        add: (route: RouteRecordRaw, parentName?: string) => void
    }
    bottomBar: {
        add: (item: BottomBarItemConfig) => void
        remove: (key: string) => void
    }
    float: {
        add: (opts: {
            uid: string
            name?: string
            component: unknown
            props?: Record<string, unknown>
            height?: number
            width?: number
            x?: number
            y?: number
        }) => unknown
        remove: (uid: string) => void
        has: (uid: string) => boolean
    }
}

export interface PluginInstance {
    enable(): Promise<void>
    disable(): Promise<void>
}

const FLOAT_UID = 'cloudtak-mumble'

export default class MumblePlugin implements PluginInstance {
    private api: PluginAPI
    private MumblePanel: unknown

    private constructor(api: PluginAPI, MumblePanel: unknown) {
        this.api = api
        this.MumblePanel = MumblePanel
    }

    static async install(app: App, api: PluginAPI): Promise<PluginInstance> {
        const { default: MumblePanel } = await import('./src/components/MumblePanel.vue')
        return new MumblePlugin(api, MumblePanel)
    }

    async enable(): Promise<void> {
        connect(this.api.pinia)

        if (!this.api.float.has(FLOAT_UID)) {
            this.api.float.add({
                uid: FLOAT_UID,
                name: 'Mumble',
                component: this.MumblePanel,
                width: 300,
                height: 480,
                x: 420,
                y: 80,
            })
        }
    }

    async disable(): Promise<void> {
        this.api.float.remove(FLOAT_UID)
        disconnect()
    }
}
