<template>
    <div class="ch-view">
        <div class="ch-view__sidebar">
            <PresetQueries @select="onPreset" />
            <QueryHistory @select="onHistorySelect" />
        </div>
        <div class="ch-view__main">
            <QueryBar
                v-model="sql"
                :loading="store.loading"
                @run="runQuery"
            />
            <ResultsTable
                v-if="store.activeResult && !store.activeResult.error"
                :result="store.activeResult"
            />
            <div
                v-else-if="store.activeResult?.error"
                class="ch-view__error"
            >
                {{ store.activeResult.error }}
            </div>
            <TrackReplay
                v-if="hasTrackData"
                :result="store.activeResult!"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClickHouseStore } from '../store'
import { executeQuery } from '../api'
import QueryBar from '../components/QueryBar.vue'
import ResultsTable from '../components/ResultsTable.vue'
import TrackReplay from '../components/TrackReplay.vue'
import PresetQueries from '../components/PresetQueries.vue'
import QueryHistory from '../components/QueryHistory.vue'

const store = useClickHouseStore()
const sql = ref('')

const hasTrackData = computed(() => {
    const r = store.activeResult
    if (!r) return false
    return r.columns.includes('lat') && r.columns.includes('lon') && r.columns.includes('timestamp')
})

async function runQuery() {
    if (!sql.value.trim() || store.loading) return
    const queryId = `q-${Date.now()}`
    store.loading = true
    store.addQuery({ id: queryId, sql: sql.value, executedAt: Date.now() })
    const result = await executeQuery(sql.value, queryId)
    store.setResult(result)
    store.loading = false
}

function onPreset(presetSql: string) {
    sql.value = presetSql
}

function onHistorySelect(historySql: string) {
    sql.value = historySql
}
</script>

<style scoped>
.ch-view {
    display: flex;
    height: 100%;
    background: #0f1117;
    color: #e0e0e0;
    font-family: monospace;
}

.ch-view__sidebar {
    width: 260px;
    border-right: 1px solid #2a2a3a;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.ch-view__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.ch-view__error {
    margin: 12px;
    padding: 10px;
    background: #2a0a0a;
    border: 1px solid #ff4444;
    border-radius: 4px;
    color: #ff8888;
    font-size: 12px;
    white-space: pre-wrap;
}
</style>
