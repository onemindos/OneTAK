# OneMind OneTAK Plugin Features

Complete reference for every plugin in `plugins/onemind/`. Covers what each plugin does,
how it works, what services it depends on, and how to extend it.

---

## Plugin Inventory

| Plugin | Status | Menu label | Service dependency |
|--------|--------|------------|-------------------|
| `nats/` | Active | NATS | `VITE_NATS_URL` |
| `hermes/` | Active | (float) | `VITE_NATS_URL` |
| `ops/` | Active | Ops | `VITE_NATS_URL` |
| `mumble/` | Active | (voice) | `VITE_MUMBLE_URL` |
| `clickhouse/` | Active | ClickHouse | `VITE_CLICKHOUSE_URL` |
| `legacy-ai/` | Active | (AI panel) | — |
| `map-tools/` | Active | Map Tools | — (offline capable) |
| `deck/` | Active | Deck Layers | — (offline capable) |
| `globe/` | Active | (bottom bar) | optional `VITE_CESIUM_ION_TOKEN` |

---

## `map-tools/` — Map Tools Plugin

**Menu entry:** Map Tools  
**Service deps:** None — all features work fully offline.

### Measure tab

Distance and area measurement directly on the map.

- **How it works:** Click vertices on the map, double-click to finish.
  Distances use `@turf/length` (already in deps). Areas use `@turf/area`.
- **Output:** Results list with type (distance/area) and value (km / km²).
- **MapLibre layers added:**
  - `onemind-measure-points` — vertex dots (amber circles)
  - `onemind-measure-line` — line/polygon between vertices (amber dashed)
  - `onemind-measure-fill` — polygon fill (amber, 15% opacity)
- **Clean up:** "Clear" button removes all layers and sources from the map.

### Terrain tab (Contour lines)

Overlays terrain contour lines from any raster DEM tile source.

- **How it works:** Uses `maplibre-contour` to read a DEM (Digital Elevation Model)
  raster source and generate contour vector tiles on the fly using a Web Worker.
- **DEM sources:**
  - Self-hosted (recommended): serve a terrarium-encoded PMTiles DEM via geo/martin
  - AWS: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`
  - Mapbox Terrain-RGB (requires token, encoding: `mapbox`)
- **Encoding:**
  - `terrarium` — Mapzen/AWS elevation encoding (default for self-hosted)
  - `mapbox` — Mapbox Terrain-RGB
- **Interval:** Contour line spacing in meters (default 100m; major lines every 5 intervals)
- **MapLibre layers added:**
  - `onemind-contour-lines` — contour lines (thin brown lines, thick every 5th)
  - `onemind-contour-labels` — elevation labels on major contours

### Import tab

Load KML, GPX, CSV, TopoJSON, TCX files as live map layers.

- **How it works:** Protocol handlers (kml://, gpx://, etc.) are registered with MapLibre
  via `maplibre-gl-vector-text-protocol` when the plugin enables. MapLibre converts each
  format to GeoJSON internally before rendering.
- **Accepted formats:**
  - `.kml` — Google Earth / TAK export files
  - `.gpx` — GPS track files, ATAK/WinTAK exports
  - `.csv` — coordinate tables with lon/lat columns
  - `.topojson` / `.json` — topological GeoJSON
  - `.tcx` — Garmin training/track files
- **Input methods:** Drag-and-drop file, file picker, or URL paste
- **MapLibre layers added per import:** line, fill, outline, points — auto-detected by geometry type
- **Clean up:** Remove button per layer; all sources/layers removed on plugin disable.

### Imagery tab (COG layers)

Load Cloud Optimized GeoTIFF imagery as raster map layers.

- **How it works:** The `cog://` protocol handler (from `maplibre-cog-protocol`) is registered
  when the plugin enables. Any HTTPS GeoTIFF accessible via HTTP range requests renders
  as a standard MapLibre raster source.
