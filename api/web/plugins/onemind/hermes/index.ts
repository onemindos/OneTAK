import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { Pinia } from 'pinia'
import { connectNats, disconnectNats } from './src/nats'

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
            actions?: unknown
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

const FLOAT_UID = 'omos-ai-hermes'

export default class OmosAiPlugin implements PluginInstance {
    private api: PluginAPI
    private AiPanel: unknown

    private constructor(api: PluginAPI, AiPanel: unknown) {
        this.api = api
        this.AiPanel = AiPanel
    }

    static async install(app: App, api: PluginAPI): Promise<PluginInstance> {
        const { default: AiPanel } = await import('./src/components/AiPanel.vue')
        return new OmosAiPlugin(api, AiPanel)
    }

    async enable(): Promise<void> {
        await connectNats(this.api.pinia)

        if (!this.api.float.has(FLOAT_UID)) {
            this.api.float.add({
                uid: FLOAT_UID,
                name: 'Hermes',
                component: this.AiPanel,
                width: 380,
                height: 520,
                x: 20,
                y: 80,
            })
        }
    }

    async disable(): Promise<void> {
        this.api.float.remove(FLOAT_UID)
        await disconnectNats()
    }
}
