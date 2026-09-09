<template>
  <div class="results-table">
    <div class="results-table__meta">
      {{ result.rowCount.toLocaleString() }} rows &nbsp;·&nbsp; {{ result.executionMs }}ms
    </div>
    <div class="results-table__scroll">
      <table>
        <thead>
          <tr>
            <th v-for="col in result.columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in result.rows" :key="i">
            <td v-for="col in result.columns" :key="col">{{ row[col] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClickHouseResult } from '../types'
defineProps<{ result: ClickHouseResult }>()
</script>

<style scoped>
.results-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.results-table__meta {
  padding: 4px 12px;
  font-size: 11px;
  color: #888;
  border-bottom: 1px solid #1a1a2a;
  background: #0a0c10;
}

.results-table__scroll {
  flex: 1;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

th {
  position: sticky;
  top: 0;
  background: #1a1a2e;
  color: #7b8cde;
  padding: 6px 10px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #2a2a3a;
  font-weight: normal;
  letter-spacing: 0.04em;
}

td {
  padding: 4px 10px;
  border-bottom: 1px solid #1a1a24;
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

tr:hover td {
  background: #1a1a2a;
}
</style>
