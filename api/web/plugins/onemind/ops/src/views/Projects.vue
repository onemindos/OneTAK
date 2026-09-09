<template>
  <div class="ops-view ops-projects">
    <div class="ops-header">
      <h2>Projects</h2>
      <button class="btn-add" @click="showAdd = true">+ New</button>
    </div>

    <div v-if="store.projects.length === 0" class="ops-empty">
      No projects. Create one to start tracking work.
    </div>

    <div v-else class="ops-grid">
      <div
        v-for="proj in store.projects"
        :key="proj.id"
        class="ops-card"
        :class="proj.status"
        @click="selected = selected?.id === proj.id ? null : proj"
      >
        <div class="ops-card-header">
          <span class="ops-status-dot" :class="proj.status" />
          <span class="ops-proj-name">{{ proj.name }}</span>
          <span class="ops-task-count">{{ proj.tasks.length }} tasks</span>
        </div>
        <div v-if="proj.description" class="ops-proj-desc">{{ proj.description }}</div>
      </div>
    </div>

    <div v-if="selected" class="ops-detail">
      <div class="ops-detail-header">
        <h3>{{ selected.name }}</h3>
        <button class="btn-icon" @click="selected = null">✕</button>
      </div>
      <div v-if="tasks(selected).length === 0" class="ops-empty">No tasks yet.</div>
      <ul v-else class="ops-task-list">
        <li v-for="task in tasks(selected)" :key="task.id" class="ops-task-item" :class="task.status">
          <span class="ops-task-status">{{ task.status }}</span>
          <span class="ops-task-title">{{ task.title }}</span>
          <span class="ops-priority" :class="task.priority">{{ task.priority }}</span>
        </li>
      </ul>
    </div>

    <div v-if="showAdd" class="ops-modal-backdrop" @click.self="showAdd = false">
      <div class="ops-modal">
        <h3>New Project</h3>
        <label>Name<input v-model="form.name" type="text" /></label>
        <label>Description<input v-model="form.description" type="text" /></label>
        <div class="ops-modal-actions">
          <button @click="addProject">Create</button>
          <button @click="showAdd = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useOpsStore } from '../store'
import type { OpsProject, OpsTask } from '../types'

const store = useOpsStore()
const showAdd = ref(false)
const selected = ref<OpsProject | null>(null)
const form = reactive({ name: '', description: '' })

function tasks(proj: OpsProject): OpsTask[] {
  return store.tasks.filter(t => proj.tasks.includes(t.id))
}

function addProject() {
  if (!form.name) return
  store.upsertProject({
    id: `proj-${Date.now()}`,
    name: form.name,
    description: form.description || undefined,
    status: 'active',
    tasks: [],
    createdAt: Date.now(),
  } as OpsProject)
  Object.assign(form, { name: '', description: '' })
  showAdd.value = false
}
</script>

<style scoped>
.ops-view { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.ops-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border-color, #333); }
.ops-header h2 { margin: 0; font-size: 1rem; font-weight: 600; }
.btn-add { font-size: 0.8rem; padding: 4px 10px; border-radius: 4px; border: 1px solid #4a9eff; background: transparent; color: #4a9eff; cursor: pointer; }
.ops-empty { padding: 24px 16px; opacity: 0.5; font-size: 0.875rem; }
.ops-grid { display: flex; flex-direction: column; gap: 8px; padding: 12px; overflow-y: auto; }
.ops-card { border: 1px solid var(--border-color, #333); border-radius: 6px; padding: 10px 14px; cursor: pointer; transition: border-color 0.15s; }
.ops-card:hover { border-color: #4a9eff; }
.ops-card-header { display: flex; align-items: center; gap: 8px; }
.ops-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ops-status-dot.active { background: #48bb78; }
.ops-status-dot.paused { background: #ed8936; }
.ops-status-dot.complete { background: #4a5568; }
.ops-proj-name { font-size: 0.9rem; font-weight: 500; }
.ops-task-count { margin-left: auto; font-size: 0.75rem; opacity: 0.5; }
.ops-proj-desc { font-size: 0.8rem; opacity: 0.6; margin-top: 4px; }
.ops-detail { border-top: 1px solid var(--border-color, #333); padding: 12px 16px; overflow-y: auto; max-height: 40%; }
.ops-detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.ops-detail-header h3 { margin: 0; font-size: 0.9rem; }
.btn-icon { background: none; border: none; cursor: pointer; opacity: 0.7; }
.ops-task-list { list-style: none; margin: 0; padding: 0; }
.ops-task-item { display: flex; gap: 8px; align-items: center; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; }
.ops-task-status { font-size: 0.7rem; padding: 1px 5px; border-radius: 3px; background: #2d3748; }
.ops-task-item.complete .ops-task-status { background: #276749; }
.ops-task-item.blocked .ops-task-status { background: #742a2a; }
.ops-task-title { flex: 1; }
.ops-priority { font-size: 0.7rem; opacity: 0.7; }
.ops-priority.critical { color: #e53e3e; }
.ops-priority.high { color: #ed8936; }
.ops-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.ops-modal { background: #1a202c; border: 1px solid #333; border-radius: 8px; padding: 20px; min-width: 320px; display: flex; flex-direction: column; gap: 10px; }
.ops-modal h3 { margin: 0 0 8px; }
.ops-modal label { display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; }
.ops-modal input { padding: 6px; border-radius: 4px; border: 1px solid #444; background: #2d3748; color: inherit; }
.ops-modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.ops-modal-actions button { padding: 6px 14px; border-radius: 4px; border: 1px solid #444; background: #2d3748; color: inherit; cursor: pointer; }
</style>
