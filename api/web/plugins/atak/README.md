# atak/ — ATAK Plugin Ports

Browser-native ports of Android ATAK plugins.
Same capability, any device, no APK required.

## Plugins

| ATAK source APK | OneTAK plugin | Status | Description |
|-----------------|---------------|--------|-------------|
| `ATAK-Plugin-taktalk` | `taktalk/` | planned | PTT voice — integrates with Mumble plugin |
| `ATAK-Plugin-Trackers` | `tracker/` | planned | Multi-source tracker management on map |
| `ATAK-Plugin-Address` | `address/` | planned | Address/geocoding lookup — Nominatim |
| `ATAK-Plugin-RIDAR` | `ridar/` | planned | Radar overlay on MapLibre |
| `ATAK-Plugin-landsar` | `landsar/` | planned | Land search and rescue — grids, assignments |
| `AVO_plugin` | `avo/` | planned | Audio/Video over TAK — MediaMTX |
| `tak-ml plugin` | `tak-ml/` | planned | ML inference overlay — takml-server:8234 |

## Source APKs

`~/om-files/OneMind Guardian (TAK)/clients (latest)/GOTAK-FREE-PLUGINS - ATAK Plugins/`
`~/om-files/OneMind Guardian (TAK)/tak-ml/plugins/`

## SDK reference

`~/om-files/OneMind Guardian (TAK)/clients (latest)/ATAK-CIV 5.8.0/ATAK-CIV-5.8.0.1-SDK.zip`

## Porting approach

ATAK plugins are Java/Android. Concept mapping:

| ATAK | OneTAK |
|------|--------|
| `MapComponent` | `api.map` — add MapLibre layer/source |
| `DropDownReceiver` | `api.routes.add()` under `home-menu` |
| `MapMenuButtonWidget` | `api.menu.add()` |
| Floating UI | `api.float.add()` |
| CoT event listener | `api.feature.stream()` |
| Android intent broadcast | NATS subject publish |
