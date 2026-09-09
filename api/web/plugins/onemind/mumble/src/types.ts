export interface MumbleChannel {
    id: number
    name: string
    parentId: number | null
    description?: string
    temporary: boolean
    userCount: number
}

export interface MumbleUser {
    session: number
    userId?: number
    name: string
    channelId: number
    muted: boolean
    deafened: boolean
    selfMuted: boolean
    selfDeafened: boolean
    talking: boolean
    cotUid?: string
}

export interface TalkingEvent {
    session: number
    name: string
    channelId: number
    talking: boolean
    timestamp: number
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'
