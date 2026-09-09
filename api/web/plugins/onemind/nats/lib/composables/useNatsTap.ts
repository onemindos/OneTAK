// useNatsTap.ts — Vue 3 composable for live NATS subject tap
// Direct port of omos-ui src/pages/agents/hooks/useNatsTap.ts (React) → Vue 3

import { ref, onUnmounted } from 'vue';
import type { Subscription } from 'nats.ws';
import { useNatsStore } from '../stores/nats.store';

export interface TapFrame {
    id:       string;
    subject:  string;
    data:     string;
    size:     number;
    ts:       number;
    replyTo?: string;
    headers?: Record<string, string[]>;
}

let _frameSeq = 0;

export function useNatsTap(maxFrames = 500) {
    const { nc, sc } = useNatsStore();
    const frames     = ref<TapFrame[]>([]);
    const paused     = ref(false);
    const subjectPat = ref<string>('');

    const activeSubs = new Map<string, Subscription>();

    function subscribe(pattern: string): void {
        if (!nc.value) return;
        if (activeSubs.has(pattern)) return; // already subscribed

        const sub = nc.value.subscribe(pattern);
        activeSubs.set(pattern, sub);

        void (async () => {
            for await (const msg of sub) {
                if (paused.value) continue;

                // Decode data
                let data: string;
                try { data = sc.decode(msg.data); } catch { data = '<binary>'; }

                // Extract headers
                let headers: Record<string, string[]> | undefined;
                if (msg.headers) {
                    headers = {};
                    for (const [k, v] of msg.headers) {
                        headers[k] = Array.isArray(v) ? v : [v];
                    }
                }

                const frame: TapFrame = {
                    id:       String(++_frameSeq),
                    subject:  msg.subject,
                    data,
                    size:     msg.data.length,
                    ts:       Date.now(),
                    replyTo:  msg.reply,
                    headers,
                };

                frames.value = [frame, ...frames.value].slice(0, maxFrames);
            }
        })();
    }

    function unsubscribe(pattern: string): void {
        activeSubs.get(pattern)?.unsubscribe();
        activeSubs.delete(pattern);
    }

    function unsubscribeAll(): void {
        for (const sub of activeSubs.values()) sub.unsubscribe();
        activeSubs.clear();
    }

    function clear(): void {
        frames.value = [];
    }

    onUnmounted(unsubscribeAll);

    return {
        frames,
        paused,
        subjectPat,
        subscribe,
        unsubscribe,
        unsubscribeAll,
        clear,
    };
}
