<template>
  <div class="channel-tree">
    <div
      v-for="ch in store.sortedChannels"
      :key="ch.id"
      class="channel"
    >
      <div
        class="channel__header"
        :class="{ 'channel__header--active': store.myChannelId === ch.id }"
        @click="join(ch.id)"
      >
        <span class="channel__icon">📻</span>
        <span class="channel__name">{{ ch.name }}</span>
        <span class="channel__count">{{ store.usersInChannel(ch.id).length }}</span>
      </div>
      <UserRow
        v-for="u in store.usersInChannel(ch.id)"
        :key="u.session"
        :user="u"
      />
    </div>
    <div v-if="!store.sortedChannels.length" class="channel-tree__empty">
      No channels
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMumbleStore } from '../store'
import { joinChannel } from '../mumble'
import UserRow from './UserRow.vue'

const store = useMumbleStore()

function join(channelId: number) {
  joinChannel(channelId)
}
</script>

<style scoped>
.channel-tree__empty {
  padding: 12px;
  font-size: 12px;
  color: #444;
}

.channel {
  margin-bottom: 2px;
}

.channel__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 3px;
}

.channel__header:hover {
  background: #1a1a2e;
}

.channel__header--active {
  background: #1a2a1a;
}

.channel__icon {
  font-size: 11px;
}

.channel__name {
  flex: 1;
  font-size: 12px;
  font-weight: bold;
  color: #aaa;
}

.channel__count {
  font-size: 10px;
  color: #555;
}
</style>
