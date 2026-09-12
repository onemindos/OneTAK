import { ref } from 'vue'

export interface ElevPoint { lng: number; lat: number; elev: number | null; ts: number }

export const lastElevation = ref<ElevPoint | null>(null)
export const isQuerying    = ref(false)
export const readings      = ref<ElevPoint[]>([])
