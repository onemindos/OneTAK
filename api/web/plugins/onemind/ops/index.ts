import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { Pinia } from 'pinia'
import { defineAsyncComponent } from 'vue'
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
        add: (opts: { uid: string; name?: string; component: unknown; props?: Record<string, unknown> }) => unknown
        remove: (uid: string) => void
        has: (uid: string) => boolean
    }
}

export interface PluginInstance {
    enable(): Promise<void>
    disable(): Promise<void>
}

const ROUTES: { name: string; path: string; view: string; label: string; description: string }[] = [
    { name: 'ops-inbox',    path: 'ops/inbox',    view: 'Inbox',       label: 'Inbox',        description: 'Messages and alerts' },
    { name: 'ops-schedule', path: 'ops/schedule', view: 'Schedule',    label: 'Schedule',     description: 'Missions and events' },
    { name: 'ops-log',      path: 'ops/log',      view: 'ActivityLog', label: 'Activity Log', description: 'Full operations log' },
    { name: 'ops-feeds',    path: 'ops/feeds',    view: 'FeedSystems', label: 'Feed Systems', description: 'Live intel feeds' },
    { name: 'ops-projects', path: 'ops/projects', view: 'Projects',    label: 'Projects',     description: 'Mission projects' },
]

export default class OmosOpsPlugin implements PluginInstance {
    private api: PluginAPI

    private constructor(api: PluginAPI) {
        this.api = api
    }

    static async install(app: App, api: PluginAPI): Promise<PluginInstance> {
        return new OmosOpsPlugin(api)
    }

    async enable(): Promise<void> {
        for (const r of ROUTES) {
            const view = r.view
            this.api.routes.add({
                path: r.path,
                name: r.name,
                component: defineAsyncComponent(() => import(`./src/views/${view}.vue`)),
            }, 'home-menu')

            this.api.menu.add({
                key: r.name,
                label: r.label,
                route: r.name,
                tooltip: r.label,
                description: r.description,
            })
        }

        await connectNats(this.api.pinia)
    }

    async disable(): Promise<void> {
        for (const r of ROUTES) {
            this.api.menu.remove(r.name)
            this.api.router.removeRoute(r.name)
        }
        await disconnectNats()
    }
}
