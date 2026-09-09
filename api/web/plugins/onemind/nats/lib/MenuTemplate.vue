<template>
    <div class='menu-template'>
        <div class='mt-header'>
            <button
                v-if='backType !== "none"'
                class='mt-back'
                @click='handleBack'
            >
                <X
                    v-if='backType === "close"'
                    :size='16'
                />
                <ArrowLeft
                    v-else
                    :size='16'
                />
            </button>
            <span class='mt-name'>{{ name }}</span>
        </div>
        <div class='mt-body'>
            <slot />
        </div>
    </div>
</template>

<script setup lang='ts'>
import { X, ArrowLeft } from 'lucide-vue-next';

withDefaults(defineProps<{
    name: string;
    backType?: 'close' | 'back' | 'none';
}>(), { backType: 'close' });

function handleBack() {
    window.history.back();
}
</script>

<style scoped>
.menu-template {
    display: flex; flex-direction: column; height: 100%;
    background: var(--cloudtak-panel-bg, rgba(13,17,23,0.98));
    color: #e6edf3;
}
.mt-header {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
}
.mt-back {
    background: none; border: none; color: rgba(255,255,255,0.4);
    cursor: pointer; padding: 2px; display: flex; align-items: center;
    border-radius: 4px;
}
.mt-back:hover { color: #e6edf3; background: rgba(255,255,255,0.07); }
.mt-name { font-weight: 700; font-size: 14px; letter-spacing: 0.01em; }
.mt-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
</style>
