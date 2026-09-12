<template>
    <div class="tp">
        <div class="tp-header">
            <span class="tp-title">Time Scrubber</span>
            <span class="tp-hint">Filter map entities by timestamp</span>
        </div>

        <div class="tp-body">
            <!-- Current Window -->
            <section class="tp-section">
                <div class="tp-section-header">
                    <span>Current Window</span>
                    <span :class="['tp-badge', isEnabled ? 'tp-badge--on' : 'tp-badge--off']">
                        {{ isEnabled ? 'Active' : 'Inactive' }}
                    </span>
                </div>
                <div class="tp-window">
                    <div class="tp-window-row">
                        <span class="tp-window-label">From</span>
                        <span class="tp-window-val">{{ formattedStart }}</span>
                    </div>
                    <div class="tp-window-row">
                        <span class="tp-window-label">To</span>
                        <span class="tp-window-val">{{ formattedEnd }}</span>
                    </div>
                    <div class="tp-window-row">
                        <span class="tp-window-label">Mode</span>
                        <span :class="['tp-window-mode', isLive ? 'tp-window-mode--live' : '']">
                            {{ isLive ? 'Live — end advances every 30s' : 'Manual range' }}
                        </span>
                    </div>
                </div>
            </section>

            <!-- Layer Targeting -->
            <section class="tp-section">
                <div class="tp-section-header">Layer Targeting</div>
                <div class="tp-info">
                    <p>Filters apply to map layers with IDs starting with:</p>
                    <ul class="tp-code-list">
                        <li><code>cot-</code></li>
                        <li><code>entity-</code></li>
                        <li><code>tak-</code></li>
                    </ul>
                    <p>These are the standard CoT entity layers in OneTAK.</p>
                </div>
            </section>

            <!-- Usage -->
            <section class="tp-section">
                <div class="tp-section-header">Usage</div>
                <div class="tp-info">
                    <ul>
                        <li>Use the floating panel to set your time window</li>
                        <li><strong>Live mode:</strong> automatically extends the end time every 30 seconds</li>
                        <li><strong>Apply Filter:</strong> updates layer visibility based on feature timestamps</li>
                        <li>Entity timestamps must be stored as Unix milliseconds in the <code>timestamp</code> property</li>
                    </ul>
                </div>
            </section>

            <!-- ClickHouse Integration -->
            <section class="tp-section">
                <div class="tp-section-header">ClickHouse Integration</div>
                <div class="tp-info tp-info--future">
                    <p><strong>Future:</strong> connect to ClickHouse to replay historical entity tracks.</p>
                    <p>The temporal plugin architecture is ready — queries will drive the time window and inject historical GeoJSON frames into the map sources.</p>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { isEnabled, isLive, formattedStart, formattedEnd } from '../state'
</script>

<style scoped>
.tp {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 13px;
}

.tp-header {
    padding: 12px 14px;
    border-bottom: 1px solid #21262d;
    background: #161b22;
    flex-shrink: 0;
}

.tp-title { font-weight: 600; font-size: 14px; display: block; }
.tp-hint  { color: #6e7681; font-size: 11px; }

.tp-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.tp-section {
    border: 1px solid #21262d;
    border-radius: 6px;
    overflow: hidden;
}

.tp-section-header {
    background: #161b22;
    padding: 7px 12px;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8b949e;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.tp-badge {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    text-transform: none;
    letter-spacing: 0;
}

.tp-badge--on  { background: #0d2d16; color: #4ade80; }
.tp-badge--off { background: #1f2937; color: #6b7280; }

.tp-window {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.tp-window-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.tp-window-label { color: #6e7681; width: 40px; flex-shrink: 0; }
.tp-window-val   { font-family: monospace; font-size: 11px; }
.tp-window-mode  { color: #8b949e; font-size: 11px; }
.tp-window-mode--live { color: #4ade80; }

.tp-info {
    padding: 10px 12px;
    font-size: 12px;
    color: #8b949e;
    line-height: 1.6;
}

.tp-info p  { margin: 0 0 6px; }
.tp-info ul { margin: 0; padding-left: 16px; }
.tp-info li { margin-bottom: 4px; }

.tp-code-list {
    list-style: none;
    padding: 6px 0;
    margin: 0 0 6px;
    display: flex;
    gap: 8px;
}

.tp-info code {
    background: #21262d;
    border: 1px solid #30363d;
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 11px;
    color: #e6edf3;
}

.tp-info--future {
    border-top: 2px solid #1f6feb22;
    background: #0c1a2e;
}
</style>
