<template>
    <div
        class='nats-bb'
        :class='status'
        :title='`NATS: ${status}${rtt ? ` · ${rtt}ms` : ""}`'
    >
        <Radio :size='14' />
        <span class='nats-bb-label'>NATS</span>
        <div class='nats-bb-dot' />
    </div>
</template>

<script setup lang='ts'>
import { Radio } from 'lucide-vue-next';
import { useNatsStore } from './stores/nats.store';
const { status, rtt } = useNatsStore();
</script>

<style scoped>
.nats-bb {
    display: flex; align-items: center; gap: 5px;
    padding: 3px 9px; cursor: pointer;
    color: rgba(255,255,255,0.35);
    font-size: 11px;
    transition: color .15s;
}
.nats-bb:hover { color: rgba(255,255,255,0.7); }
.nats-bb.connected { color: #22c55e; }
.nats-bb.error     { color: #f85149; }
.nats-bb.connecting { color: #f59e0b; }

.nats-bb-label { font-weight: 600; font-size: 10px; letter-spacing: 0.06em; }
.nats-bb-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: currentColor;
}
.nats-bb.connected .nats-bb-dot { box-shadow: 0 0 5px currentColor; }
</style>
