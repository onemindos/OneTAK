import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MumbleChannel, MumbleUser, TalkingEvent, ConnectionState } from './types'

export const useMumbleStore = defineStore('cloudtak-mumble', () => {
    const channels = ref<Map<number, MumbleChannel>>(new Map())
    const users = ref<Map<number, MumbleUser>>(new Map())
    const mySession = ref<number | null>(null)
    const myChannelId = ref<number>(0)
    const connectionState = ref<ConnectionState>('disconnected')
    const talking = ref(false)
    const recentTalking = ref<TalkingEvent[]>([])

    const sortedChannels = computed(() =>
        [...channels.value.values()].sort((a, b) => a.name.localeCompare(b.name))
    )

    const usersInChannel = computed(() =>
        (channelId: number) => [...users.value.values()].filter(u => u.channelId === channelId)
    )

    const activeSpeakers = computed(() =>
        [...users.value.values()].filter(u => u.talking)
    )

    function upsertChannel(ch: MumbleChannel) {
        channels.value.set(ch.id, ch)
    }

    function removeChannel(id: number) {
        channels.value.delete(id)
    }

    function upsertUser(user: MumbleUser) {
        users.value.set(user.session, user)
    }

    function removeUser(session: number) {
        users.value.delete(session)
    }

    function setTalking(session: number, isTalking: boolean) {
        const user = users.value.get(session)
        if (user) {
            users.value.set(session, { ...user, talking: isTalking })
            if (isTalking) {
                recentTalking.value.unshift({
                    session,
                    name: user.name,
                    channelId: user.channelId,
                    talking: true,
                    timestamp: Date.now(),
                })
                if (recentTalking.value.length > 20) recentTalking.value.pop()
            }
        }
    }

    return {
        channels,
        users,
        mySession,
        myChannelId,
        connectionState,
        talking,
        recentTalking,
        sortedChannels,
        usersInChannel,
        activeSpeakers,
        upsertChannel,
        removeChannel,
        upsertUser,
        removeUser,
        setTalking,
    }
})
