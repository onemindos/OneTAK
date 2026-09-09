import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ClickHouseQuery, ClickHouseResult, ReplayState, PresetQuery } from './types'

export const PRESET_QUERIES: PresetQuery[] = [
    {
        id: 'tracks-last-hour',
        label: 'All tracks — last hour',
        description: 'Every CoT position recorded in the past 60 minutes',
        category: 'tracks',
        sql: `SELECT uid, callsign, lat, lon, alt, speed, course, timestamp, type
FROM cot_events
WHERE timestamp >= now() - INTERVAL 1 HOUR
ORDER BY timestamp DESC
LIMIT 10000`,
    },
    {
        id: 'unit-track',
        label: 'Single unit track',
        description: 'Full position history for one UID',
        category: 'tracks',
        sql: `SELECT uid, callsign, lat, lon, alt, speed, course, timestamp
FROM cot_events
WHERE uid = '{{uid}}'
ORDER BY timestamp ASC`,
    },
    {
        id: 'event-frequency',
        label: 'Event frequency by hour',
        description: 'How many CoT events per hour over the past 24 hours',
        category: 'events',
        sql: `SELECT toStartOfHour(timestamp) AS hour, count() AS events
FROM cot_events
WHERE timestamp >= now() - INTERVAL 24 HOUR
GROUP BY hour
ORDER BY hour ASC`,
    },
    {
        id: 'active-units',
        label: 'Active units — last 15 min',
        description: 'Unique callsigns with a position in the past 15 minutes',
        category: 'intel',
        sql: `SELECT uid, callsign, argMax(lat, timestamp) AS lat, argMax(lon, timestamp) AS lon,
       max(timestamp) AS last_seen
FROM cot_events
WHERE timestamp >= now() - INTERVAL 15 MINUTE
GROUP BY uid, callsign
ORDER BY last_seen DESC`,
    },
    {
        id: 'nine-line',
        label: '9-line events',
        description: 'All 9-line / MEDEVAC CoT events',
        category: 'intel',
        sql: `SELECT uid, callsign, lat, lon, timestamp, detail
FROM cot_events
WHERE type LIKE 'b-r-f-h-c%'
ORDER BY timestamp DESC
LIMIT 500`,
    },
]

export const useClickHouseStore = defineStore('cloudtak-clickhouse', () => {
    const queryHistory = ref<ClickHouseQuery[]>([])
    const results = ref<Map<string, ClickHouseResult>>(new Map())
    const activeQueryId = ref<string | null>(null)
    const loading = ref(false)
    const replay = ref<ReplayState>({
        active: false,
        startTime: 0,
        endTime: 0,
        currentTime: 0,
        speedMultiplier: 1,
    })

    const activeResult = computed(() =>
        activeQueryId.value ? results.value.get(activeQueryId.value) ?? null : null
    )

    function addQuery(query: ClickHouseQuery) {
        queryHistory.value.unshift(query)
        if (queryHistory.value.length > 50) queryHistory.value.pop()
    }

    function setResult(result: ClickHouseResult) {
        results.value.set(result.queryId, result)
        activeQueryId.value = result.queryId
    }

    function clearResults() {
        results.value.clear()
        activeQueryId.value = null
    }

    return {
        queryHistory,
        results,
        activeQueryId,
        loading,
        replay,
        activeResult,
        addQuery,
        setResult,
        clearResults,
        PRESET_QUERIES,
    }
})
