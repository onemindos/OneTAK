# OneTAK Plugins

All OneTAK features live here. This directory is auto-scanned at build time —
any `index.ts` in a subdirectory is loaded as a plugin automatically.

```
plugins/
├── onemind/     OneMind OS native service integrations (AI, voice, NATS, intel)
├── wintak/      WinTAK feature ports (browser equivalents of WinTAK .wpk plugins)
├── atak/        ATAK feature ports (browser equivalents of Android ATAK plugins)
└── takserver/   TAK Server integrations (CAD, geofence, DJI, injectors)
```

## How it works

`main.ts` scans this directory at startup:

```typescript
import.meta.glob(['../plugins/*.ts', '../plugins/*/index.ts'], { eager: true })
```

Every plugin is instantiated via `install()` then `enable()` once the map loads.

## Plugin contract

```typescript
import type { App } from 'vue';
import type { PluginAPI, PluginInstance } from '../../plugin.ts';

export default class MyPlugin implements PluginInstance {
    static async install(app: App, api: PluginAPI): Promise<PluginInstance>
    async enable(): Promise<void>   // map is loaded, wire up UI
    async disable(): Promise<void>  // clean up UI
}
```

## What the PluginAPI gives you

| API | What it does |
|-----|-------------|
| `api.map` | Direct MapLibre GL Map instance — add layers, sources, popups, controls |
| `api.menu` | Add/remove items in the side nav menu |
| `api.routes` | Add full Vue Router pages under `home-menu` |
| `api.float` | Create draggable floating panes over the map |
| `api.bottomBar` | Add components to the bottom status bar |
| `api.feature` | Read/stream live CoT features from IndexedDB |
| `api.cot` | Query historical CoT from TAK Server |
| `api.breadcrumb` | Enable/disable live track breadcrumb recording |

## Adding a new plugin

1. Create `plugins/<category>/<name>/index.ts`
2. Export a default class implementing `PluginInstance`
3. Done — it loads on next build

See `example.ts` in this directory for a minimal working scaffold.
