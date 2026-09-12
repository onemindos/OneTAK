declare module 'maplibre-gl-photosphere' {
    import type { Map } from 'maplibre-gl'

    export interface PanoTarget {
        lngLat:   { lng: number; lat: number }
        imageUrl: string
        heading?: number
    }

    export class Photosphere {
        constructor(map: Map)
        enter(target: PanoTarget): void
        goTo(target: PanoTarget): void
        exit(): void
    }

    export function visibleTiles(...args: unknown[]): unknown
}
