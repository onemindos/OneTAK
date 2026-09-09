import { ref, readonly, watch, onUnmounted } from 'vue';
import { useNatsStore } from '../stores/nats.store';
import type { Subscription } from 'nats.ws';

export interface Agent {
    id: string;
    name: string;
    type: string;
    status: 'online' | 'idle' | 'busy' | 'offline';
    capabilities?: string[];
    lastSeen: number;
}

export function useAgents() {
    const { nc, sc } = useNatsStore();
    const agents = ref<Map<string, Agent>>(new Map());
    let sub: Subscription | null = null;

    function trySubscribe(conn: typeof nc.value) {
        if (sub) { sub.unsubscribe(); sub = null; }
        if (!conn) return;
        try {
            sub = conn.subscribe('agents.heartbeat.>');
            (async () => {
                for await (const msg of sub!) {
                    try {
                        const data = JSON.parse(sc.decode(msg.data)) as Partial<Agent>;
                        const id = data.id ?? msg.subject.split('.')[2] ?? 'unknown';
                        const next = new Map(agents.value);
                        next.set(id, {
                            id,
                            name: data.name ?? id,
                            type: data.type ?? 'agent',
                            status: (data.status as Agent['status']) ?? 'online',
                            capabilities: data.capabilities,
                            lastSeen: Date.now(),
                        });
                        agents.value = next;
                    } catch { /* ignore malformed heartbeats */ }
                }
            })().catch(() => {});
        } catch { /* subscription failed — likely no permissions */ }
    }

    const stopWatch = watch(nc, trySubscribe, { immediate: true });
    onUnmounted(() => { stopWatch(); sub?.unsubscribe(); });

    return { agents: readonly(agents) };
}
