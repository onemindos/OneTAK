import { h } from 'vue';
import type { App } from 'vue';
import type { PluginAPI, PluginInstance } from '../../plugin';
import MenuTemplate from './lib/MenuTemplate.vue';
import NatsConsole from './lib/NatsConsole/NatsConsole.vue';
import NatsBottomBar from './lib/NatsBottomBar.vue';
import IconNats from './lib/IconNats.vue';

const ROUTE_CONSOLE  = 'home-menu-omos-nats-console';
const MENU_KEY       = 'omos-nats';
const BB_KEY         = 'omos-nats-status';

export default class OmosNats implements PluginInstance {
    api: PluginAPI;

    constructor(api: PluginAPI) {
        this.api = api;
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new OmosNats(api);
    }

    async enable(): Promise<void> {
        // ── Main route: full NATS operator console ─────────────────────────────
        this.api.routes.add(
            {
                path: 'omos-nats',
                name: ROUTE_CONSOLE,
                component: {
                    render: () => h(MenuTemplate, { name: 'NATS Console' }, {
                        default: () => h(NatsConsole)
                    })
                },
            },
            'home-menu'
        );

        // ── Menu entry ─────────────────────────────────────────────────────────
        this.api.menu.add({
            key:         MENU_KEY,
            label:       'NATS',
            route:       ROUTE_CONSOLE,
            tooltip:     'NATS fabric operator console',
            description: 'Wire tap, Bus topology, Streams, KV, Security audit',
            icon:        IconNats,
        });

        // ── Bottom bar: live NATS connection status ────────────────────────────
        this.api.bottomBar.add({
            key:       BB_KEY,
            component: NatsBottomBar,
        });
    }

    async disable(): Promise<void> {
        this.api.bottomBar.remove(BB_KEY);
        this.api.menu.remove(MENU_KEY);
        this.api.router.removeRoute(ROUTE_CONSOLE);
    }
}
