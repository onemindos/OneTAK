import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { OpsMessage, OpsTask, OpsProject, OpsFeed, OpsScheduleItem } from './types'

export const useOpsStore = defineStore('omos-ops', () => {
  const messages = ref<OpsMessage[]>([])
  const tasks = ref<OpsTask[]>([])
  const projects = ref<OpsProject[]>([])
  const feeds = ref<OpsFeed[]>([])
  const schedule = ref<OpsScheduleItem[]>([])
  const connected = ref(false)

  function addMessage(msg: OpsMessage) {
    messages.value.unshift(msg)
    if (messages.value.length > 500) messages.value.pop()
  }

  function markRead(id: string) {
    const msg = messages.value.find(m => m.id === id)
    if (msg) msg.read = true
  }

  function upsertTask(task: OpsTask) {
    const idx = tasks.value.findIndex(t => t.id === task.id)
    if (idx >= 0) tasks.value[idx] = task
    else tasks.value.push(task)
  }

  function upsertProject(project: OpsProject) {
    const idx = projects.value.findIndex(p => p.id === project.id)
    if (idx >= 0) projects.value[idx] = project
    else projects.value.push(project)
  }

  function upsertFeed(feed: OpsFeed) {
    const idx = feeds.value.findIndex(f => f.id === feed.id)
    if (idx >= 0) feeds.value[idx] = feed
    else feeds.value.push(feed)
  }

  const unreadCount = () => messages.value.filter(m => !m.read).length

  return {
    messages, tasks, projects, feeds, schedule, connected,
    addMessage, markRead, upsertTask, upsertProject, upsertFeed, unreadCount,
  }
})
