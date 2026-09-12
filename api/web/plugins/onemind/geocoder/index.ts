import { markRaw, defineAsyncComponent } from 'vue'
import type { App } from 'vue'
import type { PluginAPI, PluginInstance } from '../../../plugin'
import { IconSearch } from '@tabler/icons-vue'
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder'
import maplibregl from 'maplibre-gl'
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css'

const NOMINATIM_URL = import.meta.env.VITE_NOMINATIM_URL ?? 'https://nominatim.onemindos.dev'

const MENU_KEY   = 'onemind-geocoder'
const ROUTE_NAME = 'home-menu-onemind-geocoder'

const geocoderApi = {
    async forwardGeocode(config: { query: string }) {
        try {
            const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(config.query)}&format=geojson&limit=8&addressdetails=1`
            const res  = await fetch(url)
            const data = await res.json()
            return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                features: (data.features ?? []).map((f: any) => ({
                    type:       'Feature',
                    geometry:   f.geometry,
                    place_name: f.properties.display_name,
                    center:     f.geometry.coordinates,
                    place_type: ['place'],
                    properties: f.properties,
                })),
            }
        } catch {
            return { features: [] }
        }
    },
    async reverseGeocode(config: { query: { lat: number; lng: number } }) {
        try {
            const { lat, lng } = config.query
            const url = `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=geojson`
            const res  = await fetch(url)
            const data = await res.json()
            return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                features: (data.features ?? []).map((f: any) => ({
                    type:       'Feature',
                    geometry:   f.geometry,
                    place_name: f.properties.display_name,
                    center:     f.geometry.coordinates,
                    place_type: ['place'],
                    properties: f.properties,
                })),
            }
        } catch {
            return { features: [] }
        }
    },
}

export default class GeocoderPlugin implements PluginInstance {
    private api:     PluginAPI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private geocoder: any = null

    constructor(api: PluginAPI) {
        this.api = api
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new GeocoderPlugin(api)
    }

    async enable(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.geocoder = new MaplibreGeocoder(geocoderApi as any, {
            maplibregl,
            placeholder: 'Search places...',
            collapsed:   false,
        })

        this.api.map.addControl(this.geocoder, 'top-left')

        this.api.routes.add(
            {
                path:      'onemind-geocoder',
                name:      ROUTE_NAME,
                component: defineAsyncComponent(() => import('./src/GeocoderPanel.vue')),
            },
            'home-menu'
        )

        this.api.menu.add({
            key:         MENU_KEY,
            icon:        markRaw(IconSearch),
            label:       'Geocoder',
            route:       ROUTE_NAME,
            tooltip:     'Search for places',
            description: 'Address & place search powered by your Nominatim instance',
        })
    }

    async disable(): Promise<void> {
        if (this.geocoder) {
            this.api.map.removeControl(this.geocoder)
            this.geocoder = null
        }
        this.api.menu.remove(MENU_KEY)
        this.api.router.removeRoute(ROUTE_NAME)
    }
}
