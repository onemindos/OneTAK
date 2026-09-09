<template>
    <button
        class='flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors'
        :class='store.active
            ? "bg-blue-600/30 text-blue-300 border border-blue-600"
            : "text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent"'
        :title='store.active ? "Exit 3D Globe" : "Open 3D Globe (WGS84)"'
        @click='toggle'
    >
        <IconGlobe :size='14' />
        <span>3D</span>
    </button>
</template>

<script setup lang='ts'>
import { IconGlobe } from '@tabler/icons-vue';
import { useGlobeStore } from '../store';

const store = useGlobeStore();

function toggle() {
    store.syncFromMapLibre();
    store.active = !store.active;
}
</script>
