<template>
    <div class='ops-view ops-feeds'>
        <div class='ops-header'>
            <h2>Feed Systems</h2>
            <button
                class='btn-add'
                @click='showAdd = true'
            >
                + Subscribe
            </button>
        </div>

        <div
            v-if='store.feeds.length === 0'
            class='ops-empty'
        >
            No active feeds. Subscribe to a NATS subject to start receiving data.
        </div>

        <ul
            v-else
            class='ops-list'
        >
            <li
                v-for='feed in store.feeds'
                :key='feed.id'
                class='ops-item'
            >
                <div class='ops-item-header'>
                    <span
                        class='ops-dot'
                        :class='{ active: feed.active }'
                    />
                    <span class='ops-feed-name'>{{ feed.name }}</span>
                    <span class='ops-count'>{{ feed.messageCount }}</span>
                </div>
                <div class='ops-subject'>
                    {{ feed.subject }}
                </div>
                <div
                    v-if='feed.lastMessage'
                    class='ops-last'
                >
                    <span class='ops-last-ts'>{{ formatTime(feed.lastAt!) }}</span>
                    {{ truncate(feed.lastMessage) }}
                </div>
                <button
                    class='btn-toggle'
                    @click='toggleFeed(feed)'
                >
                    {{ feed.active ? 'Pause' : 'Resume' }}
                </button>
            </li>
        </ul>

        <div
            v-if='showAdd'
            class='ops-modal-backdrop'
            @click.self='showAdd = false'
        >
            <div class='ops-modal'>
                <h3>Subscribe to Feed</h3>
                <label>Name<input
                    v-model='form.name'
                    type='text'
                    placeholder='My Feed'
                ></label>
                <label>NATS Subject<input
                    v-model='form.subject'
                    type='text'
                    placeholder='onemind.data.>'
                ></label>
                <div class='ops-modal-actions'>
                    <button @click='addFeed'>
                        Subscribe
                    </button>
                    <button @click='showAdd = false'>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useOpsStore } from '../store'
import type { OpsFeed } from '../types'

const store = useOpsStore()
const showAdd = ref(false)
const form = reactive({ name: '', subject: '' })

function addFeed() {
  if (!form.name || !form.subject) return
  store.upsertFeed({
    id: `feed-${Date.now()}`,
    name: form.name,
    subject: form.subject,
    active: true,
    messageCount: 0,
  } as OpsFeed)
  Object.assign(form, { name: '', subject: '' })
  showAdd.value = false
}

function toggleFeed(feed: OpsFeed) {
  feed.active = !feed.active
}

function truncate(s: string, n = 80) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString()
}
</script>

<style scoped>
.ops-view { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.ops-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border-color, #333); }
.ops-header h2 { margin: 0; font-size: 1rem; font-weight: 600; }
.btn-add { font-size: 0.8rem; padding: 4px 10px; border-radius: 4px; border: 1px solid #48bb78; background: transparent; color: #48bb78; cursor: pointer; }
.ops-empty { padding: 24px 16px; opacity: 0.5; font-size: 0.875rem; }
.ops-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
.ops-item { padding: 10px 16px; border-bottom: 1px solid var(--border-color, #333); position: relative; }
.ops-item-header { display: flex; align-items: center; gap: 8px; }
.ops-dot { width: 8px; height: 8px; border-radius: 50%; background: #4a5568; flex-shrink: 0; }
.ops-dot.active { background: #48bb78; box-shadow: 0 0 4px #48bb78; }
.ops-feed-name { font-size: 0.9rem; font-weight: 500; }
.ops-count { margin-left: auto; font-size: 0.75rem; opacity: 0.5; }
.ops-subject { font-size: 0.75rem; font-family: monospace; opacity: 0.6; margin-top: 2px; }
.ops-last { font-size: 0.8rem; opacity: 0.7; margin-top: 4px; }
.ops-last-ts { opacity: 0.5; margin-right: 6px; }
.btn-toggle { position: absolute; right: 16px; top: 10px; font-size: 0.7rem; padding: 2px 8px; border-radius: 3px; border: 1px solid #444; background: transparent; color: inherit; cursor: pointer; }
.ops-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.ops-modal { background: #1a202c; border: 1px solid #333; border-radius: 8px; padding: 20px; min-width: 320px; display: flex; flex-direction: column; gap: 10px; }
.ops-modal h3 { margin: 0 0 8px; font-size: 1rem; }
.ops-modal label { display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; }
.ops-modal input { padding: 6px; border-radius: 4px; border: 1px solid #444; background: #2d3748; color: inherit; }
.ops-modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.ops-modal-actions button { padding: 6px 14px; border-radius: 4px; border: 1px solid #444; background: #2d3748; color: inherit; cursor: pointer; }
</style>
