export interface ClickHouseQuery {
    id: string
    sql: string
    label?: string
    executedAt?: number
}

export interface ClickHouseResult {
    queryId: string
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
    executionMs: number
    error?: string
}

export interface TrackPoint {
    uid: string
    callsign: string
    lat: number
    lon: number
    alt: number
    speed: number
    course: number
    timestamp: number
    type: string
}

export interface ReplayState {
    active: boolean
    startTime: number
    endTime: number
    currentTime: number
    speedMultiplier: number
}

export interface PresetQuery {
    id: string
    label: string
    description: string
    sql: string
    category: 'tracks' | 'events' | 'intel' | 'custom'
}
