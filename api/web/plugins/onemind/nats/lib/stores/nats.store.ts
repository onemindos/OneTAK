// nats.store.ts — Pinia store for the shared NATS WebSocket connection
// Direct port of omos-ui useNatsStore (Zustand) → Vue 3 Pinia composable pattern
// nats.ws is framework-agnostic; only the reactive wrapper changes.

import { ref, readonly } from 'vue';
import type { NatsConnection } from 'nats.ws';
import { connect, StringCodec } from 'nats.ws';

export type NatsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface NatsProfile {
    id: string;
    label: string;
    wsUrl: string;
    user?: string;
    pass?: string;
}

export const DEFAULT_PROFILES: NatsProfile[] = [
    {
        id: 'default',
        label: 'OneMind Hub',
        wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host.replace(/:\d+$/, '')}:8080`,
    },
];

// ── Singleton shared state (module-level, shared across all component instances)
const nc        = ref<NatsConnection | null>(null);
const status    = ref<NatsStatus>('disconnected');
const error     = ref<string | null>(null);
const rtt       = ref<number | null>(null);
const profiles  = ref<NatsProfile[]>(
    (() => {
        try {
            const stored = localStorage.getItem('omos-nats-profiles');
            return stored ? JSON.parse(stored) : DEFAULT_PROFILES;
        } catch { return DEFAULT_PROFILES; }
    })()
);
const activeProfileId = ref<string>(profiles.value[0]?.id ?? 'default');

const sc = StringCodec();

// ── Actions ───────────────────────────────────────────────────────────────────

async function connectToProfile(profileId: string): Promise<void> {
    const profile = profiles.value.find(p => p.id === profileId);
    if (!profile) return;

    // Close existing connection
    if (nc.value) {
        await nc.value.drain().catch(() => {});
        nc.value = null;
    }

    status.value = 'connecting';
    error.value  = null;
    activeProfileId.value = profileId;

    try {
        const conn = await connect({
            servers: [profile.wsUrl],
            ...(profile.user && profile.pass ? { user: profile.user, pass: profile.pass } : {}),
            pingInterval: 10_000,
            maxPingOut: 3,
        });

        nc.value     = conn;
        status.value = 'connected';

        // Measure RTT
        const t0 = Date.now();
        await conn.flush();
        rtt.value = Date.now() - t0;

        // Monitor for close
        void (async () => {
            for await (const _s of conn.status()) { // eslint-disable-line @typescript-eslint/no-unused-vars
                // on any status change, re-check
            }
            status.value = 'disconnected';
            nc.value     = null;
        })();

    } catch (e) {
        status.value = 'error';
        error.value  = e instanceof Error ? e.message : String(e);
    }
}

async function disconnect(): Promise<void> {
    if (nc.value) {
        await nc.value.drain().catch(() => {});
        nc.value     = null;
        status.value = 'disconnected';
    }
}

function saveProfiles(): void {
    localStorage.setItem('omos-nats-profiles', JSON.stringify(profiles.value));
}

function addProfile(p: NatsProfile): void {
    profiles.value = [...profiles.value, p];
    saveProfiles();
}

function updateProfile(p: NatsProfile): void {
    profiles.value = profiles.value.map(x => x.id === p.id ? p : x);
    saveProfiles();
}

function removeProfile(id: string): void {
    profiles.value = profiles.value.filter(p => p.id !== id);
    saveProfiles();
}

// ── Composable export (useNatsStore pattern) ──────────────────────────────────

export function useNatsStore() {
    return {
        // state (readonly refs)
        nc:              readonly(nc),
        status:          readonly(status),
        error:           readonly(error),
        rtt:             readonly(rtt),
        profiles:        readonly(profiles),
        activeProfileId: readonly(activeProfileId),
        // helpers
        sc,
        // actions
        connect:      connectToProfile,
        disconnect,
        addProfile,
        updateProfile,
        removeProfile,
    };
}
