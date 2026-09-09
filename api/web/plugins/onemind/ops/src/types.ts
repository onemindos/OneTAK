export interface OpsMessage {
  id: string
  subject: string
  from: string
  body: string
  receivedAt: number
  read: boolean
}

export interface OpsTask {
  id: string
  title: string
  description?: string
  status: 'pending' | 'active' | 'complete' | 'blocked'
  priority: 'low' | 'normal' | 'high' | 'critical'
  assignee?: string
  dueAt?: number
  createdAt: number
  updatedAt: number
  tags: string[]
}

export interface OpsProject {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'complete'
  tasks: string[]
  createdAt: number
}

export interface OpsFeed {
  id: string
  name: string
  subject: string
  active: boolean
  lastMessage?: string
  lastAt?: number
  messageCount: number
}

export interface OpsScheduleItem {
  id: string
  title: string
  startAt: number
  endAt?: number
  type: 'mission' | 'maintenance' | 'briefing' | 'other'
  notes?: string
}
