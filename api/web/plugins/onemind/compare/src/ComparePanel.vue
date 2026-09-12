<template>
    <div class="cp-panel">
        <div class="cp-header">
            <span class="cp-title">Map Compare</span>
            <span class="cp-hint">Drag the divider to compare two map styles</span>
        </div>

        <div class="cp-body">
            <section class="cp-section">
                <div class="cp-section-header">How it works</div>
                <div class="cp-desc">
                    Opens a split-screen view with a draggable vertical divider. Each side loads an
                    independent map. Use the style dropdowns to set what each side shows,
                    then drag the divider to compare.
                </div>
            </section>

            <section class="cp-section">
                <div class="cp-section-header">Tips</div>
                <ul class="cp-tips">
                    <li>Use WebODM ortho tile layers on both sides to compare drone survey outputs before and after an event.</li>
                    <li>Click <strong>Sync to main map</strong> to jump both compare maps to your current viewport position.</li>
                    <li>Switch one side to Satellite and the other to Dark Matter to check label coverage.</li>
                </ul>
            </section>

            <section class="cp-section">
                <div class="cp-section-header">Available styles</div>
                <ul class="cp-style-list">
                    <li v-for="s in STYLES" :key="s.id" class="cp-style-item">
                        <span class="cp-style-dot" />
                        <span class="cp-style-label">{{ s.label }}</span>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
const STYLES = [
    { id: 'osm',       label: 'OpenStreetMap — self-hosted via tileserver-gl' },
    { id: 'satellite', label: 'Satellite — Carto Voyager' },
    { id: 'dark',      label: 'Dark Matter — Carto dark base' },
    { id: 'positron',  label: 'Positron — Carto light base' },
]
</script>

<style scoped>
.cp-panel {
    display:        flex;
    flex-direction: column;
    height:         100%;
    background:     #0d1117;
    color:          #c9d1d9;
    font-size:      13px;
}

.cp-header {
    padding:       12px 14px;
    border-bottom: 1px solid #21262d;
    background:    #161b22;
    flex-shrink:   0;
}

.cp-title { font-weight: 600; font-size: 14px; display: block; }
.cp-hint  { color: #6e7681; font-size: 11px; }

.cp-body {
    flex:           1;
    overflow-y:     auto;
    padding:        14px;
    display:        flex;
    flex-direction: column;
    gap:            14px;
}

.cp-section {
    border:        1px solid #21262d;
    border-radius: 6px;
    overflow:      hidden;
}

.cp-section-header {
    background:     #161b22;
    padding:        7px 12px;
    font-weight:    600;
    font-size:      12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color:          #8b949e;
}

.cp-desc {
    padding:     10px 12px;
    font-size:   12px;
    color:       #8b949e;
    line-height: 1.6;
}

.cp-tips {
    margin:      0;
    padding:     10px 12px 10px 28px;
    display:     flex;
    flex-direction: column;
    gap:         6px;
}

.cp-tips li {
    font-size:   12px;
    color:       #8b949e;
    line-height: 1.5;
}

.cp-style-list {
    list-style: none;
    margin:     0;
    padding:    8px 12px;
    display:    flex;
    flex-direction: column;
    gap:        6px;
}

.cp-style-item {
    display:     flex;
    align-items: center;
    gap:         8px;
    font-size:   12px;
}

.cp-style-dot {
    width:         8px;
    height:        8px;
    border-radius: 50%;
    background:    #1f6feb;
    flex-shrink:   0;
}

.cp-style-label { color: #8b949e; }
</style>
