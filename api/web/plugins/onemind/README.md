# onemind/ — OneMind OS Native Integrations

Plugins that wire OneMind OS infrastructure directly into the map.
These are the core OneTAK differentiators — AI, voice, intel, and NATS
as first-class features of the platform.

## Plugins

| Plugin | Status | Description |
|--------|--------|-------------|
| `hermes/` | migrate | Hermes AI — floating pane over map, NATS pub/sub, tool approve/deny cards |
| `nats/` | migrate | NATS console — wire tap, topology, streams, KV browser, publish |
| `mumble/` | migrate | Mumble voice — channel tree, talking indicators, push-to-talk |
| `clickhouse/` | migrate | ClickHouse time machine — CoT history, track replay, intel timeline |
| `ops/` | migrate | Ops layer — inbox, scheduling, activity log, feeds, projects |
| `legacy-ai/` | migrate | Legacy AI chat panel |

## Service dependencies

These plugins gate themselves on env vars. If the service isn't deployed,
the plugin's `enable()` returns early and nothing shows in the UI.

| Plugin | Env var | Service |
|--------|---------|---------|
| hermes | `VITE_NATS_URL` | NATS + Hermes agent |
| nats | `VITE_NATS_URL` | NATS cluster |
| mumble | `VITE_MUMBLE_URL` | Murmur + mumble-bridge |
| clickhouse | `VITE_CLICKHOUSE_URL` | ClickHouse |

## Source repos (to migrate from)

- `onemindos/onetak-plugin-hermes`
- `onemindos/onetak-plugin-nats`
- `onemindos/onetak-plugin-mumble`
- `onemindos/onetak-plugin-clickhouse`
- `onemindos/onetak-plugin-ops`
- `onemindos/onetak-plugin-legacy-ai`
