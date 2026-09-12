<template>
    <div class="three-panel">
        <div class="three-header">
            <span class="three-title">3D Entity Layer</span>
            <span :class="['dot', natsConnected ? 'dot--green' : 'dot--red']" />
        </div>

        <div class="three-body">
            <div class="three-stat">
                <span class="three-label">Live entities</span>
                <span class="three-value">{{ entityCount }}</span>
            </div>
            <div class="three-stat">
                <span class="three-label">NATS</span>
                <span class="three-value">{{ natsConnected ? 'Connected' : 'Offline' }}</span>
            </div>

            <p class="three-info">
                Entities from <code>ent.*.*.state</code> render as 3D meshes pinned to
                the map using a shared WebGL context (Three.js + MapLibre). Blue = friendly,
                red = hostile, yellow = unknown. Callsign labels float above each marker.
            </p>

            <p class="three-info">
                The layer stays live as long as this plugin is enabled. Pairs with the
                <strong>XR View</strong> plugin — same entities appear in both 2D overlay
                and the immersive WebXR scene.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { natsConnected, entityCount } from './state'
</script>

<style scoped>
.three-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 13px;
}

.three-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-bottom: 1px solid #21262d;
    background: #161b22;
    font-weight: 600;
    font-size: 14px;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: auto;
}
.dot--green { background: #4caf50; }
.dot--red   { background: #f44336; }

.three-body {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.three-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #161b22;
    border-radius: 6px;
    border: 1px solid #21262d;
}

.three-label { color: #8b949e; font-size: 12px; }
.three-value { font-weight: 600; }

.three-info {
    margin: 0;
    color: #6e7681;
    font-size: 12px;
    line-height: 1.5;
}
</style>
