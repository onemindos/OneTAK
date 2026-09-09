<template>
    <div class='space-y-3'>
        <p v-if='!store.configs.length' class='text-xs text-gray-500 text-center py-8'>
            No deck layers added yet. Use the 3D Tiles, Heatmap, or Trips tabs to add layers.
        </p>

        <div
            v-for='layer in store.configs'
            :key='layer.id'
            class='flex items-center justify-between bg-gray-800 rounded px-3 py-2'
        >
            <div class='flex items-center gap-2'>
                <!-- Visibility toggle -->
                <button
                    class='w-4 h-4 rounded border transition-colors flex-shrink-0'
                    :class='layer.visible ? "bg-blue-500 border-blue-400" : "border-gray-600"'
                    @click='store.updateLayerConfig(layer.id, { visible: !layer.visible })'
                />
                <div>
                    <p class='text-xs text-white'>{{ layer.label }}</p>
                    <p class='text-xs text-gray-500 uppercase'>{{ layer.type }}</p>
                </div>
            </div>
            <button class='text-xs text-red-400 hover:text-red-300' @click='store.removeLayerConfig(layer.id)'>
                Remove
            </button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { useDeckStore } from '../store';
const store = useDeckStore();
</script>