- **Typical sources:**
  - Drone ortho imagery (`.tif` output from Agisoft Metashape, DJI Terra, WebODM)
  - Aerial photography snapshots
  - Satellite imagery tiles for offline AO coverage
  - Any self-hosted GeoTIFF on a local server
- **Opacity control:** Per-layer opacity slider (0–100%).
- **URL format:** Plain HTTPS URL — the `cog://` prefix is added automatically.

### Offline tab

Pre-cache map tiles to the browser's Cache Storage for use in denied comms environments.

- **How it works:**
  1. Operator sets geographic bounds (auto-populated from current map view) and zoom range.
  2. Tile URLs are enumerated using `@mapbox/tile-cover` (already in deps).
  3. Tiles are fetched in parallel batches and stored in `onemind-tiles-v1` cache.
  4. When offline, a registered service worker (sw-tiles.js) intercepts tile requests
     and serves from the cache.
- **Tile count estimate:** shown before caching starts.
- **Batch size:** 10 tiles in parallel (configurable in offline.ts).
- **Abort:** Cancel button aborts the fetch loop without corrupting cached tiles.
- **Clear:** Removes the entire `onemind-tiles-v1` cache bucket.

### Export (map control)

Export the current map view as PDF, PNG, or SVG.

- **How it works:** Uses `@watergis/maplibre-gl-export` which adds a control button
  to the top-right of the map. Clicking it opens an export dialog.
- **Output:** PDF (300 DPI), PNG, SVG — user selects in the dialog.
- **Appears:** Top-right corner of the map when this plugin is enabled.

---

## `deck/` — deck.gl Visualization Plugin

**Menu entry:** Deck Layers  
**Service deps:** None — works with any data source passed to it.

### Architecture

Owns the single `MapLibreOverlay` instance (from `@deck.gl/mapbox`).
Runs in **interleaved mode** — deck.gl renders directly into MapLibre's WebGL2 context
on the same canvas, giving proper depth sorting between deck.gl layers and MapLibre features.

**Why only one overlay:** MapLibre can only handle one custom WebGL context injection.
All deck.gl layers in OneTAK go through this plugin's overlay singleton.

### 3D Tiles tab

Renders OGC 3D Tiles on the tactical map — buildings, photogrammetry models, LiDAR point clouds.

- **How it works:** Uses `@deck.gl/geo-layers` `Tile3DLayer` + `@loaders.gl/3d-tiles` `Tiles3DLoader`.
  No CesiumJS required. Points at any `tileset.json` HTTP endpoint.
- **Supported content:**
  - `.b3dm` Batched 3D Model — buildings, structures, vehicles, UAV meshes
  - `.pnts` Point Cloud — LiDAR scans, photogrammetry point clouds
  - `.i3dm` Instanced 3D Model — repeated objects (trees, poles, signs)
  - `.cmpt` Composite — mix of formats in one tile
- **Sources:**
  - Self-hosted: any static file server with a `tileset.json`
  - CesiumIon (optional): requires Ion token
  - ESRI I3S: building scene layers from ArcGIS
- **Controls:** opacity, point size, visibility toggle.
- **TAK use cases:** overlay photogrammetry site surveys, LiDAR building scans on AO map

### Heatmap tab

GPU-accelerated density heatmap from CoT/feature position data.

- **How it works:** Uses `@deck.gl/aggregation-layers` `HeatmapLayer`.
  Aggregates point density using a Gaussian kernel on the GPU.
- **Data source:** Feed CoT `DBFeature[]` from `api.feature.list()` or
  ClickHouse plugin query results.
- **Controls:** intensity, radius (pixels), threshold.
- **Color:** transparent (low) → blue → green → yellow → red (high density).
- **TAK use cases:** track density over time, threat concentration, sensor coverage,
  contact/sighting frequency by location.

### Trips tab

Animated CoT track history as moving trails.

