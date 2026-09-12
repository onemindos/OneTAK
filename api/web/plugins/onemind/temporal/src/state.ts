import { ref, computed } from 'vue'

export const isEnabled = ref(false)

export const timeRangeStart = ref<number>(Date.now() - 3600_000)
export const timeRangeEnd   = ref<number>(Date.now())
export const isLive         = ref(true)

export const formattedStart = computed(() =>
    new Date(timeRangeStart.value).toISOString().replace('T', ' ').slice(0, 19)
)
export const formattedEnd = computed(() =>
    new Date(timeRangeEnd.value).toISOString().replace('T', ' ').slice(0, 19)
)

export const PRESETS = [
    { label: '15 min',  ms: 15 * 60_000 },
    { label: '1 hour',  ms: 60 * 60_000 },
    { label: '6 hours', ms: 6 * 3600_000 },
    { label: '24 hours', ms: 24 * 3600_000 },
    { label: '7 days',  ms: 7 * 86400_000 },
]
