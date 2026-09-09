<template>
  <div class="history">
    <div class="history__header">History</div>
    <div v-if="!store.queryHistory.length" class="history__empty">No queries yet</div>
    <div
      v-for="q in store.queryHistory"
      :key="q.id"
      class="history__item"
      @click="$emit('select', q.sql)"
    >
      <span class="history__sql">{{ q.sql.slice(0, 60).replace(/\s+/g, ' ') }}…</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClickHouseStore } from '../store'
defineEmits<{ select: [sql: string] }>()
const store = useClickHouseStore()
</script>

<style scoped>
.history__header {
  padding: 8px 12px 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #555;
}

.history__empty {
  padding: 8px 12px;
  font-size: 11px;
  color: #444;
}

.history__item {
  padding: 6px 12px;
  cursor: pointer;
  border-bottom: 1px solid #1a1a2a;
}

.history__item:hover {
  background: #1a1a2e;
}

.history__sql {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
</style>