- **How it works:** Uses `@deck.gl/geo-layers` `TripsLayer`.
  Each trip is a sequence of `[lng, lat, timestamp]` waypoints.
  `currentTime` controls the playback position.
- **Data source:** ClickHouse plugin — query `api.cot.history(uid, { start, end })`
  per unit, convert to `TripData[]`, attach to the layer config.
- **Controls:** trail length (seconds), line width, play/pause, speed multiplier (1x/5x/10x/60x).
- **Temporal control:** shared time scrubber — drag to any point in the time range,
  or hit Play to animate forward.
- **TAK use cases:** mission replay/debrief, SAR track visualization, convoy playback,
  pattern-of-life analysis.

### All Layers tab

Lists all active deck.gl layers with visibility toggles and remove buttons.

---

## `globe/` — CesiumJS 3D Globe Plugin

**Bottom bar:** 3D toggle button  
**Service deps:** Optional `VITE_CESIUM_ION_TOKEN` for world terrain + imagery.

### Architecture

CesiumJS mounts in a separate full-screen `<div>` injected into `document.body` via Vue `<teleport>`.
It sits above the MapLibre canvas. Closing the globe destroys the Cesium viewer and returns to MapLibre.

Camera position syncs **one-way** from MapLibre to Cesium on open (so you land in the same area).

### When to use Globe vs MapLibre

| Situation | Use |
|-----------|-----|
| 2D tactical ops, CoT overlays, normal use | MapLibre (default) |
| Arctic/polar operations — Mercator distortion unacceptable | Globe |
| Long-range arc visualization (great-circle routes) | Globe |
| 3D terrain fly-through for mission planning | Globe |
| WGS84-accurate area/distance at global scale | Globe |

### Offline setup (no CesiumIon)

1. Leave `VITE_CESIUM_ION_TOKEN` unset (or null).
2. Add a self-hosted terrain provider in `cesium.ts`:
   ```ts
   const terrain = new Cesium.CesiumTerrainProvider({ url: 'https://tiles.local/terrain' });
   ```
3. Add a local imagery provider:
   ```ts
   const imagery = new Cesium.TileMapServiceImageryProvider({ url: 'https://tiles.local/imagery' });
   ```
4. The globe will render fully offline with local tile assets.

### Vite config required

Cesium's WASM workers and widget CSS must be copied to the build output.
Add to `api/web/vite.config.ts`:

```ts
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default {
  plugins: [
    viteStaticCopy({
      targets: [{ src: 'node_modules/cesium/Build/Cesium', dest: '' }]
    })
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify('/Cesium/')
  }
}
```

---

## Plugin Auto-scan

All plugins in `plugins/onemind/*/index.ts` are automatically picked up by `main.ts`:

```ts
const plugins = import.meta.glob(
    ['../plugins/*.ts', '../plugins/*/index.ts'],
    { eager: true }
);
```

To add a new plugin: create `plugins/onemind/<name>/index.ts` that exports a default
class implementing `PluginInstance` (with `static install()`, `enable()`, `disable()`).

---

## PluginAPI surface

| Method | What it gives you |
|--------|------------------|
| `api.map` | MapLibre GL `Map` instance — add sources, layers, controls |
| `api.menu.add(item)` | Add entry to the main left-side menu |
| `api.routes.add(route, parent)` | Add a Vue Router route under `home-menu` |
| `api.float.add(opts)` | Add a draggable floating pane over the map |
| `api.bottomBar.add(item)` | Add a component to the bottom status bar |
| `api.feature.list()` | Query CoT features from local Dexie database |
| `api.feature.stream()` | RxJS observable stream of CoT feature changes |
| `api.cot.history(uid, opts)` | Fetch historical CoT track from TAK Server Marti |
| `api.breadcrumb.live.add(uid)` | Start live breadcrumb recording for a CoT UID |
| `api.pinia` | Pinia instance — for accessing any store |
