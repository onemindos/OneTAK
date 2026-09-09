<template>
    <div class='space-y-4'>
        <p class='text-xs text-gray-400'>
            Import KML, GPX, CSV, TopoJSON, or TCX files directly as map layers.
            Drag-and-drop a file or paste a URL.
        </p>

        <!-- File drop / URL input -->
        <div
            class='border-2 border-dashed border-gray-600 rounded-lg p-4 text-center transition-colors'
            :class='dragging ? "border-blue-500 bg-blue-500/10" : "hover:border-gray-500"'
            @dragover.prevent='dragging = true'
            @dragleave='dragging = false'
            @drop.prevent='onDrop'
        >
            <p class='text-xs text-gray-400 mb-2'>Drop file here</p>
            <input ref='fileInput' type='file' class='hidden' :accept='acceptedFormats' @change='onFileInput' />
            <button class='text-xs text-blue-400 hover:text-blue-300' @click='fileInput?.click()'>Browse file</button>
        </div>

        <!-- URL input -->
        <div class='space-y-2'>
            <label class='block text-xs text-gray-400'>Or load from URL</label>
            <div class='flex gap-2'>
                <input
                    v-model='urlInput'
                    class='flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none'
                    placeholder='https://example.com/track.gpx'
                    @keydown.enter='addFromUrl'
                />
                <button
                    :disabled='!urlInput'
                    class='px-3 py-2 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors disabled:opacity-40'
                    @click='addFromUrl'
                >
                    Add
                </button>
            </div>
        </div>

        <!-- Active layers -->
        <div v-if='store.importedLayers.length' class='space-y-2'>
            <span class='text-xs text-gray-400'>Active layers</span>
            <div
                v-for='layer in store.importedLayers'
                :key='layer.id'
                class='flex items-center justify-between bg-gray-800 rounded px-3 py-2'
            >
                <div>
                    <p class='text-xs text-white'>{{ layer.label }}</p>
                    <p class='text-xs text-gray-500 uppercase'>{{ layer.format }}</p>
                </div>
                <button class='text-xs text-red-400 hover:text-red-300' @click='removeLayer(layer.id)'>Remove</button>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useMapToolsStore } from '../store';
import { addImportedLayer, loadFileAsDataUrl, removeImportedLayer } from '../tools/import';
import { v4 as uuid } from 'uuid';

const store       = useMapToolsStore();
const fileInput   = ref<HTMLInputElement | null>(null);
const urlInput    = ref('');
const dragging    = ref(false);

const acceptedFormats = '.kml,.gpx,.csv,.topojson,.json,.tcx';

function detectFormat(filename: string): 'kml' | 'gpx' | 'csv' | 'topojson' | 'tcx' | null {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: Record<string, 'kml' | 'gpx' | 'csv' | 'topojson' | 'tcx'> = {
        kml: 'kml', gpx: 'gpx', csv: 'csv', topojson: 'topojson', json: 'topojson', tcx: 'tcx',
    };
    return ext ? (map[ext] ?? null) : null;
}

async function onDrop(e: DragEvent) {
    dragging.value = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) await loadFile(file);
}

async function onFileInput(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) await loadFile(file);
}

async function loadFile(file: File) {
    const format = detectFormat(file.name);
    if (!format || !store.map) return;
    const url = await loadFileAsDataUrl(file, format);
    const layer = { id: uuid(), label: file.name, url, format };
    addImportedLayer(store.map, layer);
    store.addImportedLayer(layer);
}

function addFromUrl() {
    if (!urlInput.value || !store.map) return;
    const url    = urlInput.value.trim();
    const format = detectFormat(url) ?? 'kml';
    const prefixedUrl = url.startsWith(`${format}://`) ? url : `${format}://${url}`;
    const layer = { id: uuid(), label: url.split('/').pop() ?? url, url: prefixedUrl, format };
    addImportedLayer(store.map, layer);
    store.addImportedLayer(layer);
    urlInput.value = '';
}

function removeLayer(id: string) {
    if (!store.map) return;
    removeImportedLayer(store.map, id);
    store.removeImportedLayer(id);
}
</script>
