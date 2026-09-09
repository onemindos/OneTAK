# wintak/ — WinTAK Plugin Ports

Browser-native ports of WinTAK .wpk plugins.
WinTAK CIV is being sunset — these bring its capabilities to any device.

## Official WinTAK plugins being ported

Source: `WinTAK-CIV_5.8.0_loadout.zip` → `Plugins/`

| WinTAK .wpk | OneTAK plugin | Status | Description |
|-------------|---------------|--------|-------------|
| `DataSync-1.2.0.0.wpk` | `data-sync/` | planned | Data package sync between clients |
| `GRGBuilder-3.1.0.0.wpk` | `grg-builder/` | planned | Gridded Reference Graphic builder — map grid overlay tool |
| `Reports-3.0.0.0.wpk` | `reports/` | planned | SALUTE / SPOT / MEDEVAC / CASEVAC report forms |
| `TAKChat-1.0.0.0.wpk` | — | skip | Already in CloudTAK core |
| `VNS-1.0.0.0.wpk` | `vns/` | planned | Video/network streaming — wired to MediaMTX |
| `TakReplay-2.0.0.0.wpk` | `tak-replay/` | planned | Mission/track replay — wired to ClickHouse |

## SDK reference

`~/om-files/OneMind Guardian (TAK)/clients (latest)/WINTAK 5.8.0/WinTAK-SDK-Documentation-5.8.0.147.zip`
`~/om-files/OneMind Guardian (TAK)/clients (latest)/WINTAK 5.8.0/WinTAK.Templates.vsix`

## Porting notes

WinTAK plugins are C#/.NET WPF. Port approach:
- `DataSync` → Vue form + TAK data package API via `node-tak`
- `GRGBuilder` → MapLibre draw layer + grid generation utility
- `Reports` → Vue form wizard using `api.routes` + SALUTE/MEDEVAC CoT types
- `VNS` → MediaMTX proxy wired through CloudTAK's existing video-service lib
- `TakReplay` → ClickHouse query + MapLibre timeline scrubber via `api.map`

WinTAK keyboard shortcuts are first-class — operators expect them.
Use `@vueuse/core` `useEventListener` for keyboard bindings in each plugin.
