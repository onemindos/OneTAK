<template>
    <div class="ops-view ops-schedule">
        <div class="ops-header">
            <h2>Schedule</h2>
            <button
                class="btn-add"
                @click="showAdd = true"
            >
                + Add
            </button>
        </div>

        <div
            v-if="store.schedule.length === 0"
            class="ops-empty"
        >
            No scheduled items.
        </div>

        <ul
            v-else
            class="ops-list"
        >
            <li
                v-for="item in sorted"
                :key="item.id"
                class="ops-item"
            >
                <div class="ops-item-header">
                    <span
                        class="ops-tag"
                        :class="item.type"
                    >{{ item.type }}</span>
                    <span class="ops-time">{{ formatDateTime(item.startAt) }}</span>
                </div>
                <div class="ops-item-title">
                    {{ item.title }}
                </div>
                <div
                    v-if="item.notes"
                    class="ops-item-notes"
                >
                    {{ item.notes }}
                </div>
            </li>
        </ul>

        <div
            v-if="showAdd"
            class="ops-modal-backdrop"
            @click.self="showAdd = false"
        >
            <div class="ops-modal">
                <h3>New Schedule Item</h3>
                <label>Title<input
                    v-model="form.title"
                    type="text"
                ></label>
                <label>Type
                    <select v-model="form.type">
                        <option>mission</option>
                        <option>maintenance</option>
                        <option>briefing</option>
                        <option>other</option>
                    </select>
                </label>
                <label>Start<input
                    v-model="form.startAt"
                    type="datetime-local"
                ></label>
                <label>Notes<textarea
                    v-model="form.notes"
                    rows="3"
                /></label>
                <div class="ops-modal-actions">
                    <button @click="addItem">
                        Add
                    </button>
                    <button @click="showAdd = false">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useOpsStore } from '../store'
import type { OpsScheduleItem } from '../types'

const store = useOpsStore()
const showAdd = ref(false)
const form = reactive({ title: '', type: 'mission', startAt: '', notes: '' })

const sorted = computed(() =>
  [...store.schedule].sort((a, b) => a.startAt - b.startAt)
)

function addItem() {
  if (!form.title || !form.startAt) return
  const item: OpsScheduleItem = {
    id: `sched-${Date.now()}`,
    title: form.title,
    type: form.type as OpsScheduleItem['type'],
    startAt: new Date(form.startAt).getTime(),
    notes: form.notes || undefined,
  }
  store.schedule.push(item)
  Object.assign(form, { title: '', type: 'mission', startAt: '', notes: '' })
  showAdd.value = false
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString()
}
</script>

<style scoped>
.ops-view { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.ops-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border-color, #333); }
.ops-header h2 { margin: 0; font-size: 1rem; font-weight: 600; }
.btn-add { font-size: 0.8rem; padding: 4px 10px; border-radius: 4px; border: 1px solid #4a9eff; background: transparent; color: #4a9eff; cursor: pointer; }
.ops-empty { padding: 24px 16px; opacity: 0.5; font-size: 0.875rem; }
.ops-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
.ops-item { padding: 10px 16px; border-bottom: 1px solid var(--border-color, #333); }
.ops-item-header { display: flex; align-items: center; gap: 8px; }
.ops-tag { font-size: 0.7rem; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; font-weight: 600; }
.ops-tag.mission { background: #2d3748; color: #48bb78; }
.ops-tag.maintenance { background: #2d3748; color: #ed8936; }
.ops-tag.briefing { background: #2d3748; color: #4a9eff; }
.ops-tag.other { background: #2d3748; color: #a0aec0; }
.ops-time { font-size: 0.75rem; opacity: 0.6; margin-left: auto; }
.ops-item-title { font-size: 0.9rem; margin-top: 4px; }
.ops-item-notes { font-size: 0.8rem; opacity: 0.6; margin-top: 3px; }
.ops-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.ops-modal { background: #1a202c; border: 1px solid #333; border-radius: 8px; padding: 20px; min-width: 320px; display: flex; flex-direction: column; gap: 10px; }
.ops-modal h3 { margin: 0 0 8px; font-size: 1rem; }
.ops-modal label { display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; }
.ops-modal input, .ops-modal select, .ops-modal textarea { padding: 6px; border-radius: 4px; border: 1px solid #444; background: #2d3748; color: inherit; }
.ops-modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.ops-modal-actions button { padding: 6px 14px; border-radius: 4px; border: 1px solid #444; background: #2d3748; color: inherit; cursor: pointer; }
</style>
