export interface TilesetEntry {
    id: string
    label: string
    url: string
    visible: boolean
}

export interface XrEntityState {
    uid: string
    callsign: string
    lat: number
    lon: number
    hae: number
    type: string
    speed?: number
    course?: number
    stale: boolean
    ts: number
}
