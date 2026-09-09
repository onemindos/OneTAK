import type { App } from 'vue'
import type { Pinia } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { defineAsyncComponent } from 'vue'
import { configureClickHouse } from './src/api'

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
        add: (opts: { uid: string; name?: string; component: unknown; props?: Record<string, unknown> }) => unknown
        remove: (uid: string) => void
        has: (uid: string) => boolean
    }
}

export interface PluginInstance {
    enable(): Promise<void>
    disable(): Promise<void>
}

const ROUTE_NAME = 'clickhouse'

export default class ClickHousePlugin implements PluginInstance {
    private api: PluginAPI

    private constructor(api: PluginAPI) {
        this.api = api
    }

    static async install(app: App, api: PluginAPI): Promise<PluginInstance> {
        return new ClickHousePlugin(api)
    }

    async enable(): Promise<void> {
        configureClickHouse({
            baseUrl: import.meta.env?.VITE_CLICKHOUSE_URL ?? 'http://clickhouse:8123',
            database: import.meta.env?.VITE_CLICKHOUSE_DB ?? 'onemind',
            username: import.meta.env?.VITE_CLICKHOUSE_USER ?? 'default',
            password: import.meta.env?.VITE_CLICKHOUSE_PASSWORD ?? '',
        })

        this.api.routes.add({
            path: 'clickhouse',
            name: ROUTE_NAME,
            component: defineAsyncComponent(() => import('./src/views/ClickHouseView.vue')),
        }, 'home-menu')

        this.api.menu.add({
            key: ROUTE_NAME,
            label: 'Time Machine',
            route: ROUTE_NAME,
            tooltip: 'Time Machine',
            description: 'Query historical CoT from ClickHouse',
        })
    }

    async disable(): Promise<void> {
        this.api.menu.remove(ROUTE_NAME)
        this.api.router.removeRoute(ROUTE_NAME)
    }
}
