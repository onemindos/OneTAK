# takserver/ — TAK Server Integrations

Plugins that expose TAK Server capabilities directly in the map UI.

## Plugins

| Plugin | Status | Description |
|--------|--------|-------------|
| `cad/` | planned | Computer-Aided Dispatch — incidents, unit assignment, CAD feed |
| `geofence/` | planned | Geofence management — create zones, alerts, Tile38 integration |
| `dji/` | planned | DJI drone — CloudTAK-DJI Open Cloud API |
| `injectors/` | planned | TAK Server injector management |

## References

- `cad/` — `onemindos/tak-cad` fork + dfpc-coe CAD ETL patterns
- `geofence/` — `dfpc-coe/CloudTAK-Geofence` + `geo/tile38` in cluster
- `dji/` — `dfpc-coe/CloudTAK-DJI` Open Cloud API extension
- `injectors/` — `@tak-ps/node-tak` TAKAPI SDK

## SDK reference

`~/om-files/OneMind Guardian (TAK)/server/5.8.0/tak-server-sdk-5.8.zip`
